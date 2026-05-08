---
title: "QTL分析：从genotype到coloc"
date: 2026-05-08
tags: [bioinformatics, QTL]
---

# QTL分析：从genotype到coloc

整个QTL pipeline是自己从零搭的。搭的时候没少头疼，记录一下，也许能帮到同样从零开始的人。

---

## 整体流程

```mermaid
flowchart LR
    A[Genotype QC] --> B[Imputation]
    B --> C[Expression QC]
    C --> D[Normalization]
    D --> E[Batch Correction]
    E --> F[QTL Mapping]
    F --> G[Fine-mapping]
    G --> H[Coloc]
```

看起来很线性对吧？实际上是反复横跳。跑完QTL发现QC不够严格，回去重新QC，然后再跑一遍。如此循环。

---

## Genotype QC

第一步就是genotype QC，从VCF到PLINK格式。

这里踩过一个坑：**sex check发现几个样本的性别标注和基因型对不上**。当时吓了一跳，以为是样本混了。后来排查发现有些是临床记录错误，有些确实swap了。

> 做QTL的话，样本信息的准确性直接决定结果可靠性。sex check这一步别跳。

QC三步法：
1. Missingness — 去掉call rate低的variant和样本
2. MAF — minor allele frequency低于阈值的过滤
3. HWE — Hardy-Weinberg平衡偏太远的不要

顺序很重要：先去missingness，因为low call rate的variant做HWE检验不准确。

Imputation试过ChinaMAP和TOPMed。ChinaMAP东亚覆盖好，TOPMed多样性更好但文件巨大。

---

## 表达数据QC

RNA-seq表达的处理流程：

1. STAR比对
2. featureCounts定量
3. Gene filtering（TPM > 0.1、count >= 6、覆盖率阈值）
4. 标准化（VST，选这个的理由写在了[[notes/preprocessing-comparison|这篇]]里）
5. ComBat批次校正 + PEER因子（详见[[notes/batch-effect-battle|这篇]]）

每一步都有坑。gene filtering太松后面噪音大，太严丢掉真正的signal。ComBat的reference batch选哪个也能影响结果。PEER因子个数k也要选，太多over-correct，太少under-correct。

---

## QTL Mapping工具对比

试过三个工具：

| 工具 | 优点 | 缺点 |
|------|------|------|
| **FastQTL** | 经典，文档全 | 只做cis，nominal + permutation比较慢 |
| **QTLtools** | 支持更多模式，可以跑trans | 文档晦涩，参数多 |
| **TensorQTL** | GPU加速，快 | 需要配好CUDA环境 |

> 没我装不上的包！！

——说完这句话的第二天就在CUDA版本上卡了半天。

最终选了TensorQTL做nominal pass，因为这个真的快。Permutation p-value用QTLtools算，因为它家文档虽然难读但permutation那套比较规范。

---

## 跨ancestry分析

三个人群（EAS、EUR、AFR），allele frequency差异很大。EUR里common的variant在EAS里可能很rare，根本没有power检测关联。

所以"population-specific QTL"的定义需要小心。我分了三类：
- **strict_specific** — 只在一个人群显著，其他人群有power但不显著
- **uncertain_not_tested** — 在其他人群MAF太低没test
- **putative_low_power** — 其他人群可能只是power不够

> 能说吗 我真觉得基因根本不显著

但pi1统计量确实在三个人群里都>0，说明共享signal是存在的，只是power不同。

---

## Fine-mapping和Coloc

先SuSiE做fine-mapping，然后拿SuSiE结果进coloc。

直接用summary statistics做coloc有一个问题：LD结构不确定，特别是跨人群的时候。SuSiE的credible set能提供更精确的LD信息，所以先做fine-mapping再coloc比直接coloc更可靠。

coloc.susie()的PP4阈值也需要注意——0.8只是常规门槛，具体要看你的生物学背景和样本量。我有些locus PP4只有0.6但在三个ancestry group里方向一致，这时候就得结合生物学知识判断了。

---

## 工具速查

| 步骤 | 工具 |
|------|------|
| 比对 | STAR |
| 定量 | featureCounts |
| 基因型QC | PLINK, bcftools, GATK |
| Imputation | beagle, minimac4 |
| 标准化 | DESeq2 (VST) |
| 批次校正 | sva (ComBat), PEER |
| QTL mapping | TensorQTL, QTLtools |
| Fine-mapping | SuSiE |
| Coloc | coloc (R) |

pipeline搭完不难，难的是知道每一步在干嘛、为什么这么做。