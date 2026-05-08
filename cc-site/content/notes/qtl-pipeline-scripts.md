---
title: "QTL完整pipeline脚本集"
date: 2025-04-01
tags: [bioinformatics, pipeline, scripts]
---

# QTL完整pipeline脚本集

从ATAC-seq到QTL mapping的完整SLURM脚本集，可以直接拿来改参数用。都是HPC上跑过的。

---

## ATAC-seq处理

```bash
#!/bin/bash
#SBATCH --job-name=ATAC
#SBATCH --output=ATAC_%A_%a.out
#SBATCH --error=ATAC_%A_%a.err
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=48:00:00
#SBATCH --partition=CU

set -euo pipefail

FASTQ_DIR="/path/to/clean_fastq"
OUTDIR="/path/to/atac_output"
GENOME="/path/to/hg38.fa"
BLACKLIST="/path/to/hg38.blacklist.bed.gz"
THREADS="${SLURM_CPUS_PER_TASK:-8}"

# 找到R1文件，自动匹配R2
shopt -s nullglob
mapfile -t R1_FILES < <(printf "%s\n" "$FASTQ_DIR"/*R1*.fq.gz "$FASTQ_DIR"/*_R1*.fq.gz | awk 'NF' | sort -V)
TOTAL=${#R1_FILES[@]}

TASK_ID="${SLURM_ARRAY_TASK_ID:-0}"
FASTQ_R1="${R1_FILES[$TASK_ID]}"
FASTQ_R2="${FASTQ_R1//R1/R2}"

SAMPLE_NAME=$(basename "$FASTQ_R1")
SAMPLE_NAME=${SAMPLE_NAME%%.*}
SAMPLE_NAME=$(echo "$SAMPLE_NAME" | sed -E 's/(\.clean|_clean)//g; s/(\.paired)//g; s/_R1.*$//; s/\.R1.*$//')

SAMPLE_OUT="$OUTDIR/$SAMPLE_NAME"
mkdir -p "$SAMPLE_OUT"/{bam,fragments,peaks,bigwig}

# 1. bwa mem比对
bwa mem -M -t "$THREADS" "$GENOME" "$FASTQ_R1" "$FASTQ_R2" \
  | samtools sort -@ "$THREADS" -m 8G -o "${SAMPLE_NAME}.sorted.bam"
samtools index "${SAMPLE_NAME}.sorted.bam"

# 2. 过滤：MAPQ>=30, 去chrM
contigs=$(samtools idxstats "${SAMPLE_NAME}.sorted.bam" | cut -f1 | grep -v -E '^$|(^chrM$)|(^MT$)' | tr '\n' ' ')
samtools view -@ "$THREADS" -b -q 30 -F 4 -F 256 -F 2048 -F 512 "${SAMPLE_NAME}.sorted.bam" $contigs > "${SAMPLE_NAME}.noMT.bam"

# 3. 去重
sambamba markdup -r -t "$THREADS" "${SAMPLE_NAME}.noMT.bam" "${SAMPLE_NAME}.dedup.bam"

# 4. Tn5 offset (+4/-5)
zcat fragments.bed.gz \
  | awk 'BEGIN{OFS="\t"} {left=$2+4; right=$3-5; if(left>=0) print $1,left,left+1; if(right>=0) print $1,right,right+1}' \
  | sort -k1,1 -k2,2n | gzip -c > Tn5.insertions.bed.gz

# 5. MACS3 callpeak
macs3 callpeak -t "${SAMPLE_NAME}.dedup.bam" -f BAMPE -g hs \
  -n "${SAMPLE_NAME}" --outdir peaks/ --nomodel --keep-dup all -q 0.01

# 6. Blacklist过滤
bedtools intersect -v -a peaks/${SAMPLE_NAME}_peaks.narrowPeak -b "$BLACKLIST" > peaks/${SAMPLE_NAME}_peaks.clean.narrowPeak

# 7. bamCoverage CPM标准化
bamCoverage -b "${SAMPLE_NAME}.dedup.bam" -o "${SAMPLE_NAME}.CPM.bw" \
  --normalizeUsing CPM --binSize 10 -p "$THREADS"
```

---

## TensorQTL cis-nominal pass

```bash
#!/bin/bash
#SBATCH --job-name=nominal
#SBATCH --partition=CU
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --output=nominal_%j.log
#SBATCH --time=5:00:00

PHENO_FILE=""
GENO_FILE=""
COV_FILE=""
OUTDIR=""

# 参数解析
while [ $# -gt 0 ]; do
    case "$1" in
        --pheno) PHENO_FILE="$2"; shift 2 ;;
        --geno) GENO_FILE="$2"; shift 2 ;;
        --cov)  COV_FILE="$2"; shift 2 ;;
        --out_dir) OUTDIR="$2"; shift 2 ;;
        --prefix) PREFIX="$2"; shift 2 ;;
        *) echo "Unknown argument $1"; exit 1 ;;
    esac
done

conda activate tensorqtl
mkdir -p "${OUTDIR}"

# Run TensorQTL cis_nominal
python3 -m tensorqtl \
    "${GENO_FILE}" \
    "${PHENO_FILE}" \
    "${PREFIX}" \
    --covariates "${COV_FILE}" \
    --mode cis_nominal \
    --output_dir "${OUTDIR}"

# 合并parquet结果
python3 -c "
import pandas as pd, glob, os
out_dir = '${OUTDIR}'
prefix = '${PREFIX}'
pattern = os.path.join(out_dir, f'{prefix}.cis_qtl_pairs.*.parquet')
parquet_files = sorted(glob.glob(pattern))
if not parquet_files:
    raise FileNotFoundError('No parquet files found')
dfs = [pd.read_parquet(f) for f in parquet_files]
merged = pd.concat(dfs, ignore_index=True)
merged.to_csv(os.path.join(out_dir, 'nominal.chrall.cis_qtl_pairs.txt.gz'),
               sep='\t', index=False, float_format='%.6g', compression='gzip')
for f in parquet_files:
    os.remove(f)  # 清理临时parquet
"
```

---

## IQN (Inverse Quantile Normalization)

```r
# IQN: 将phenotype做inverse normal transformation
# 用在QTL分析前，确保phenotype近似正态分布

library(RNOmni)

# 对每个phenotype做INT
apply_iqn <- function(pheno_matrix) {
  # pheno_matrix: genes x samples
  iqn_matrix <- apply(pheno_matrix, 1, function(x) {
    rankNorm(x)  # RNOmni::rankNorm
  })
  return(t(iqn_matrix))  # 转回genes x samples
}

# 使用
pdui_int <- apply_iqn(pdui_matrix)
```

---

## GWAS数据imputation

```r
# GWAS summary statistics imputation: 用1KG补全缺失的allele frequency
# 很多GWAS不提供AF，需要从reference panel补全

library(data.table)

impute_af_from_1kg <- function(gwas_dt, ref_dt) {
  # gwas_dt: SNP, A1, A2, BETA, SE, P, N
  # ref_dt: SNP, REF, ALT, AF_EAS, AF_EUR, AFR_AF

  # 合并
  merged <- merge(gwas_dt, ref_dt, by = "SNP", all.x = TRUE)

  # 检查等位基因方向
  merged[, flip := (A1 == ALT & A2 == REF)]
  merged[, same := (A1 == REF & A2 == ALT)]

  # flip AF where alleles are swapped
  merged[flip == TRUE, AF := 1 - AF]
  merged[!(flip | same), AF := NA]  # mismatched alleles

  return(merged)
}

# dosage提取（从imputed VCF）
# plink2 --vcf imputed.vcf.gz --dosage --out dosage_matrix
```

---

## Batch effect evaluate

```r
# 批次效应评估函数
# 三个指标：bridge distance, batch R², biology R²

evaluate_batch_correction <- function(expr_corrected, metadata, bridge_pairs) {

  # 1. Bridge distance
  get_bridge_dist <- function(expr_mat, pairs) {
    dists <- numeric(nrow(pairs))
    for (i in 1:nrow(pairs)) {
      s1 <- expr_mat[, pairs$sample1[i]]
      s2 <- expr_mat[, pairs$sample2[i]]
      dists[i] <- dist(rbind(s1, s2))
    }
    return(mean(dists))
  }

  # 2. Batch R²
  pca_res <- prcomp(t(expr_corrected), scale. = FALSE)
  pc_df <- data.frame(
    PC1 = pca_res$x[, 1],
    PC2 = pca_res$x[, 2],
    batch = metadata$batch,
    group = metadata$group
  )
  batch_r2 <- summary(lm(PC1 ~ batch, data = pc_df))$r.squared

  # 3. Biology R²
  bio_r2 <- summary(lm(PC1 ~ group, data = pc_df))$r.squared

  # 4. 综合打分（越低越好）
  score <- -0.5 * scale(dists) - 0.3 * scale(batch_r2) + 0.2 * scale(bio_r2)

  return(list(
    bridge_distance = mean(dists),
    batch_r2 = batch_r2,
    biology_r2 = bio_r2,
    composite_score = score
  ))
}
```

---

## Phenotype prepare

```r
# QTL分析前的phenotype准备
# 包含：INT + 众所周知的协变量 + PEER因子

library(data.table)
library(RNOmni)

prepare_phenotype <- function(pdui_raw, covariates_df, n_peer = 30) {

  # 1. Gene filtering (已在前面完成)
  # 2. INT transformation
  pdui_int <- t(apply(pdui_raw, 1, rankNorm))

  # 3. 合并协变量
  # covariates_df应包含：sex, age, RIN, batch, PEER1-PEERn
  # PEER因子个数 = min(30, floor(n_samples / 10))
  n_peer <- min(n_peer, floor(ncol(pdui_int) / 10))

  # 4. 输出tensorQTL格式
  pheno_df <- as.data.frame(pdui_int)
  pheno_df$id <- colnames(pdui_int)

  return(pheno_df)
}
```

---

## Population PCA

```r
# 群体结构PCA
# 用于确定ancestry分组和检测离群值

library(data.table)
library(ggplot2)
library(ggrepel)

# PLINK PCA
# plink2 --bfile data --pca 10 --out pca_results

read_pca <- function(pca_file, sample_info_file) {
  pca <- fread(pca_file, header = FALSE)
  names(pca)[1:2] <- c("FID", "sample")
  names(pca)[3:ncol(pca)] <- paste0("PC", 1:(ncol(pca) - 2))

  sample_info <- fread(sample_info_file, header = FALSE,
                         col.names = c("sample", "group"))
  pca <- merge(pca, sample_info, by = "sample")

  # 找离群值和中心点
  center_PC1 <- mean(pca$PC1)
  center_PC2 <- mean(pca$PC2)
  pca$dist_to_center <- sqrt((pca$PC1 - center_PC1)^2 +
                              (pca$PC2 - center_PC2)^2)

  # 中心代表性样本
  repre <- pca[order(dist_to_center), ][1:5, ]

  ggplot(pca, aes(x = PC1, y = PC2, color = group)) +
    geom_point(alpha = 0.6) +
    geom_point(data = repre, aes(x = PC1, y = PC2),
               color = "blue", size = 3) +
    theme_bw() +
    labs(title = "PCA Population Structure")
}
```

> 不开玩笑 真的被K值选择伤到了 交叉验证值差别微小（0.23668→0.23744→0.2380），K=2与K=3/4的区别更多是展示层级而不是对错