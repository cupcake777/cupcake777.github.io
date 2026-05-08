---
title: "QTL分析：从genotype到coloc"
date: 2026-05-08
tags: [bioinformatics, QTL]
---

# QTL分析：从genotype到coloc

整个QTL pipeline是自己从零搭的。搭的时候没少头疼，记录一下，也许能帮到同样从零开始的人。

```mermaid
flowchart LR
    A[Raw VCF] --> B[Joint Calling]
    B --> C[VQSR]
    C --> D[Imputation]
    D --> E[Post-QC]
    E --> F[PLINK格式]
    F --> G[Expression QC]
    G --> H[Normalization]
    H --> I[Batch Correction]
    I --> J[QTL Mapping]
    J --> K[Fine-mapping]
    K --> L[Coloc]
```

看起来很线性对吧？实际上是反复横跳。跑完QTL发现QC不够严格，回去重新QC，然后再跑一遍。如此循环。

---

## Genotype QC

从VCF到PLINK格式，第一步就是genotype QC。

这里踩过一个坑：**sex check发现几个样本的性别标注和基因型对不上**。当时吓了一跳，以为是样本混了。后来排查发现有些是临床记录错误，有些确实swap了。

> 做QTL的话，样本信息的准确性直接决定结果可靠性。sex check这一步别跳。

QC三步法：

```bash
# Step 1: Missingness
plink2 --vcf imputed.vcf.gz \
  --geno 0.05 \
  --mind 0.05 \
  --make-bed \
  --out step1

# Step 2: MAF filter
plink2 --bfile step1 \
  --maf 0.01 \
  --make-bed \
  --out step2

# Step 3: HWE
plink2 --bfile step2 \
  --hardy \
  --hwe 1e-6 \
  --make-bed \
  --out step3_final
```

顺序很重要：先去missingness，因为low call rate的variant做HWE检验不准确。

Imputation试过ChinaMAP和TOPMed。ChinaMAP东亚覆盖好，TOPMed多样性更好但文件巨大。用beagle做refine：

```bash
# Beagle imputation
beagle gt=step3_final.bed out=imputed.vcf.gz \
  nthreads=16 gpus=1
```

> 本人有点check allelic switch的执念——imputation前后的allele方向一定得对齐，不然整个QTL全是错的

---

## 表达数据QC

RNA-seq表达的处理流程：

1. **STAR比对**
```bash
# STAR比对（建索引全省略，sjdbOverhang = read_length - 1）
STAR --genomeDir genome_index/ \
     --readFilesIn sample_R1.fastq.gz sample_R2.fastq.gz \
     --readFilesCommand zcat \
     --outSAMtype BAM SortedByCoordinate \
     --outFileNamePrefix sample_
```

2. **featureCounts定量**
```bash
featureCounts -p -t exon -g gene_id \
    -a annotation.gtf \
    -o counts.txt \
    *.bam
```

3. **Gene filtering**（TPM > 0.1、count >= 6、覆盖率阈值）
4. **标准化**（VST，选这个的理由写在了[[notes/preprocessing-comparison|这篇]]里）
5. **ComBat批次校正 + PEER因子**（详见[[notes/batch-effect-battle|这篇]]）

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

最终选了TensorQTL做nominal pass，因为真的快：

```python
# TensorQTL: cis-QTL nominal pass
import tensorqtl
from tensorqtl import genosio, qtl

# 加轧行列
genotypes = genosio.PlinkGenotypes(plink_prefix_path)
phenotypes = pd.read_parquet(expression_parquet)

# cis-QTL
cis_results = qtl.map_cis(
    genotypes=genotypes,
    phenotypes=phenotypes,
    phenotype_covariates=covariates,  # PEER factors + batch + group
    window=1e6  # 1Mb window
)
```

Permutation p-value用QTLtools算，因为它家permutation那套比较规范。

---

## 跨ancestry分析

三个人群（EAS、EUR、AFR），allele frequency差异很大。EUR里common的variant在EAS里可能很rare，根本没有power检测关联。

所以"population-specific QTL"的定义需要小心。我分了三类：

| 类别 | 定义 | 含义 |
|------|------|------|
| strict_specific | 只在一个人群显著 | 可能是真的人群特异 |
| uncertain_not_tested | 其他人群MAF太低没法test | 不确定 |
| putative_low_power | 其他人群可能只是power不够 | 也许共享 |

> 能说吗 我真觉得基因根本不显著

但pi1统计量确实在三个人群里都>0，说明共享signal是存在的，只是power不同。

```r
# pi1统计量：评估跨人群QTL共享程度
# 对每个ancestry group的nominal p-values分别画lambda GC图
# pi1 = 1 - pi0, 其中pi0是null proportion的估计
library(qvalue)
qobj <- qvalue(pvals)
pi1 <- 1 - qobj$pi0  # > 0说明有真实signal
```

---

## Fine-mapping和Coloc

先SuSiE做fine-mapping，然后拿SuSiE结果进coloc。

直接用summary statistics做coloc有一个问题：LD结构不确定，特别是跨人群的时候。SuSiE的credible set能提供更精确的LD信息。

```r
# SuSiE fine-mapping
library(susieR)
fit <- susie_rss(
  z = z_scores,
  R = LD_matrix,
  n = sample_size,
  L = 10  # 最多10个causal
)

# 提取credible set
cs <- fit$cs  # 95% credible sets

# 然后用coloc.susie
library(coloc)
result <- coloc.susie(
  susie_obj = fit_eas,
  susie_obj2 = fit_eur,
  p1 = neas, p2 = neur,
  s1 = neas_causal, s2 = neur_causal
)
```

coloc.susie()的PP4阈值需要注意——0.8只是常规门槛。我有些locus PP4只有0.6但在三个ancestry group里方向一致，这时候就得结合生物学知识判断了。

---

## 工具速查

| 步骤 | 工具 | 备注 |
|------|------|------|
| 比对 | STAR | sjdbOverhang = read_length - 1 |
| 定量 | featureCounts | -p -t exon -g gene_id |
| 基因型QC | PLINK, bcftools, GATK | 三步法顺序很重要 |
| Imputation | beagle, minimac4 | ChinaMAP/TOPMed参考面板 |
| 标准化 | DESeq2 (VST) | 详见对比文 |
| 批次校正 | sva (ComBat), PEER | 详见batch effect文 |
| QTL mapping | TensorQTL, QTLtools | nominal用前者，permutation用后者 |
| Fine-mapping | SuSiE | 先做再coloc |
| Coloc | coloc (R) | PP4 threshold别机械套用 |

pipeline搭完不难，难的是知道每一步在干嘛、为什么这么做。