---
title: SMR与GWAS数据整合
tags: [bioinformatics, SMR, GWAS, TensorQTL, FastQTL, power-analysis, eqtl]
created: 2026-05-08
source: 2025/01 a_working_diary.md
---

# SMR与GWAS数据整合

本文补充 [[SMR分析与基因水平coloc.md]] 中未覆盖的实操细节：GWAS公开数据源获取与格式转换、SMR输入文件构建、TensorQTL与FastQTL一致性分析、以及模拟数据的power analysis设计。

---

## 一、GWAS公开数据源

做SMR/coloc分析时，GWAS summary statistics来源非常关键。以下是常用数据源及其URL：

| 数据源 | URL | 说明 |
| --- | --- | --- |
| GWAS Catalog | https://www.ebi.ac.uk/gwas/ | 最全面的GWAS结果仓库 |
| JENGER (RIKEN) | http://jenger.riken.jp/en/ | 日本精神疾病GWAS |
| PheWeb Japan | https://pheweb.jp/downloads | 日本人群PheWeb结果下载 |
| PGC | https://pgc.unc.edu/ | 精神疾病遗传学联盟 |
| GRASP | https://grasp.nhlbi.nih.gov/FullResults.aspx | 全基因组关联研究辅助平台 |
| ToMMo / JMorp | https://jmorp.megabank.tohoku.ac.jp/202109/gwas/ | 东北大学百万基因组计划 |
| KoreanChip | https://www.koreanchip.org/downloads | 韩国芯片数据 |
| KOGES | https://koges.leelabsg.org/ | 韩国国家生物样本库 |

实际使用的GWAS数据集举例：
- PTSD: VA Million Veteran Program（2068 traits, Diversity and scale）
- MDD: Sparse whole-genome sequencing in 10640 Han Chinese
- BIP: PGC bipolar disorder
- SCZ: PGC schizophrenia
- PD: Japan PD GWAS

---

## 二、GWAS Summary Statistics格式转换

### 2.1 SMR要求的输入格式

SMR的GWAS summary statistics要求8列，表头不作为关键字会被程序跳过：

```
SNP  A1  A2  freq  b  se  p  n
```

- **A1** = effect allele（通常是alt列，按bim文件输出格式）
- **A2** = other allele
- **freq** = A1的等位基因频率
- **b** = effect size（case-control研究用log(OR)）
- **se** = standard error
- **p** = p-value
- **n** = sample size

> **注意**：对于case-control研究，effect size应该是log(odds ratio)及其对应的标准误，与coloc的要求基本一致。

### 2.2 PGC BIP数据转换实例

```bash
# 从PGC原始数据提取SMR所需列
# 原始列: SNP(1) A1(4) A2(5) freq(18) b(19) se(8) p(9) n(15+16)
awk 'NR > 1 {print $1, $4, $5, $18, $19, $8, $9, $15+$16}' \
    pgc.bip.hg38.txt | sort -u > ../SMR/pgc.bip.ma

# 添加表头
(echo "SNP A1 A2 freq b se p n"; cat pgc.bip.ma) > tmp.txt && \
    mv tmp.txt pgc.bip.ma
```

类似地，Depression数据也需要添加表头：
```bash
(echo "SNP A1 A2 freq b se p n"; cat Depression.ma) > tmp.txt && \
    mv tmp.txt Depression.ma
```

### 2.3 SNP ID注释：dbSNP映射

当GWAS数据使用chr:pos:ref:alt作为SNP ID而SMR需要rsID时：

```bash
# 从dbSNP参考文件生成映射表
bcftools query -f '%CHROM:%POS:%REF:%ALT\t%ID\n' \
    GCF_000001405.40.gz > dbsnp_chr_pos_ref_alt2rsid.tsv
```

原始variants: 5,189,497 → rsID匹配: 5,183,450 → 成功率: 99.88%

### 2.4 等位基因质量问题

在构建SMR输入时，需要注意参考基因组中可能存在的非标准等位基因。实际排查发现：

```bash
# 检查含N或其他非ACGT字符的变异
awk -F"\t" '($4 ~ /N/ || $5 ~ /N/ || $4 ~ /[^ACGT]/ || $5 ~ /[^ACGT,]/) {print}' \
    fetal.chrall.pvar | head
```

常见问题来源：imputation处理INDEL和SV时产生的异常allele（如`TCCCTTCCCCTTTCCGCTTCCTCTNC`）。解决方案：**直接过滤掉所有含非标准碱基的变异**。

### 2.5 Case-Control等位基因频率重建

当GWAS数据缺少总体AF但有case/control分别的频率时：

```R
library(data.table)

# 方法1：从case/control频率加权计算
data[, AF := ((NCAS * FCAS) + (NCON * FCON)) / (NCAS + NCON)]
data[, MAF := pmin(AF, 1 - AF)]

# 方法2：从总体AF和case频率反推case数
# （Japan GWAS数据中case数缺失的情况）
denominator <- gwas_data$AF.Cases - gwas_data$AF.Controls
numerator <- gwas_data$AF_Allele2 - gwas_data$AF.Controls
gwas_data[, Ncase := ifelse(denominator != 0,
                             N * numerator / denominator, NA_real_)]
gwas_data[, Ncase := pmax(0, pmin(N, Ncase))]
gwas_data[, s := Ncase / N]
```

### 2.6 等位基因频率与参考面板的差异检查

整合GWAS与eQTL数据前，应检查GWAS AF与参考面板（如HRC Asian）的一致性：

```
Total SNPs checked: 4,874,045
SNPs with freq diff > 0.10: 1,181,121 (24.23%)
SNPs with freq diff > 0.15: 1,083,371 (22.23%)
SNPs with freq diff > 0.20:   993,294 (20.38%)
```

> 如果>20%的SNP频率差异>0.1，说明GWAS数据可能来自不同人群或存在质量issue，需要重新整理GWAS或更换参考面板。

---

## 三、SMR BESD文件构建

将自定义eQTL数据转为SMR所需的BESD格式：

```bash
# 从eQTL结果文件创建BESD
smr --qfile ptpn6.eqtl --make-besd --out ptpn6

# eQTL输入文件格式（tab分隔）:
# SNP  Chr  BP  A1  A2  Freq  Probe  Probe_Chr  Probe_bp  Gene  Orientation  b  se  p
```

实际运行的SMR命令示例：

```bash
# 单基因分析（示例：SFXN2与PD）
smr --bfile /path/to/fetal \
    --gwas-summary jp.pd.ma \
    --beqtl-summary sfxn2 \
    --peqtl-smr 1.61e-5 \
    --out sfxn2.pd \
    --thread-num 5

# 批量分析（示例：PTPN6与SCZ）
smr --bfile /path/to/fetal \
    --gwas-summary ../SCZ.ma \
    --beqtl-summary ptpn6 \
    --peqtl-smr 1.1e-5 \
    --out scz \
    --thread-num 10
```

注意`--peqtl-smr`阈值的设定：对于单基因分析可用较宽松阈值（如1e-5），全基因组分析则用5e-8。

---

## 四、TensorQTL与FastQTL一致性分析

### 4.1 工具选择的影响

TensorQTL和FastQTL是两种常用的eQTL mapping工具，它们在输出上存在系统性差异：

- **TensorQTL**会先过滤掉cis窗口内没有合格SNP的基因（MAF太低、缺失太多、距离太远等），因此部分基因无输出
- **FastQTL**会完整地把NA值也保留，输出更全
- 两者输出的**显著基因数目可能差别很大**，但总的有结果基因数目相同

被TensorQTL过滤的基因示例（均在染色体边缘或低密度区域）：
```
ENSG00000275585  # PDE4DIP pseudogene, chr1 near centromere
ENSG00000198019  # ...
```

这些基因在FastQTL输出中也是NA——原因是规定窗口内确实没有SNP可供分析。

### 4.2 显著基因Venn图

```R
library(VennDiagram)

png("sig_gene.png", width = 5, height = 7)
venn.plot <- venn.diagram(
  x = list(
    FastQTL = sig_data,
    TensorQTL_before = sig_before,
    TensorQTL_after = sig_after
  ),
  filename = NULL,
  fill = c("dodgerblue", "gold", "darkorange"),
  alpha = 0.4,
  cex = 1.2, cat.cex = 1.2,
  cat.pos = c(-15, 15, 180),
  cat.dist = c(0.05, 0.05, 0.05),
  main = "Significant genes FDR<0.05"
)
grid.draw(venn.plot)
dev.off()
```

### 4.3 Effect Size (Slope) 一致性分析

核心问题：不同工具/不同协变量处理方式下，eQTL effect size的符号是否一致？

```R
library(data.table)
library(dplyr)
library(ggplot2)

# 合并三个来源的slope数据
slopes_df <- data.table(gene = common_genes) %>%
  left_join(data[, .(gene, slope, pval_nominal)], by = "gene") %>%
  rename(slope_data = slope, pval_data = pval_nominal) %>%
  left_join(before[, .(gene, slope, pval_nominal)], by = "gene") %>%
  rename(slope_before = slope, pval_before = pval_nominal) %>%
  left_join(after[, .(gene, slope, pval_nominal)], by = "gene") %>%
  rename(slope_after = slope, pval_after = pval_nominal)

# 一致性检验：符号比较
table(sign(slopes_df$slope_data) == sign(slopes_df$slope_before))
#    FALSE  TRUE
#      53  5148

table(sign(slopes_df$slope_data) == sign(slopes_df$slope_after))
#    FALSE  TRUE
#     207  4994

table(sign(slopes_df$slope_before) == sign(slopes_df$slope_after))
#    FALSE  TRUE
#     212  4989
```

> **发现**：FastQTL normal vs INT后，slope方向一致率约96%（5148/5201）；但INT前后对比时，有207个基因方向翻转，一致率降至96%。说明**INT（Inverse Normal Transformation）会改变部分基因的效应方向**。

### 4.4 Slope散点图与Concordance Rate

```R
# FastQTL normal vs INT
correlation <- cor(slopes_df$slope_data, slopes_df$slope_after,
                   use = "pairwise.complete.obs")
ggplot(slopes_df, aes(x = slope_data, y = slope_after)) +
  geom_point(alpha = 0.2, color = "blue") +
  geom_abline(intercept = 0, slope = 1, color = "red",
              linetype = "dashed", linewidth = 1) +
  geom_smooth(method = "lm", color = "black") +
  labs(
    title = "slope: FastQTL normal vs INT",
    subtitle = paste0("Pearson Correlation = ", round(correlation, 3)),
    x = "Slope from FastQTL normal",
    y = "Slope from INT"
  ) +
  theme_bw() +
  coord_fixed(ratio = 1,
              xlim = range(slopes_df$slope_data, na.rm = TRUE),
              ylim = range(slopes_df$slope_after, na.rm = TRUE))
ggsave("slope_fastqtl.png", height = 5, width = 7)

# INT前 vs INT后
correlation <- cor(slopes_df$slope_before, slopes_df$slope_after,
                   use = "pairwise.complete.obs")
ggplot(slopes_df, aes(x = slope_before, y = slope_after)) +
  geom_point(alpha = 0.2, color = "darkgreen") +
  geom_abline(intercept = 0, slope = 1, color = "red",
              linetype = "dashed", linewidth = 1) +
  geom_smooth(method = "lm", color = "black") +
  labs(
    title = "slope: INT before & after",
    subtitle = paste0("Pearson Correlation = ", round(correlation, 3)),
    x = "Slope before", y = "Slope after"
  ) +
  theme_bw() +
  coord_fixed(ratio = 1)
ggsave("slope_before_after.png", height = 5, width = 7)

# 打印concordance rate
concordance_data_after <- table(
    sign(slopes_df$slope_data) == sign(slopes_df$slope_after))
cat(paste0("normal by fastqtl vs int: ",
    round(100 * concordance_data_after["TRUE"] /
          sum(concordance_data_after), 2), "%\n"))

concordance_before_after <- table(
    sign(slopes_df$slope_before) == sign(slopes_df$slope_after))
cat(paste0("before and after concordant rate: ",
    round(100 * concordance_before_after["TRUE"] /
          sum(concordance_before_after), 2), "%\n"))
```

### 4.5 P值一致性比较

slope方向一致不等于p值也一致，需要单独检验：

```R
library(GGally)

p1 <- ggplot(slopes_df, aes(x = -log10(pval_data), y = -log10(pval_after))) +
  geom_point(alpha = 0.3) +
  geom_abline(intercept = 0, slope = 1, color = "red", linetype = "dashed") +
  labs(title = "`data` vs `after`",
       x = "-log10(P) from `data`",
       y = "-log10(P) from `after`") +
  theme_bw()

p2 <- ggplot(slopes_df, aes(x = -log10(pval_before), y = -log10(pval_after))) +
  geom_point(alpha = 0.3) +
  geom_abline(intercept = 0, slope = 1, color = "red", linetype = "dashed") +
  labs(title = "`before` vs `after`",
       x = "-log10(P) from `before`",
       y = "-log10(P) from `after`") +
  theme_bw()

GGally::ggmatrix(list(p1, p2), nrow = 1, ncol = 2)
```

> **经验**：p值在不同工具/处理间通常没有明显离群值，显著性结果本身比较相近。主要差异体现在slope的绝对值和方向上。

### 4.6 TensorQTL结果格式转换

TensorQTL输出为parquet格式，需要转为文本供下游分析：

```bash
# 转换单个parquet文件
python3 -c "
import pandas as pd
input_path = 'result.parquet'
output_path = input_path.replace('.parquet', '.txt.gz')
df = pd.read_parquet(input_path)
df.to_csv(output_path, sep='\t', index=False,
          float_format='%.6g', compression='gzip')
"

# 批量转换并合并
for parquet in seq_test.chr*.cis_qtl_pairs.*.parquet; do
    python3 -c "
import pandas as pd, sys
df = pd.read_parquet(sys.argv[1])
df.to_csv(sys.argv[1] + '.txt.gz', sep='\t', index=False,
          float_format='%.6g', compression='gzip')
" "$parquet"
done

# 合并全染色体结果
python3 -c "
import pandas as pd, glob
files = sorted(glob.glob('seq_test.chr*.cis_qtl_pairs.*.parquet.txt.gz'))
dfs = [pd.read_csv(f, sep='\t') for f in files]
merged = pd.concat(dfs, ignore_index=True)
merged.to_csv('seq_test.allchr.merged.txt.gz', sep='\t',
              index=False, float_format='%.6g', compression='gzip')
"
```

---

## 五、Power Analysis模拟数据生成

### 5.1 模拟蛋白组数据

用于评估差异表达分析的统计功效。基本设计：两组样本（健康 vs 疾病），模拟蛋白质表达矩阵。

```python
import numpy as np
import pandas as pd

np.random.seed(42)

# 样本设置
n_healthy = 150
n_disease = 150

# 读取蛋白质信息（获取蛋白名称列表）
df = pd.read_csv("protein.info.txt", sep='\t')
protein_names = df['prot'].dropna().astype(str)
n_proteins = len(protein_names)

# 构建样本元数据
ids = [f"ID{i+1}" for i in range(n_healthy + n_disease)]
ages = np.random.randint(40, 70, size=n_healthy + n_disease)
sexes = np.random.randint(0, 2, size=n_healthy + n_disease)
diagnosis = ["Healthy"] * n_healthy + ["Disease"] * n_disease

# 模拟蛋白表达数据
# 健康组: N(0, 1); 疾病组: N(0.5, 1)  → 效应量 d = 0.5
healthy_proteins = np.random.normal(loc=0, scale=1,
                                     size=(n_healthy, n_proteins))
disease_proteins = np.random.normal(loc=0.5, scale=1,
                                     size=(n_disease, n_proteins))
protein_data = np.vstack([healthy_proteins, disease_proteins])

# 组装DataFrame
df = pd.DataFrame(protein_data, columns=protein_names)
df["ID"] = ids
df["Age"] = ages
df["Sex"] = sexes
df["Diagnosis"] = diagnosis
df = df[["ID", "Age", "Sex", "Diagnosis"] + protein_names.tolist()]

df.to_csv("simulated_pro_data.csv", index=False)
```

> **局限性**：此模拟数据"完全没有生物学意义"——独立同分布的正态随机数无法模拟基因间相关性、通路富集、批次效应等真实特征。但对于检验分析流程的正确性和统计功效阈值是足够的。

### 5.2 Power Analysis设计思路

1. **设定效应量**：通过调整两组均值差（如loc=0 vs loc=0.5）控制Cohen's d
2. **调整样本量**：改变n_healthy和n_disease探索不同样本量下的检测能力
3. **多重检验校正**：模拟数据跑完整差异分析流程后，用BH校正的FDR和FWER评估
4. **真实蛋白分布**：更精细的模拟应从真实蛋白表达数据估计均值-方差关系，再生成模拟数据

---

## 六、Credible Set展示策略讨论

Fine-mapping后如何展示credible set（CS）的发现：

1. **单SNP展示不够准确**：CS的PIP表征的是"该区间内存在因果SNP的概率"，拆开单个SNP会丢失整体信息
2. **推荐方案A**：拆开画effect size和PIP（适用于CS内SNP数量少的情况）
3. **推荐方案B**：以position为x轴、PIP为y轴、颜色深浅highlight出CS（适用于SNP数量多的情况），label上其他注释信息

---

## 七、关键经验总结

| 问题 | 解决方案 |
| --- | --- |
| GWAS AF与参考面板差异>20% | 重新从case/control频率加权计算AF |
| imputation产生含N的allele | 过滤所有非标准碱基变异 |
| INT改变slope方向 | 上下游分析保持同一transform方式 |
| TensorQTL丢失部分基因 | 确认是窗口内无SNP，非bug |
| Japan GWAS缺失case数 | 从总体N和case AF反推 |
| parquet格式不便下游分析 | 批量转txt.gz再合并 |
