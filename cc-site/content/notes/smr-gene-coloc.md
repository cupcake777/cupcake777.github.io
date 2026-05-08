---
title: SMR分析与基因水平coloc
tags: [bioinformatics, SMR, coloc, fine-mapping, eqtl, gwas]
created: 2026-05-08
---

# SMR分析与基因水平coloc

## SMR (Summary-based Mendelian Randomization) 基本命令

SMR用于整合GWAS和eQTL摘要数据，检测基因表达与表型的关联。

```bash
# 最简用法
smr --bfile <plink_prefix> \
    --gwas-summary <gwas.ma> \
    --beqtl-summary <eqtl_besd> \
    --out <output_prefix> \
    --thread-num 6

# 完整参数（推荐）
smr --bfile ../raw_data/fetal \
    --gwas-summary mygwas.ma \
    --beqtl-summary eqtl \
    --peqtl-smr 5e-8 \
    --ld-upper-limit 0.9 \
    --ld-lower-limit 0.05 \
    --peqtl-heidi 1.57e-3 \
    --heidi-min-m 3 \
    --heidi-max-m 20 \
    --cis-wind 2000 \
    --thread-num 5 \
    --out mysmr
```

### 参数说明

| 参数 | 说明 |
| --- | --- |
| `--bfile` | plink二进制文件前缀，提供LD参考 |
| `--gwas-summary` | GWAS摘要统计文件（.ma格式） |
| `--beqtl-summary` | eQTL BESD格式摘要数据 |
| `--peqtl-smr` | SMR检验p值阈值（如5e-8） |
| `--ld-upper-limit` | LD上界，过滤高相关SNP（默认0.9） |
| `--ld-lower-limit` | LD下界，过滤低相关SNP（默认0.05） |
| `--peqtl-heidi` | HEIDI检验p值阈值（默认1.57e-3） |
| `--heidi-min-m` | HEIDI最小SNP数（默认3） |
| `--heidi-max-m` | HEIDI最大SNP数（默认20） |
| `--cis-wind` | cis窗口大小(kb)，默认2000 |

---

## HEIDI检验解读

HEIDI（Heterogeneity in Dependent Instruments）检验用于区分以下两种情况：

- **多效性（pleiotropy）**：同一因果变异同时影响基因表达和表型 → HEIDI不显著（p > 阈值）
- **连锁（linkage）**：两个不同但连锁的因果变异分别影响基因表达和表型 → HEIDI显著（p < 阈值）

> **判定标准**：HEIDI p值 > 1.57e-3 → 支持共定位/多效性模型；p值 < 1.57e-3 → 提示连锁但非共定位，应排除该基因。

SMR输出的`p_HEIDI`列即为HEIDI检验结果，用于筛选可靠SMR信号。

---

## 基因水平coloc分析流程

以下流程将特定基因（示例中使用GeneA/GeneB泛化命名）的eQTL与GWAS进行基因水平共定位分析。

### Step 1: 提取区域基因型

```bash
# 用bcftools提取目标区域的基因型
bcftools view -r chr12:5946467-7961316 \
    /path/to/1KG/EAS.chr12.vcf.gz \
    -Oz -o GeneA.vcf.gz

# 批量提取多个区域（创建region.txt）
# 格式: chr:start-end
bcftools view -R region.txt \
    /path/to/keep.sample.vcf.gz \
    -Oz -o fetal.vcf.gz

# 转为plink格式
plink --vcf fetal.vcf.gz --make-bed --keep-allele-order --out fetal
```

### Step 2: 提取LD矩阵

```bash
# eQTL参考LD
plink --bfile /path/to/eqtl/genotype \
      --extract GeneA.eqtl.snplist \
      --r square \
      --out GeneA.eqtl

# GWAS参考LD（以1KG EAS为参考）
plink --bfile /path/to/1KG/EAS.all \
      --extract GeneA.eqtl.snplist \
      --maf 0.01 \
      --r square \
      --out GeneA.gwas \
      --write-snplist
```

> 注意：某些基因位点可能存在大量低MAF变异，需加`--maf 0.01`过滤后再计算LD。

### Step 3: LD矩阵对齐

关键步骤——确保eQTL和GWAS的LD矩阵行列名一致、维度匹配：

```r
# 读取LD矩阵和SNP列表
eqtl_ld <- fread("GeneA.eqtl.ld", data.table=FALSE)
gwas_ld <- fread("GeneA.gwas.ld", data.table=FALSE)
eqtl_snp <- fread("GeneA.eqtl.snplist", header=FALSE)
gwas_snp <- fread("GeneA.gwas.snplist", header=FALSE)

# 设置行列名
colnames(eqtl_ld) <- rownames(eqtl_ld) <- eqtl_snp$V1
colnames(gwas_ld) <- rownames(gwas_ld) <- gwas_snp$V1

# 提取共有SNP子集并按相同顺序排列
share <- intersect(gwas_snp$V1, eqtl_snp$V1)
eqtl_ld <- eqtl_ld[match(share, rownames(eqtl_ld)),
                    match(share, colnames(eqtl_ld)), drop=FALSE]
gwas_ld <- gwas_ld[match(share, rownames(gwas_ld)),
                    match(share, colnames(gwas_ld)), drop=FALSE]

# 同步对齐eQTL和GWAS摘要数据
eqtl <- eqtl[eqtl$variant_id %in% share, ]
eqtl <- eqtl[match(share, eqtl$variant_id), ]
gwas <- gwas[gwas$snp_col %in% share, ]
gwas <- gwas[match(eqtl$snp, gwas$snp_col), ]
```

### Step 4: 等位基因方向校验与翻转

```r
check <- merge(
  eqtl[, c("snp", "ref", "alt")],
  gwas[, c("snp_col", "A1", "A2")],
  by.x = "snp", by.y = "snp_col"
)

check$flip <- NA
check$flip[check$ref == check$A1 & check$alt == check$A2] <- FALSE
check$flip[check$ref == check$A2 & check$alt == check$A1] <- TRUE

# 翻转GWAS效应方向
snps_to_flip <- check$snp[which(check$flip)]
gwas$BETA[match(snps_to_flip, gwas$snp_col)] <-
  -gwas$BETA[match(snps_to_flip, gwas$snp_col)]

# 移除无法匹配的SNP
snps_unmatched <- check$snp[is.na(check$flip)]
gwas <- gwas[!gwas$snp_col %in% snps_unmatched, ]
eqtl <- eqtl[!eqtl$snp %in% snps_unmatched, ]
```

### Step 5: 去除高相关SNP（SuSiE前处理）

```r
remove_high_corr <- TRUE
if (remove_high_corr) {
  # 阈值通常设为0.95或0.99
  high_corr1 <- which(rowSums(abs(dataset1$LD) > 0.95) > 1)
  if (length(high_corr1) > 0) {
    keep1 <- setdiff(1:nrow(dataset1$LD), high_corr1)
    for (n in names(dataset1)) {
      if (length(dataset1[[n]]) == nrow(dataset1$LD))
        dataset1[[n]] <- dataset1[[n]][keep1]
    }
    dataset1$LD <- dataset1$LD[keep1, keep1, drop=FALSE]
  }
  # 对dataset2同理
}
```

> **为什么要去高相关SNP**：高度相关的SNP在同一个haplotype block中，fine-mapping算法会在推断效应时不稳定，导致先验方差估算异常大、数值发散。

### Step 6: 构建SuSiE输入

```r
# eQTL dataset（quantitative trait）
dataset1 <- list(
  beta     = eqtl$slope,
  varbeta  = eqtl$slope_se^2,
  position = eqtl$pos,
  N        = N_eqtl,          # eQTL样本量
  LD       = as.matrix(eqtl_ld),
  snp      = eqtl$variant_id,
  pvalue   = eqtl$pval_nominal,
  type     = "quant",
  MAF      = pmin(eqtl$af, 1 - eqtl$af)
)

# GWAS dataset（case-control）
dataset2 <- list(
  beta     = gwas$BETA,
  varbeta  = gwas$SE^2,
  position = gwas$POS,
  N        = N_gwas,          # GWAS样本量
  LD       = as.matrix(gwas_ld),
  snp      = gwas$ID,
  pvalue   = gwas$P,
  type     = "cc",
  MAF      = pmin(gwas$AF, 1 - gwas$AF)
)
```

### Step 7: SuSiE Fine-mapping + coloc

```r
library(susieR)
library(coloc)

# SuSiE fine-mapping
susie_eqtl <- runsusie(dataset1)
susie_gwas <- runsusie(dataset2)

# SuSiE-based coloc
susie.res <- coloc.susie(susie_eqtl, susie_gwas)
write.table(susie.res$summary, "GeneA_coloc_summary.txt",
            row.names=FALSE, sep='\t', quote=FALSE)

# 传统ABF coloc（补充验证）
coloc_res <- coloc.abf(
  list(beta=eqtl$slope, varbeta=eqtl$slope_se^2, N=N_eqtl,
       snp=eqtl$variant_id, pvalue=eqtl$pval, MAF=eqtl$maf, type="quant"),
  list(beta=gwas$BETA, varbeta=gwas$SE^2, N=N_gwas,
       snp=gwas$ID, pvalue=gwas$P, type="cc",
       MAF=pmin(gwas$AF, 1-gwas$AF))
)
```

---

## 共定位结果解读

### PP.H0–H4含义

| 假设 | 含义 |
| --- | --- |
| **PP.H0** | 两个表型均无关联信号 |
| **PP.H1** | 仅eQTL有独立信号 |
| **PP.H2** | 仅GWAS有独立信号 |
| **PP.H3** | 两个独立信号，不共定位 |
| **PP.H4** | **共定位：同一因果变异** |

PP.H4 ≥ 0.75 → 强共定位证据；0.5–0.75 → 中等；< 0.25 → 无证据。

### 实际案例示例

某基因（GeneA）的ABF coloc结果：

```
PP.H0.abf  PP.H1.abf  PP.H2.abf  PP.H3.abf  PP.H4.abf
  0.0911     0.4640     0.0698     0.3560     0.0196
```

→ PP.H4仅1.96%，**不支持共定位**。PP.H1和PP.H3主导，提示eQTL信号独立存在但与GWAS信号不重叠。

某基因（GeneB）在coloc.susie中获得高PP.H4，eQTL和GWAS均指向同一SNP，LD矩阵显示正常block结构而非稀疏对角阵。

### 效应方向比较示例

| rsid | variant_id | maf | slope | slope_se | pval_nominal |
| --- | --- | --- | --- | --- | --- |
| rs_A | chr_pos:REF:ALT | 0.484 | –0.190 | 0.033 | 3.67×10⁻⁸ |
| rs_B | chr_pos:REF:ALT | 0.447 | 0.150 | 0.033 | 7.88×10⁻⁶ |
| rs_C | chr_pos:REF:ALT | 0.617 | –0.179 | 0.032 | 1.16×10⁻⁷ |

→ 效应方向相反的SNP需检查是否为不同独立信号或等位基因翻转问题。

---

## 可视化

### SuSiE PIP图

```r
png("finemap_summary.png", width=10, height=8, units="in", res=300)
par(mfrow = c(2, 1))
susie_plot(susie_eqtl, y = "PIP", ylab = "eQTL PIP")
susie_plot(susie_gwas, y = "PIP", ylab = "GWAS PIP")
dev.off()
```

### coloc热力图

```r
p <- ggplot(susie.res$summary, aes(x=hit1, y=hit2, fill=PP.H4.abf)) +
  geom_tile(color="grey80") +
  scale_fill_gradient(low="white", high="red", name="PP.H4") +
  labs(x="eQTL CS tag SNP", y="GWAS CS tag SNP") +
  theme_minimal()
ggsave("coloc_heatmap.png", p, height=4, width=5)
```

### LD矩阵热力图

```r
library(pheatmap)
png("GeneA_LD.png", width=8, height=10, units="in", res=300)
pheatmap(dataset1$LD,
         cluster_rows = FALSE, cluster_cols = FALSE,
         show_rownames = FALSE, show_colnames = FALSE,
         color = colorRampPalette(c("blue","white","red"))(100),
         main = "LD matrix")
dev.off()
```

> **诊断意义**：LD矩阵非稀疏对角阵 → 区间内SNP有正常LD结构；高PP.H4且eQTL/GWAS指向同一SNP → coloc结果可靠。

---

## 常见问题

### Credible Set全为单SNP

如果credible set全部只有1个SNP，coloc.susie的生物学解释力很弱，容易出现大量假阳性共定位——因为只要对方区域有你的SNP就"共定位"了。此时应检查LD矩阵质量和SuSiE参数。

### check_dataset失败

通常是高度相关的SNP导致数值不稳定，需要先去除`|r| > 0.95`的冗余SNP对。

### MAF过小

某些基因位点存在大量低频变异，需要在计算LD前加`--maf 0.01`过滤。
