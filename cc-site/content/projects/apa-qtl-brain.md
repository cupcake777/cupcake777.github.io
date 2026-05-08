---
title: "UTR动态重塑与脑疾病遗传调控"
date: 2025-01-15
tags:
  - research
  - bioinformatics
  - QTL
  - APA
---

# UTR动态重塑与脑疾病遗传调控

> 从800+个人脑样本里找3' UTR的遗传调控信号，跨三个人群反复确认"这个结果是真的"。

---

## 研究什么

人脑发育和衰老过程中，基因的3' UTR会通过**替代聚腺苷酸化（APA）**发生长度变化——有的变短、有的变长。这些变化影响了mRNA的稳定性、定位和翻译效率。

我的核心问题是：

1. **APA/ATI有没有遗传调控？** ——apaQTL在三个 ancestry group（EAS/EUR/AFR）里是否都能检测到？
2. **这些调控信号是否与脑疾病相关？** ——通过coloc和fine-mapping，看QTL信号能不能解释GWAS loci。
3. **人群差异怎么处理？** ——不同人群的LD结构、allele frequency差异导致power不同，需要严格定义"population-specific QTL"。

---

## 全流程自己搓

从raw data到最终结果，整个pipeline都是我搭的：

**基因型**：VCF → joint calling → VQSR → imputation → post-QC → PLINK格式。其中imputation试过ChinaMAP和TOPMed，QC三步法（missingness → MAF → HWE），sex check发现了几个错标样本。

**表达**：RNA-seq → STAR比对 → featureCounts定量 → gene filtering → TMM/VST标准化 → ComBat批次校正 → INT。这一步踩的坑最多——五种标准化方法比了一遍才定的。

**QTL mapping**：TensorQTL做nominal pass → permutation求empirical p-value → 多人群pi1统计量 → 效应量比较 → SuSiE fine-mapping → coloc。

---

## 踩过的大坑

### 标准化方法选哪个

TMM、VST、QN、log2CPM、TPM——全跑了一遍，画PCA看效果。最后选了VST+ComBat，不是因为效果最好（差别没那么夸张），而是因为VST对后续线性模型的理论假设更友好。

> 老老实实说，这五种方法我比了一遍，发现"效果差不多但在不同的方面"，然后选了一个"不太会出错"的。科研有时候就是这样。

### 批次效应

这是最头疼的部分。ComBat、RUV-III、limma removeBatchEffect——每种方法的假设不同，适用场景不同。RUV需要negative control，ComBat需要known batch variable，limma最简单但可能under-correct。

我最终用了ComBat修正技术批次 + PEER因子捕捉隐藏混杂。bridge pair的设计帮了大忙——同一个样本跨批次出现，可以直接评估校正效果。

### 跨人群QTL

三个人群的allele frequency差异很大。一个在EUR里common的variant，在EAS里可能很rare，根本没有power去检测关联。所以"population-specific QTL"的定义需要特别小心——我分了三类：strict_specific、uncertain_not_tested、putative_low_power。

---

## 用的数据

- 脑组织RNA-seq：800+样本，多个脑区
- 基因型：WGS + 填充
- 人群：EAS、EUR、AFR
- GWAS summary statistics for neuropsychiatric traits

---

## 工具一览

| 步骤 | 工具 |
|------|------|
| 比对 | STAR |
| 定量 | featureCounts |
| 基因型QC | PLINK, bcftools, GATK |
| Imputation | beagle, minimac4 (ChinaMAP/TOPMed) |
| 差异分析 | DESeq2, limma |
| 批次校正 | sva (ComBat), RUVSeq |
| QTL mapping | TensorQTL, QTLtools |
| Fine-mapping | SuSiE |
| Coloc | coloc (R package) |
| Pipeline管理 | Snakemake |

---

*这条线还在走，更多结果出来会更新*