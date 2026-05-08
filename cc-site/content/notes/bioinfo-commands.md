---
title: "生信常用命令速查"
date: 2025-05-01
tags: [bioinformatics, commands, cheatsheet]
---

# 生信常用命令速查

自己日常用的命令，按工具分类。方便自己查。

---

## bcftools

```bash
# VCF基本信息
bcftools view -h file.vcf.gz          # 查看header
bcftools view -i 'MAF>0.01' file.vcf.gz  # MAF过滤
bcftools stats file.vcf.gz             # 统计信息

# 染色体命名统一
bcftools annotate --rename-chrs chr_map.txt input.vcf.gz -Oz -o output.vcf.gz

# 标准化：左对齐 + 分解多等位位点
bcftools norm -f reference.fa -Oz -o output.vcf.gz input.vcf.gz

# 提取特定区域
bcftools view -r chr1:1000000-2000000 file.vcf.gz

# 合并多个VCF
bcftools merge sample1.vcf.gz sample2.vcf.gz -Oz -o merged.vcf.gz

# 提取特定样本
bcftools view -s sample1,sample2 file.vcf.gz -Oz -o subset.vcf.gz
```

---

## PLINK

```bash
# 三步QC
plink2 --vcf input.vcf.gz --geno 0.05 --mind 0.05 --make-bed --out step1
plink2 --bfile step1 --maf 0.01 --make-bed --out step2
plink2 --bfile step2 --hwe 1e-6 --make-bed --out step3_final

# Sex check
plink2 --bfile data --check-sex --out sex_check

# Het过滤（离群值）
plink2 --bfile data --het --out het_check
# 然后F coefficient ±3SD过滤

# LD pruning
plink2 --bfile data --indep-pairwise 50 5 0.2 --out ld_pruned
plink2 --bfile data --extract ld_pruned.prune.in --make-bed --out pruned

# PCA
plink2 --bfile pruned --pca 10 --out pca_results

# 关联分析
plink2 --bfile data --linear --pheno phenotype.txt --out assoc_results
```

---

## STAR（RNA-seq比对）

```bash
# 建索引
STAR --runMode genomeGenerate \
     --genomeDir genome_index/ \
     --genomeFastaFiles genome.fa \
     --sjdbGTFfile annotation.gtf \
     --sjdbOverhang 99 \
     --runThreadN 16

# 比对
STAR --genomeDir genome_index/ \
     --readFilesIn R1.fastq.gz R2.fastq.gz \
     --readFilesCommand zcat \
     --outSAMtype BAM SortedByCoordinate \
     --outFileNamePrefix sample_ \
     --sjdbOverhang 99 \
     --runThreadN 16
```

> --sjdbOverhang应该设为read length - 1，不是随便填的

---

## featureCounts

```bash
featureCounts -p -t exon -g gene_id \
    -a annotation.gtf \
    -o counts.txt \
    -T 8 \
    *.bam
```

---

## DESeq2（R）

```r
library(DESeq2)

counts <- read.table("counts.txt", header=TRUE, row.names=1)
counts <- counts[, 6:ncol(counts)]  # 去掉前5列元数据

coldata <- data.frame(
  condition = c("control", "control", "treated", "treated")
)

dds <- DESeqDataSetFromMatrix(
  countData = counts,
  colData = coldata,
  design = ~ condition
)

dds <- DESeq(dds)
res <- results(dds, alpha = 0.05)

# 显著差异基因
sig <- subset(res, padj < 0.05 & abs(log2FoldChange) > 1)
```

---

## GATK（基因型处理）

```bash
# Joint calling（合并所有样本）
gatk GenotypeGVCFs \
  -R reference.fa \
  -V gvcf_list.txt \
  -O cohort.vcf.gz

# VQSR
gatk VariantRecalibrator \
  -R reference.fa \
  -V cohort.vcf.gz \
  --resource:hapmap,known=false,training=true,truth=true,prior=15.0 hapmap.vcf.gz \
  --resource:omni,known=false,training=true,truth=false,prior=12.0 omni.vcf.gz \
  --resource:1000G,known=false,training=true,truth=false,prior=10.0 1000G.vcf.gz \
  --resource:dbsnp,known=true,training=false,truth=false,prior=2.0 dbsnp.vcf.gz \
  -mode SNP \
  -O recalibrate_SNP.recal \
  --tranches-file recalibrate_SNP.tranches

gatk ApplyVQSR \
  -R reference.fa \
  -V cohort.vcf.gz \
  --recal-file recalibrate_SNP.recal \
  --tranches-file recalibrate_SNP.tranches \
  -mode SNP \
  -O cohort_vqsr.vcf.gz
```

---

## 常用一行命令

```bash
# 统计VCF中variant数
bcftools view -H file.vcf.gz | wc -l

# 提取特定INFO字段
bcftools query -f '%CHROM\t%POS\t%INFO/AF\n' file.vcf.gz

# FastQC批量质控
for f in *.fastq.gz; do fastqc $f -o qc_results/; done
multiqc qc_results/ -o multiqc_report/

# 从BAM提取特定区域
samtools view -b input.bam chr1:1000000-2000000 > region.bam

# 查看BAM统计
samtools flagstat input.bam

# 用awk快速处理表
awk '$5 < 0.05 && $7 > 1 {print}' results.tsv  # p<0.05 & FC>1
```

---

*没我装不上的包！！——说完第二天在CUDA版本上卡了半天*