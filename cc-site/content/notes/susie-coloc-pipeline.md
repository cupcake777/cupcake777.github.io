---
title: "SuSiE-coloc可复用pipeline"
date: 2025-05-08
tags:
  - bioinformatics
  - coloc
  - fine-mapping
---

# SuSiE-coloc可复用pipeline

本笔记包含完整的 SuSiE-based coloc 分析 pipeline，可直接复用。配套概念笔记见 [[Coloc与Fine-mapping实战]]。

---

## 1. Population Structure: PCA 可视化

用于从 PLINK PCA 结果中识别离群样本和代表性样本：

```r
### 经典PCA数据作图法
library(ggplot2)
library(ggrepel)

df <- read.table("qc5.pca.eigenvec", header=FALSE)
names(df)[1:2] <- c("FID","sample")
names(df)[3:4] <- c("PC1","PC2")

outliers <- df[df$sample %in% c("FB-PFC-103", "FB-PFC-65"), ]

center_PC1 <- mean(df$PC1)
center_PC2 <- mean(df$PC2)
df$dist_to_center <- sqrt((df$PC1 - center_PC1)^2 + (df$PC2 - center_PC2)^2)

repre <- df[order(df$dist_to_center), ][1:5, ]  # 取最靠近中心的5个

ggplot(df, aes(x=PC1, y=PC2)) +
  geom_point() +
  geom_point(data=repre, aes(x=PC1, y=PC2), color="blue", size=3) +
  geom_point(data=outliers, aes(x=PC1, y=PC2), color="red", size=3) +
  geom_text_repel(data=repre, aes(x=PC1, y=PC2, label=sample), vjust=-1, color="blue", fontface="bold") +
  geom_text_repel(data=outliers, aes(x=PC1, y=PC2, label=sample), vjust=-1, color="red", fontface="bold") +
  labs(title="PCA Population Structure") +
  theme_bw()
ggsave("PCA_test.png",width=5, height=5, dpi=150 )
```

---

## 2. ADMIXTURE 祖源成分分析与可视化

跨 K=2~6 展示祖源成分，用参考群体标注 ancestry label：

```r
library(data.table)
library(tidyr)
library(dplyr)
library(ggplot2)
library(RColorBrewer)

Ks <- 2:6
n_mysamples <- 231
sample_info <- fread("../exp/sample.all.info", header=FALSE, col.names = c("sample", "group"))

assignment_list <- list()
myQ_long_list <- list()

for (K in Ks) {
  Q <- fread(sprintf("merged.pruned.%d.Q", K), header=FALSE)
  colnames(Q) <- paste0("Q", 1:K)
  Q_full <- cbind(sample_info, Q)
  refQ <- Q_full[(n_mysamples+1):nrow(Q_full), ]
  ref_means <- refQ[, lapply(.SD, mean), by=group, .SDcols=paste0("Q", 1:K)]
  Q_labels <- apply(as.matrix(ref_means[,-1]), 2, function(x) ref_means$group[which.max(x)])
  names(Q_labels) <- paste0("Q", 1:K)
  myQ <- Q_full[1:n_mysamples, ]
  myQ$maxQcol <- apply(myQ[, paste0("Q", 1:K), with=FALSE], 1, function(x) which.max(x))
  myQ$assigned_ancestry <- Q_labels[myQ$maxQcol]
  myQ$K <- K
  myQ_long <- myQ %>%
    pivot_longer(cols = starts_with("Q"), names_to = "Ancestry", values_to = "Fraction") %>%
    mutate(Ancestry_label = Q_labels[Ancestry])
  myQ_long_list[[as.character(K)]] <- myQ_long
  assignment_list[[as.character(K)]] <- myQ %>% count(assigned_ancestry) %>% mutate(K=K)
}

myQ_long_df <- bind_rows(myQ_long_list)
assignment_df <- bind_rows(assignment_list)

samples_of_interest <- c("FB-PFC-65", "FB-PFC-103","FB-PFC-121", "FB-PFC-75", "FB-PFC-243", "FB-PFC-254", "FB-PFC-261")
unique_samples <- samples_of_interest

myQ_long_df <- myQ_long_df %>%
  filter(sample %in% unique_samples) %>%
  mutate(
    sample = factor(sample, levels = unique_samples),
    is_highlight = sample %in% samples_of_interest[1:2]
  )

group_palette <- setNames(brewer.pal(6, "Set2"), c("CDX","CHB","CHS","JPT","KHV","sample"))

p <- ggplot(myQ_long_df, aes(x = factor(K), y = Fraction, fill = Ancestry_label, alpha = is_highlight)) +
  geom_bar(stat = "identity", color = "black") +
  facet_wrap(~sample, nrow = 1) +
  scale_fill_manual(values = group_palette) +
  scale_alpha_manual(values = c("TRUE" = 1, "FALSE" = 0.5), guide = "none") +
  theme_bw() +
  theme(
    plot.title = element_text(hjust = 0.5, face = "bold"),
    strip.background = element_rect(fill = "lightyellow", color = "grey"),
    strip.text = element_text(face = "bold")
  ) +
  xlab("K") +
  ylab("Ancestry proportion") +
  ggtitle("Ancestry composition of key samples across K")

ggsave("key_samples_ancestry.png", p, width = 2.2 * length(unique_samples), height = 5, dpi = 400)
```

---

## 3. 完整 SuSiE-coloc 批量分析 Pipeline

保存为 `run_coloc_batch.R`，通过命令行参数驱动，遍历基因列表运行 SuSiE fine-mapping + coloc。

### 3.1 核心 R 脚本

```r
#!/usr/bin/env Rscript
suppressPackageStartupMessages({
  library(data.table)
  library(optparse)
  library(coloc)
  library(ggplot2)
  library(susieR)
})

# ================================================================= #
#                         Helper Functions                          #
# ================================================================= #

#' Check dataset validity before running SuSiE
check_dataset <- function(dataset) {
  required_fields <- c("beta", "varbeta", "snp", "LD", "N")
  missing_fields <- setdiff(required_fields, names(dataset))
  if (length(missing_fields) > 0) stop(paste("Missing required fields:", paste(missing_fields, collapse = ", ")))

  n_snps <- length(dataset$beta)
  if (n_snps < 2) stop("Dataset must have at least 2 SNPs")

  # Check lengths
  for (field in c("varbeta", "snp")) {
    if (length(dataset[[field]]) != n_snps) stop(paste("Length mismatch between beta and", field))
  }

  # Check LD matrix
  if (!is.matrix(dataset$LD) || !all(dim(dataset$LD) == n_snps)) stop("LD matrix dimensions do not match number of SNPs")
  if (any(is.na(dataset$LD))) stop("NAs found in LD matrix")

  # Check for NAs in vectors
  if (any(is.na(dataset$beta))) stop("NAs found in beta values")
  if (any(is.na(dataset$varbeta))) stop("NAs found in varbeta values")

  # Check LD matrix properties
  if (any(abs(diag(dataset$LD) - 1) > 0.1)) warning("Diagonal elements of LD matrix are not all close to 1")

  eigen_values <- eigen(dataset$LD, symmetric = TRUE, only.values = TRUE)$values
  if (any(eigen_values < -1e-6)) warning("LD matrix may not be positive semi-definite")

  return(TRUE)
}


#' Run SuSiE fine-mapping safely
runsusie_safe <- function(dataset) {
  tryCatch({
    check_dataset(dataset)
    # SuSiE on Z-scores is generally robust
    z <- dataset$beta / sqrt(dataset$varbeta)
    # Ensure z-scores are finite
    if(any(!is.finite(z))) {
        message("Warning: Non-finite z-scores found. Replacing with 0.")
        z[!is.finite(z)] <- 0
    }
    fitted <- susie_rss(z, dataset$LD, L = 10, estimate_residual_variance = TRUE)
    return(fitted)
  }, error = function(e) {
    message(paste("Error in runsusie_safe:", e$message))
    return(NULL)
  })
}

# ================================================================= #
#                      Main Analysis Function                       #
# ================================================================= #

#' Run full coloc analysis for a single gene
run_coloc_for_gene <- function(gene_id, eqtl_data, gwas_data, opt) {

  message(paste0("\n", paste(rep("=", 50), collapse="")))
  message(paste0("Processing gene: ", gene_id))

  # 1. Setup output directory
  out_prefix <- file.path(opt$output_dir, gene_id, gene_id) # e.g., /path/to/output/GENE1/GENE1
  dir.create(dirname(out_prefix), showWarnings = FALSE, recursive = TRUE)

  # 2. Find shared SNPs
  share_snp <- intersect(gwas_data[[opt$gwas_snp_col]], eqtl_data$snp)
  if(length(share_snp) < 2) {
    message("Fewer than 2 shared SNPs found. Skipping.")
    return(list(gene=gene_id, result="skipped", reason="Not enough shared SNPs"))
  }
  message(paste("Found", length(share_snp), "shared SNPs."))

  eqtl_sub <- eqtl_data[snp %in% share_snp, ]
  gwas_sub <- gwas_data[get(opt$gwas_snp_col) %in% share_snp, ]

  # Harmonize order
  gwas_sub <- gwas_sub[match(eqtl_sub$snp, gwas_sub[[opt$gwas_snp_col]]), ]

  # 3. Create SNP list for PLINK
  snplist_file <- paste0(out_prefix, ".snplist")
  write.table(eqtl_sub$variant_id, snplist_file, quote=FALSE, row.names=FALSE, col.names=FALSE)

  # 4. Generate LD matrices with PLINK
  message("Generating LD matrices with PLINK...")
  plink_eqtl_prefix <- file.path(dirname(out_prefix), paste0(gene_id, "_eqtl"))
  plink_gwas_prefix <- file.path(dirname(out_prefix), paste0(gene_id, "_gwas"))

  system(sprintf("plink --%s %s --extract %s --r square --out %s", opt$eqtl_type, opt$ld_eqtl, snplist_file, plink_eqtl_prefix))
  system(sprintf("plink --%s %s --extract %s --r square --out %s --write-snplist", opt$gwas_type, opt$ld_gwas, snplist_file, plink_gwas_prefix))

  ld_eqtl_file <- paste0(plink_eqtl_prefix, ".ld")
  ld_gwas_file <- paste0(plink_gwas_prefix, ".ld")
  gwas_snplist_file <- paste0(plink_gwas_prefix, ".snplist")

  if (!file.exists(ld_eqtl_file) || !file.exists(ld_gwas_file)) {
    message("LD matrix generation failed. Skipping.")
    return(list(gene=gene_id, result="failed", reason="LD matrix generation failed"))
  }

  ld_eqtl <- as.matrix(fread(ld_eqtl_file))
  ld_gwas <- as.matrix(fread(ld_gwas_file))

  # Get SNP order from plink output files
  eqtl_ld_snps <- eqtl_sub$variant_id # PLINK should respect the order of the snplist
  gwas_ld_snps <- fread(gwas_snplist_file, header=FALSE)$V1

  # This is critical: find SNPs common to BOTH LD matrices
  common_ld_snps <- intersect(eqtl_ld_snps, gwas_ld_snps)
  if(length(common_ld_snps) < 2) {
    message("Not enough common SNPs between the two LD matrices. Skipping.")
    return(list(gene=gene_id, result="failed", reason="Not enough common SNPs in LD matrices"))
  }

  # Subset and reorder all data to match `common_ld_snps`
  eqtl_sub <- eqtl_sub[variant_id %in% common_ld_snps][match(common_ld_snps, variant_id)]
  gwas_sub <- gwas_sub[get(opt$gwas_snp_col) %in% eqtl_sub$snp][match(eqtl_sub$snp, get(opt$gwas_snp_col))]

  eqtl_idx <- match(common_ld_snps, eqtl_ld_snps)
  gwas_idx <- match(common_ld_snps, gwas_ld_snps)

  ld_eqtl <- ld_eqtl[eqtl_idx, eqtl_idx, drop=FALSE]
  ld_gwas <- ld_gwas[gwas_idx, gwas_idx, drop=FALSE]

  rownames(ld_eqtl) <- colnames(ld_eqtl) <- eqtl_sub$variant_id
  rownames(ld_gwas) <- colnames(ld_gwas) <- eqtl_sub$variant_id # Use same IDs for consistency

  # 5. Allele Harmonization
  message("Harmonizing alleles...")
  check_df <- data.table(
    snp = eqtl_sub$snp,
    eqtl_ref = eqtl_sub$ref,
    eqtl_alt = eqtl_sub$alt,
    gwas_ref = gwas_sub[[opt$gwas_ref]],
    gwas_alt = gwas_sub[[opt$gwas_alt]]
  )

  check_df[, flip := (eqtl_ref == gwas_alt & eqtl_alt == gwas_ref)]
  check_df[, no_flip := (eqtl_ref == gwas_ref & eqtl_alt == gwas_alt)]

  # Flip GWAS beta where needed
  gwas_sub[check_df$flip, (opt$gwas_beta) := -get(opt$gwas_beta)]

  # Identify and remove SNPs with ambiguous or mismatched alleles
  unmatched_snps <- check_df[!(flip) & !(no_flip), snp]
  if (length(unmatched_snps) > 0) {
    message(paste("Removing", length(unmatched_snps), "SNPs with ambiguous/mismatched alleles."))
    keep_snps <- setdiff(eqtl_sub$snp, unmatched_snps)
    if(length(keep_snps) < 2) {
      message("Not enough SNPs left after removing mismatched ones. Skipping.")
      return(list(gene=gene_id, result="failed", reason="Not enough SNPs after allele harmonization"))
    }
    # Filter all data structures again
    eqtl_sub <- eqtl_sub[snp %in% keep_snps]
    gwas_sub <- gwas_sub[get(opt$gwas_snp_col) %in% keep_snps]
    ld_eqtl <- ld_eqtl[eqtl_sub$variant_id, eqtl_sub$variant_id, drop=FALSE]
    ld_gwas <- ld_gwas[eqtl_sub$variant_id, eqtl_sub$variant_id, drop=FALSE]
  }

  # 6. Prepare datasets for coloc
  message("Preparing datasets for SuSiE...")
  dataset1 <- list(
    beta = eqtl_sub$slope,
    varbeta = eqtl_sub$slope_se^2,
    N = opt$eqtl_N,
    snp = eqtl_sub$variant_id,
    LD = ld_eqtl,
    type = "quant"
  )

  dataset2 <- list(
    beta = gwas_sub[[opt$gwas_beta]],
    varbeta = gwas_sub[[opt$gwas_se]]^2,
    N = opt$gwas_N,
    snp = eqtl_sub$variant_id, # Use same IDs
    LD = ld_gwas,
    s = gwas_sub$s, # Assuming 's' is proportion of cases for 'cc' data
    type = "cc"
  )

  # Add MAF if available, otherwise SuSiE can estimate
  if ("af" %in% colnames(eqtl_sub)) {
    dataset1$MAF <- pmin(eqtl_sub$af, 1 - eqtl_sub$af)
  }
  if (opt$gwas_af %in% colnames(gwas_sub)) {
    dataset2$MAF <- pmin(gwas_sub[[opt$gwas_af]], 1 - gwas_sub[[opt$gwas_af]])
  }

  # 7. Run SuSiE
  message("Running SuSiE on eQTL data...")
  susie_eqtl <- runsusie_safe(dataset1)
  if(is.null(susie_eqtl)) return(list(gene=gene_id, result="failed", reason="eQTL SuSiE failed"))

  message("Running SuSiE on GWAS data...")
  susie_gwas <- runsusie_safe(dataset2)
  if(is.null(susie_gwas)) return(list(gene=gene_id, result="failed", reason="GWAS SuSiE failed"))

  # 8. Run Coloc
  message("Running colocalization...")
  coloc_susie_res <- coloc.susie(susie_eqtl, susie_gwas)

  # 9. Save results
  message("Saving results...")
  write.table(coloc_susie_res$summary, file=paste0(out_prefix, "_coloc_summary.tsv"), sep="\t", row.names=F, quote=F)

  # Save SuSiE objects for detailed inspection
  saveRDS(susie_eqtl, file=paste0(out_prefix, "_susie_eqtl.rds"))
  saveRDS(susie_gwas, file=paste0(out_prefix, "_susie_gwas.rds"))
  saveRDS(coloc_susie_res, file=paste0(out_prefix, "_coloc_susie.rds"))

  # Generate plots
  png(paste0(out_prefix, "_susie_plots.png"), width=800, height=1000, res=100)
  par(mfrow=c(2,1))
  susie_plot(susie_eqtl, y="PIP", main=paste("eQTL SuSiE for", gene_id))
  susie_plot(susie_gwas, y="PIP", main=paste("GWAS SuSiE at", gene_id, "locus"))
  dev.off()

  # 10. Return summary for aggregation
  best_coloc <- if(nrow(coloc_susie_res$summary) > 0) coloc_susie_res$summary[which.max(PP.H4.abf)] else NULL

  summary_line <- list(
    gene = gene_id,
    result = "success",
    reason = NA,
    snps_shared = length(share_snp),
    snps_analyzed = nrow(dataset1$LD),
    eqtl_cs_count = length(susie_eqtl$sets$cs),
    gwas_cs_count = length(susie_gwas$sets$cs),
    coloc_cs_count = if(!is.null(best_coloc)) nrow(coloc_susie_res$summary) else 0,
    best_H0 = if(!is.null(best_coloc)) best_coloc$PP.H0.abf else NA,
    best_H1 = if(!is.null(best_coloc)) best_coloc$PP.H1.abf else NA,
    best_H2 = if(!is.null(best_coloc)) best_coloc$PP.H2.abf else NA,
    best_H3 = if(!is.null(best_coloc)) best_coloc$PP.H3.abf else NA,
    best_H4 = if(!is.null(best_coloc)) best_coloc$PP.H4.abf else NA,
    best_H4_hit1 = if(!is.null(best_coloc)) best_coloc$hit1 else NA,
    best_H4_hit2 = if(!is.null(best_coloc)) best_coloc$hit2 else NA
  )

  return(summary_line)
}


# ================================================================= #
#                            Main Script                            #
# ================================================================= #

# === 1. Parse Command Line Arguments ===
option_list <- list(
  make_option("--gene_list", type="character", help="Path to a file with one gene ID per line"),
  make_option("--eqtl_all", type="character", help="Path to the large nominal eQTL results file (all genes)"),
  make_option("--gwas", type="character", help="Path to the GWAS summary statistics file"),
  make_option("--output_dir", type="character", default="coloc_results", help="Directory to save all output"),

  # LD options
  make_option("--ld_eqtl", type="character", help="Path of LD reference for eQTL (e.g., plink bfile prefix)"),
  make_option("--ld_gwas", type="character", help="Path of LD reference for GWAS (e.g., plink bfile prefix)"),
  make_option("--eqtl_type", type="character", default="bfile", help="LD reference type for eQTL (e.g., 'bfile', 'vcf')"),
  make_option("--gwas_type", type="character", default="bfile", help="LD reference type for GWAS (e.g., 'bfile', 'vcf')"),

  # Sample size options
  make_option("--eqtl_N", type="integer", help="Sample size of eQTL data"),
  make_option("--gwas_N", type="integer", help="Sample size of GWAS data"),

  # GWAS column name options (CRITICAL for flexibility)
  make_option("--gwas_snp_col", type="character", default="rsid", help="Variant ID column in GWAS"),
  make_option("--gwas_ref", type="character", default="A1", help="Reference allele column in GWAS"),
  make_option("--gwas_alt", type="character", default="A2", help="Alternative allele column in GWAS"),
  make_option("--gwas_beta", type="character", default="BETA", help="Beta column in GWAS"),
  make_option("--gwas_se", type="character", default="SE", help="Standard Error column in GWAS"),
  make_option("--gwas_af", type="character", default="AF", help="Allele Frequency column in GWAS"),
  make_option("--gwas_pos", type="character", default="POS", help="Position column in GWAS")
)
opt <- parse_args(OptionParser(option_list=option_list))

# === 2. Load and Prepare Data ===
message("Loading all input data...")
tryCatch({
  gene_list <- fread(opt$gene_list, header = FALSE)$V1
  gwas_data <- fread(opt$gwas)
  eqtl_all_data <- fread(opt$eqtl_all)

  # Add a proportion of cases 's' to gwas_data if it's case-control
  if(!("s" %in% names(gwas_data))) {
      message("Warning: 's' (proportion of cases) not found in GWAS data. Assuming 0.5 for 'cc' type.")
      gwas_data[, s := 0.5]
  }

  dir.create(opt$output_dir, showWarnings = FALSE, recursive = TRUE)

}, error = function(e) {
  stop(paste("Failed to load initial data files. Check paths and formats. Error:", e$message))
})

# === 3. Loop Through Genes and Run Analysis ===
message(paste("Starting analysis for", length(gene_list), "genes."))
all_results <- lapply(gene_list, function(current_gene) {
  # Extract eQTL data for the current gene
  eqtl_gene_data <- eqtl_all_data[gene_id == current_gene]

  if (nrow(eqtl_gene_data) == 0) {
    message(paste("No eQTL data found for gene:", current_gene, ". Skipping."))
    return(list(gene=current_gene, result="skipped", reason="Not in eQTL file"))
  }

  # Run the main analysis function
  analysis_result <- tryCatch({
    run_coloc_for_gene(current_gene, eqtl_gene_data, gwas_data, opt)
  }, error = function(e) {
    message(paste("A critical error occurred while processing gene", current_gene, ":", e$message))
    traceback()
    return(list(gene=current_gene, result="failed", reason="Critical error in main function"))
  })

  return(analysis_result)
})

# === 4. Aggregate and Save Final Summary ===
message("Aggregating results and writing final summary...")
summary_df <- rbindlist(all_results, fill = TRUE)
fwrite(summary_df, file=file.path(opt$output_dir, "all_genes_summary.tsv"), sep="\t")

message("Analysis pipeline completed successfully!")
message(paste("Summary report saved to:", file.path(opt$output_dir, "all_genes_summary.tsv")))
```

### 3.2 Slurm 提交脚本

保存为 `submit_coloc.sh`：

```bash
#!/bin/bash
#SBATCH --job-name=coloc_batch
#SBATCH --output=coloc_batch_%j.out
#SBATCH --error=coloc_batch_%j.err
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=24:00:00
#SBATCH --partition=CU

set -e
set -o pipefail

# --- 1. Load Required Modules ---
echo "Loading required modules..."
module load R/4.2.0
module load plink/1.90

# --- 2. Define File Paths and Parameters ---
echo "Setting up parameters..."
GENE_LIST="/path/to/your/candidate_genes.txt"
EQTL_ALL_FILE="/path/to/your/all_genes.nominal_results.tsv.gz"
GWAS_FILE="/path/to/your/gwas_summary_stats.tsv.gz"
LD_EQTL_REF="/path/to/your/eqtl_ld_panel"    # plink bfile prefix
LD_GWAS_REF="/path/to/your/gwas_ld_panel"    # plink bfile prefix
EQTL_N=218
GWAS_N=50000
OUTPUT_DIR="/path/to/your/coloc_output_directory"
R_SCRIPT="run_coloc_batch.R"

# --- 3. GWAS Column Names ---
GWAS_SNP_COL="rsid"
GWAS_REF_COL="A1"
GWAS_ALT_COL="A2"
GWAS_BETA_COL="BETA"
GWAS_SE_COL="SE"
GWAS_AF_COL="AF_EUR"
GWAS_POS_COL="POS"

# --- 4. Run the R script ---
echo "Starting the R script for colocalization analysis..."

Rscript "$R_SCRIPT" \
  --gene_list "$GENE_LIST" \
  --eqtl_all "$EQTL_ALL_FILE" \
  --gwas "$GWAS_FILE" \
  --output_dir "$OUTPUT_DIR" \
  --ld_eqtl "$LD_EQTL_REF" \
  --ld_gwas "$LD_GWAS_REF" \
  --eqtl_N "$EQTL_N" \
  --gwas_N "$GWAS_N" \
  --gwas_snp_col "$GWAS_SNP_COL" \
  --gwas_ref "$GWAS_REF_COL" \
  --gwas_alt "$GWAS_ALT_COL" \
  --gwas_beta "$GWAS_BETA_COL" \
  --gwas_se "$GWAS_SE_COL" \
  --gwas_af "$GWAS_AF_COL" \
  --gwas_pos "$GWAS_POS_COL"

echo "Job completed successfully."
```

---

## 4. Pipeline 流程概览

```
gene_list + eQTL nominal results + GWAS sumstats
  → 对每个 gene:
      1. intersect shared SNPs
      2. PLINK --r square 生成 LD matrix (eQTL/GWAS 各一个参考面板)
      3. 取两个 LD matrix 的 common SNPs, subset + reorder
      4. Allele harmonization: flip mismatched beta, remove ambiguous
      5. 构建 coloc dataset (beta, varbeta, N, LD, type)
      6. runsusie_safe → susie_rss(L=10) on both datasets
      7. coloc.susie() → PP.H4 量化共定位证据
      8. 保存 summary TSV, SuSiE RDS, PIP plots
  → 汇总 all_genes_summary.tsv
```

## 5. 关键注意事项

- **LD 面板匹配**: eQTL 和 GWAS 的 LD 参考面板需要与各自样本的祖源匹配
- **allele harmonization**: pipeline 自动 flip 不一致的 beta，但会移除 ambiguous SNPs (如 A/G vs C/T)
- **PLINK LD 生成**: `--r square` 输出方阵，`--write-snplist` 确保 SNP 顺序与 LD 矩阵行/列对应
- **错误容忍**: 每个基因独立 tryCatch，单基因失败不影响批量运行
- **输入要求**: eQTL 文件需有 `gene_id`, `snp`, `variant_id`, `slope`, `slope_se`, `ref`, `alt` 列；GWAS 文件列名通过参数指定

---

## Source

原始笔记: [[18 z_dump.md]]
