---
title: "基因型数据处理流水线"
date: 2025-09-15
tags: [bioinformatics, genotype]
---

# 基因型数据处理流水线

从VCF到imputation到post-QC，全用Snakemake串起来。搭这个pipeline的时候差点把头发薅完。

```mermaid
flowchart LR
    A[Raw VCF] --> B[Joint Calling]
    B --> C[VQSR]
    C --> D[Imputation]
    D --> E[Post-QC]
    E --> F[PLINK格式]
```

看起来很简洁对吧？每个步骤后面都是一堆坑。

---

## Joint Calling

把所有样本的GVCF合并做joint genotyping。用GATK的GenotypeGVCFs。

这里踩过一个印象深刻的坑——**sex check发现几个样本的性别标注和基因型对不上**。当时吓了一跳，以为是样本混了。后来排查发现有些是临床记录标注错误，有些确实是swap了。

> 做QTL的话，样本信息准确性直接决定结果可靠性。sex check这一步千万别跳。

```bash
# Sex check
plink2 --bfile data \
  --check-sex \
  --out sex_check

# 找出sex mismatch的样本
awk '$5 == "PROBLEM" {print $1, $2}' sex_check.sexcheck > mismatch_samples.txt
```

---

## VQSR

Variant Quality Score Recalibration。GATK推荐做法，但参数选择挺头疼的：

- tranche值怎么选？太松留太多假阳性，太严丢真variant
- 训练集：HapMap、OMNI、1000G gold standard和dbSNP都要配上

```bash
# VQTR (Variant Quality Score Recalibration)
gatk VariantRecalibrator \
  -R reference.fa \
  -V cohort.vcf.gz \
  --resource:hapmap,known=false,training=true,truth=true,prior=15.0 hapmap.vcf.gz \
  --resource:omni,known=false,training=true,truth=false,prior=12.0 omni.vcf.gz \
  --resource:1000G,known=false,training=true,truth=false,prior=10.0 1000G.vcf.gz \
  --resource:dbsnp,known=true,training=false,truth=false,prior=2.0 dbsnp.vcf.gz \
  -mode SNP \
  -O output.recal \
  --tranches-file output.tranches

gatk ApplyVQSR \
  -R reference.fa \
  -V cohort.vcf.gz \
  --recal-file output.recal \
  --tranches-file output.tranches \
  -mode SNP \
  -O cohort_vqsr.vcf.gz
```

---

## Imputation

试过两套参考面板：

- **ChinaMAP**：东亚人群覆盖好，但对非东亚人群填充效果一般
- **TOPMed**：多样性好，覆盖了AFR人群，但文件巨大

用beagle做refine，然后minimac4做填充。这一步超级耗内存：

```bash
# Beagle refine + imputation
beagle gt=cohort_vqsr.vcf.gz \
  out=imputed.vcf.gz \
  nthreads=16 gpus=1 \
  ref=reference_panel.vcf.gz
```

> 注意`--limitBAMsortRAM`别把服务器搞崩了

---

## Post-QC三步法

填充完了还没完，还得再QC一轮：

```bash
# 1. Missingness
plink2 --vcf imputed.vcf.gz \
  --geno 0.05 \
  --mind 0.05 \
  --make-bed \
  --out step1

# 2. MAF
plink2 --bfile step1 \
  --maf 0.01 \
  --make-bed \
  --out step2

# 3. HWE
plink2 --bfile step2 \
  --hardy \
  --hwe 1e-6 \
  --make-bed \
  --out step3_final
```

顺序很重要——先去missingness是因为low call rate的variant做HWE检验不准确。

---

## 一些碎碎念

- 本人有点check allelic switch的执念——imputation前后的allele方向一定得对齐，不然整个QTL全是错的
- 染色体命名统一也很烦，有的数据用`chr1`有的用`1`，PLINK和bcftools默认行为还不一样
- 做跨人群分析的时候，不同的参考面板对MAF影响很大，nominal p-value会跟着变

```bash
# 染色体命名统一 (经常要做的操作)
bcftools annotate --rename-chrs chr_map.txt input.vcf.gz -Oz -o output.vcf.gz

# Allele switch check
plink2 --bfile data \
  --a1-allele reference.alleles \
  --make-bed \
  --out checked
```

---

*流程搭完了，但每次拿到新数据还是会发现新的edge case。这就是生信，永远有惊喜等着你。*