# 多组织基因表达分析流程（GMTiP数据集）

> 来源：GMTiP数据集，32种组织，112个个体，约1129个样本
> 目标：同时处理32种组织的表达数据，完成QC、归一化、异常检测和可视化

---

## 1. 整体概述

本流程处理GMTiP（Genotype-Tissue Expression in Population）数据集，涵盖32种人体组织，
112个个体的1129个RNA-seq样本。分析流程包括：

1. Meta信息整理与去重
2. 组织分组映射
3. 基因过滤（GTEx标准）
4. TMM/VST归一化比较
5. WGCNA + Mahalanobis距离异常检测
6. t-SNE/PCA/MDS可视化
7. 批次效应评估（SVA vs ComBat）

最终决策：使用VST归一化，不进行异常样本移除和批次校正，因为批次效应影响不大。

---

## 2. Meta信息整理

样本ID格式：`AGTEX-{SubjectID}-{TissueCode}-{Suffix}`

```R
library(data.table)
library(ggplot2)

# 加载数据
meta <- fread("GMTiP_sex_age_112inds.csv", data.table=FALSE)
gene_exp <- fread("GMTiP_geneExp.all_samples.tpm.ALL.updated.v2.txt", data.table=FALSE)
tissue_info <- fread("GMTiP_tissue_code_and_colors.csv", data.table=FALSE)
rin_info <- fread("All_short_reads_RNA_RIN_0423.csv", data.table=FALSE)

# 解析样本ID
sample_names <- colnames(gene_exp)[-1]
get_subject <- function(x) sub("AGTEX-([A-Z0-9]+)-.*", "\\1", x)
subject_id <- sapply(sample_names, get_subject)
sample_annot <- data.frame(sample_id = sample_names, Subject = subject_id)
sample_annot <- merge(sample_annot, meta, by="Subject", all.x=TRUE)

# 提取组织编码
get_tissue_code <- function(x) strsplit(x, "-")[[1]][3]
sample_annot$Tissue_Code <- sapply(sample_annot$sample_id, get_tissue_code)
sample_annot <- merge(sample_annot, tissue_info, by="Tissue_Code", all.x=TRUE)

# 合并RIN信息
get_rin_sample_id <- function(x) {
  subject <- sub("AGTEX-[^-]+-([^-]+)-.*", "\\1", x)
  tissue_code <- sub("AGTEX-[^-]+-([^-]+)-.*", "\\1", x)
  paste0(subject, "-", tissue_code)
}
sample_annot$RIN_Sample_ID <- sapply(sample_annot$sample_id, get_rin_sample_id)
sample_annot_full <- merge(sample_annot, rin_info, by.x="RIN_Sample_ID",
                           by.y="Sample_ID", all.x=TRUE)

# 最终注释
final_annot <- sample_annot_full[, c("sample_id","Subject","Tissue","Age",
                                      "Sex","RIN","Batch","Tissue_Color_Code")]

# 去重：同一样本多条记录保留RIN最高的
dup_samples <- final_annot$sample[duplicated(final_annot$sample)]
if(length(dup_samples) > 0){
  rows_to_keep <- sapply(dup_samples, function(sid){
    rows <- which(final_annot$sample == sid)
    if(all(is.na(final_annot$RIN[rows]))) return(rows[1])
    else return(rows[which.max(final_annot$RIN[rows])])
  })
  nondup_rows <- setdiff(seq_len(nrow(final_annot)),
                         which(final_annot$sample %in% dup_samples))
  final_annot <- final_annot[c(nondup_rows, rows_to_keep), ]
}

colnames(final_annot) <- c("sample","individual","tissue","age","sex",
                            "RIN","batch","color")
fwrite(final_annot, "../metal.recode.nodup", sep='\t', col.names=TRUE)
```

**数据汇总**
- 缺失样本（无RIN/batch信息）：6个
- 重复样本：1个（保留RIN较高者）
- 去掉缺失和重复后保留1090个样本
- 移除性别偏向组织后保留1088个样本

---

## 3. 组织分组映射

将32种细粒度组织归并为主要组织组，便于下游分析和可视化：

```R
main_group_map <- c(
  Adipose = "Adipose", Blood = "Blood", Whole_Blood = "Blood",
  Muscle = "Muscle", Liver = "Liver",
  Pancreas_Body = "Pancreas", Pancreas_Head = "Pancreas", Pancreas_Tail = "Pancreas",
  Skin = "Skin", Gallbladder = "Gallbladder", Spleen = "Spleen",
  Colon = "Colon", Stomach = "Stomach", Esophagus = "Esophagus",
  Heart_Left_Atrium = "Heart", Heart_Left_Ventricle = "Heart",
  Heart_Mitral_Valve = "Heart", Heart_Right_Atrium = "Heart",
  Heart_Right_Ventricle = "Heart", Heart_Tricuspid_Valve = "Heart",
  Aortic_Arch = "Artery", Thoracic_Aorta = "Artery",
  Common_Iliac_Artery = "Artery",
  Lung_Apex = "Lung", Lung_Base = "Lung",
  Adrenal_Gland = "Adrenal_Gland",
  Lymph_node = "Other", Small_Intestine = "Other", Trachea = "Other"
)
metadata$main_group <- unname(main_group_map[as.character(metadata$tissue)])
```

颜色编码从tissue_info文件中提取，格式为hex颜色码（如`89B58B`）。

---

## 4. 基因过滤（GTEx标准）

采用GTEx项目的过滤标准：

```R
# 过滤条件
min_samples <- 0.2 * ncol(count_data)
keep1 <- rowSums(tpm_data > 0.1, na.rm = TRUE) >= min_samples
keep2 <- rowSums(count_data >= 6, na.rm = TRUE) >= min_samples
keep <- keep1 & keep2

count_filtered <- count_data[keep, ]
tpm_filtered <- tpm_data[keep, ]

# 仅保留常染色体基因
ref <- fread("autosome_annot.txt", data.table=FALSE)
colnames(ref) <- c("chr","start","end","strand","gene_id","gene_name","gene_biotype")
count_filtered <- count_filtered[rownames(count_filtered) %in% ref$gene_id,]
tpm_filtered <- tpm_filtered[rownames(tpm_filtered) %in% rownames(count_filtered),]
```

过滤标准：
- TPM > 0.1 的样本数 ≥ 总样本数的20%
- Count ≥ 6 的样本数 ≥ 总样本数的20%
- 仅保留常染色体基因

---

## 5. TMM vs VST归一化比较

两种归一化方法的比较：

```R
library(edgeR)
library(DESeq2)

# TMM归一化
count_tmm <- DGEList(count_filtered)
count_tmm <- calcNormFactors(count_tmm, method = 'TMM')
count_tmm <- as.data.frame(cpm(count_tmm, log=T))

# VST归一化
dds <- DESeqDataSetFromMatrix(countData = round(as.matrix(count_filtered)),
                             colData = metadata,
                             design = ~1)
vsd <- vst(dds, blind=TRUE)
count_vst <- assay(vsd)

# PCA比较
pca_tmm <- prcomp(t(count_tmm), scale = TRUE)
pca_vst <- prcomp(t(count_vst), scale = TRUE)
```

**结论**：TMM用于校正测序深度和组成偏差，VST消除技术偏差使方差一致。
差异分析常用VST，两者效果相近，但variance-mean图可能有明显差距。

---

## 6. WGCNA + Mahalanobis距离异常检测

### 6.1 WGCNA网络异常检测

原理：WGCNA网络分析中，Z.K衡量样本连接性，|Z.K| < -3 视为离群。
专为表达矩阵设计，考虑全局表达相关性，是主流RNA-seq分析常用方法。

### 6.2 Mahalanobis距离异常检测

原理：衡量样本在PCA空间与总体中心的距离，距离很大视为outlier。
量化多维离群，适合大数据，但对协方差矩阵估计敏感。

### 6.3 逐组织异常检测代码

```R
library(WGCNA)
library(Rtsne)
library(purrr)
library(dplyr)

# 加载并预处理数据
count_data <- fread("count_fil.txt", data.table=FALSE) %>%
  `row.names<-`(.$Gene) %>% select(-Gene)
tpm_data <- fread("tpm_fil.txt", data.table=FALSE) %>%
  `row.names<-`(.$Gene) %>% select(-Gene)
metadata <- fread("meta_fil.txt", data.table=FALSE) %>%
  `row.names<-`(.$sample)

# 移除性别偏向组织
sex_biased_tissues <- c("Ovary","Uterus","Testis","Prostate","Vagina","Penis",
                        "Fallopian_Tube","Cervix","Breast","Placenta")
metadata <- metadata[!metadata$tissue %in% sex_biased_tissues, , drop=FALSE]
keep_samples <- rownames(metadata)
count_data <- count_data[, keep_samples, drop=FALSE]
tpm_data <- tpm_data[, keep_samples, drop=FALSE]

# 基因过滤
common_genes <- intersect(rownames(count_data), rownames(tpm_data))
count_data <- count_data[common_genes, ]
tpm_data <- tpm_data[common_genes, ]
min_samples <- floor(0.2 * ncol(count_data))
keep <- rowSums(tpm_data > 0.1) >= min_samples & rowSums(count_data >= 6) >= min_samples
count_filtered <- count_data[keep, ]
ref <- fread("autosome_annot.txt", data.table=FALSE)
colnames(ref) <- c("chr","start","end","strand","gene_id","gene_name","gene_biotype")
count_filtered <- count_filtered[rownames(count_filtered) %in% ref$gene_id, ]

# VST归一化
dds <- DESeqDataSetFromMatrix(countData = round(as.matrix(count_filtered)),
                              colData = metadata, design = ~1)
vsd <- vst(dds, blind = TRUE)
vst_matrix <- assay(vsd)

# 组织分组映射
main_group_map <- c(
  Adipose = "Adipose", Whole_Blood = "Blood", Muscle = "Muscle", Liver = "Liver",
  Pancreas_Body = "Pancreas", Pancreas_Head = "Pancreas", Pancreas_Tail = "Pancreas",
  Skin = "Skin", Gallbladder = "Gallbladder", Spleen = "Spleen", Colon = "Colon",
  Stomach = "Stomach", Esophagus = "Esophagus", Heart_Left_Atrium = "Heart",
  Heart_Left_Ventricle = "Heart", Heart_Mitral_Valve = "Heart",
  Heart_Right_Atrium = "Heart", Heart_Right_Ventricle = "Heart",
  Heart_Tricuspid_Valve = "Heart", Aortic_Arch = "Artery", Thoracic_Aorta = "Artery",
  Common_Iliac_Artery = "Artery", Lung_Apex = "Lung", Lung_Base = "Lung",
  Adrenal_Gland = "Adiral_Gland", `Lymph node` = "Other",
  Small_Intestine = "Other", Trachea = "Other"
)
metadata$main_group <- unname(main_group_map[as.character(metadata$tissue)])

# 颜色设置
tissue_colors <- unique(metadata[, c("tissue", "color")])
tissue_colors <- setNames(paste0("#", tissue_colors$color), tissue_colors$tissue)

# 逐组织异常检测
all_tissue <- sort(unique(metadata$tissue[!is.na(metadata$tissue)]))
wgcna_outliers <- c()
mahal_outliers <- c()

for(tissue in all_tissue) {
  tissue_samples <- metadata$sample[metadata$tissue == tissue]
  present_samples <- tissue_samples[tissue_samples %in% colnames(vst_matrix)]
  vst_sub <- vst_matrix[, present_samples, drop = FALSE]

  # 过滤低变异基因和样本
  vst_sub <- vst_sub[apply(vst_sub, 1, function(x)
    length(unique(x)) > 1 & !any(is.na(x)) & sd(x) > 0), , drop = FALSE]
  vst_sub <- vst_sub[, apply(vst_sub, 2, function(x)
    !any(is.na(x)) & sd(x) > 0), drop = FALSE]
  if(ncol(vst_sub) < 3) next

  # WGCNA: 网络连接性Z分数
  netadj <- adjacency(as.matrix(vst_sub), type = 'signed', corFnc = 'bicor')
  netsum <- fundamentalNetworkConcepts(netadj)
  Z.K <- as.numeric(scale(netsum$Connectivity))
  names(Z.K) <- colnames(vst_sub)
  wgcna_outliers <- c(wgcna_outliers, names(Z.K)[!is.na(Z.K) & Z.K < -3])

  # Mahalanobis距离
  pca_obj <- prcomp(t(vst_sub), scale. = TRUE)
  ndim <- min(10, ncol(pca_obj$x), nrow(pca_obj$x) - 1)
  pca_scores <- pca_obj$x[, 1:ndim, drop = FALSE]
  cov_mat <- cov(pca_scores)
  if (det(cov_mat) == 0) cov_mat <- MASS::ginv(cov(pca_scores))
  mahal_dist <- mahalanobis(pca_scores,
                           center = colMeans(pca_scores), cov = cov_mat)
  threshold_mahal <- qchisq(0.995, df = ndim)
  mahal_outliers <- c(mahal_outliers, names(mahal_dist)[mahal_dist > threshold_mahal])
}
```

**决策**：两种方法共同检测出的outlier才需要移除。

---

## 7. t-SNE可视化

```R
set.seed(2025)
tsne <- Rtsne(t(vst_matrix), perplexity = 28, verbose = TRUE, check_duplicates = FALSE)
pca_obj <- prcomp(t(vst_matrix), scale. = TRUE)

# 构建绘图数据框
plot_df <- as.data.frame(cbind(tsne$Y, pca_obj$x[, 1:2]))
colnames(plot_df) <- c("TSNE1", "TSNE2", "PC1", "PC2")
plot_df$sample <- rownames(plot_df)
plot_df <- merge(plot_df, metadata, by = "sample", all.x = TRUE)

# 标记异常类型
plot_df <- plot_df %>%
  mutate(
    outlier = case_when(
      sample %in% wgcna_outliers & sample %in% mahal_outliers ~ "both",
      sample %in% wgcna_outliers ~ "wgcna",
      sample %in% mahal_outliers ~ "mahal",
      TRUE ~ "none"
    )
  )

# 计算组织中心标签
main_group_centers_tsne <- plot_df %>%
  filter(!is.na(main_group) & main_group != "Other") %>%
  group_by(main_group) %>%
  summarise(TSNE1 = mean(TSNE1), TSNE2 = mean(TSNE2), .groups = 'drop')

# 颜色映射
outlier_colors <- c("both"="#E31A1C", "mahal"="#1F78B4",
                    "wgcna"="#33A02C", "none"="black")

# 绘制t-SNE图
tsne_plot <- ggplot(plot_df, aes(x=TSNE1, y=TSNE2)) +
  geom_point(data=subset(plot_df, outlier=="none"),
             aes(fill=tissue), size=2.5, shape=21, stroke=0.3, alpha=0.8) +
  geom_point(data=subset(plot_df, outlier!="none"),
             aes(fill=tissue, color=outlier), size=3.5, shape=21,
             stroke=1.5, alpha=0.9) +
  scale_fill_manual(values=tissue_colors, name="Tissue") +
  scale_color_manual(values=outlier_colors, name="Outlier Type") +
  geom_label_repel(data=main_group_centers_tsne,
                   aes(label=main_group), size=4, fontface="bold",
                   fill=alpha("white",0.8)) +
  theme_bw(base_size=12) +
  labs(title="t-SNE Analysis: Sample Clustering with Outlier Detection")

ggsave("tsne_outlier.png", tsne_plot, width=12, height=10, dpi=300, bg="white")
```

---

## 8. 批次效应评估

### 8.1 SVA vs ComBat比较

```R
library(sva)

# SVA批次校正
mod <- model.matrix(~ tissue + age + sex + RIN + batch, data = metadata)
mod0 <- model.matrix(~ age + sex + RIN + batch, data = metadata)
sva_obj <- sva(vst_matrix, mod, mod0)
svs <- sva_obj$sv

# ComBat批次校正
combat_matrix <- ComBat(dat = vst_matrix, batch = metadata$batch)

# PCA比较三种方案
pca_raw <- prcomp(t(vst_matrix), scale. = TRUE)
pca_sva <- prcomp(t(removeBatchEffect(vst_matrix, covariates = svs)), scale. = TRUE)
pca_combat <- prcomp(t(combat_matrix), scale. = TRUE)
```

**结论**：校正批次后Blood样本反而混入其他组织群，说明批次效应不是主要变异来源。
最终选择VST归一化，不移除outlier，不校正批次。

---

## 9. MDS分析与组织层级聚类

```R
# MDS分析
mds_full_corr <- cmdscale(dist(t(vst_matrix)), k=2, eig=TRUE)
eigvals_corr <- mds_full_corr$eig
prop1_corr <- round(100 * eigvals_corr[1] / sum(eigvals_corr[eigvals_corr > 0]), 1)
prop2_corr <- round(100 * eigvals_corr[2] / sum(eigvals_corr[eigvals_corr > 0]), 1)

# 组织层级聚类（基于平均表达相关性）
expr_by_tissue <- sapply(all_tissue, function(grp) {
  idx <- meta$tissue == grp
  if(sum(idx) > 0) rowMeans(vst_matrix[, idx, drop=FALSE], na.rm=TRUE)
  else rep(NA, nrow(vst_matrix))
})
dist_mat_tissue <- as.dist(1 - cor(expr_by_tissue))
hc <- hclust(dist_mat_tissue, method="average")

# 带颜色标签的树状图
library(dendextend)
dend <- as.dendrogram(hc)
labels_cex(dend) <- 0.7
labels_colors(dend) <- tissue_colors[labels(dend)]
plot(dend, main="Tissue Hierarchical Clustering",
     ylab="Distance (1 - Pearson correlation)")
```

---

## 10. 关键决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 归一化方法 | VST | 差异分析标准选择，方差稳定 |
| 异常检测 | WGCNA + Mahalanobis | 两种方法共检出的样本才移除 |
| 批次校正 | 不校正 | 校正后Blood混入其他组，影响不大 |
| 性别偏向组织 | 移除 | 避免性别效应干扰 |
| 基因过滤 | GTEx标准 | TPM>0.1 & Count≥6，≥20%样本 |

---

## 11. 依赖包清单

```R
suppressPackageStartupMessages({
  library(data.table)    # 高效数据读写
  library(ggplot2)       # 绑定
  library(ggrepel)       # 标签防重叠
  library(edgeR)         # TMM归一化
  library(DESeq2)        # VST归一化
  library(WGCNA)         # 网络异常检测
  library(Rtsne)         # t-SNE降维
  library(sva)           # 批次效应校正
  library(dendextend)    # 树状图美化
  library(patchwork)     # 图形拼接
  library(purrr)         # 函数式编程
  library(dplyr)         # 数据操作
})
```
