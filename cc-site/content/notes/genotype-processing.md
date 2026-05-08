---
title: "基因型数据处理流水线"
date: 2025-09-15
tags:
  - bioinformatics
  - tutorial
  - genotype
---

# 基因型数据处理流水线

> 从VCF到imputation到post-QC，全用Snakemake串起来。搭这个pipeline的时候差点把头发薅完。

---

## 整体流程

```mermaid
flowchart LR
    A[Raw VCF] --> B[Joint Calling]
    B --> C[VQSR]
    C --> D[Imputation]
    D --> E[Post-QC]
    E --> F[PLINK格式]
```

这是我处理基因型数据的标准流程。看起来很简洁对吧？每个步骤背后都是一堆坑。

---

## Joint Calling

第一步是把所有样本的GVCF合并做joint genotyping。用GATK的GenotypeGVCFs。

这里踩过一个印象深刻的坑——**sex check发现几个样本的性别标记和基因型对不上**。当时吓了一跳，以为是样本混了。后来排查发现有些是临床记录标注错误，有些确实是swap了。

> 做QTL的话，样本信息的准确性直接决定结果的可靠性。.sex check这一步千万别跳。

---

## VQSR

Variant Quality Score Recalibration。GATK推荐的做法，但参数选择挺头疼的：
-tranche值怎么选？太松会留太多假阳性，太严会丢真variant
- 训练集用的哪些？HapMap、OMNI、1000G gold standard和dbSNP都要配上

---

## Imputation

试过两套参考面板：

- **ChinaMAP**：东亚人群覆盖好，但对非东亚人群填充效果一般
- **TOPMed**：多样性好，覆盖了AFR人群，但文件巨大

用beagle做refine，然后minimac4做填充。这一步超级耗内存，跑的时候注意`--limitBAMsortRAM`别把服务器搞崩。

---

## Post-QC三步法

填充完了还没完，还得再QC一轮：

1. **Missingness**：先去掉call rate低的variant和样本
2. **MAF**：minor allele frequency低于阈值的过滤掉
3. **HWE**：Hardy-Weinberg平衡检验，偏太远的不要

这个顺序很重要——先去missingness是因为low call rate的variant做HWE检验不准确。

```bash
# 三步QC
plink2 --vcf imputed.vcf.gz \
  --geno 0.05 \
  --mind 0.05 \
  --make-bed \
  --out step1

plink2 --bfile step1 \
  --maf 0.01 \
  --make-bed \
  --out step2

plink2 --bfile step2 \
  --hardy \
  --hwe 1e-6 \
  --make-bed \
  --out step3_final
```

---

## 一些碎碎念

- 本人有点check allelic switch的执念——imputation前后的allele方向一定得对齐，不然整个QTL全是错的
- 染色体命名统一也很烦，有的数据用`chr1`有的用`1`，PLINK和bcftools默认行为还不一样
- 做跨人群分析的时候，不同的参考面板对MAF影响很大，nominal p-value会跟着变

---

*流程搭完了，但每次拿到新数据还是会发现新的edge case。这就是生信，永远有惊喜等着你。*