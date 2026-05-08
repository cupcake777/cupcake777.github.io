---
title: "ATAC-seq处理流程"
date: 2025-04-01
tags: [bioinformatics, ATAC-seq, epigenomics]
---

# ATAC-seq处理流程

ATAC-seq的处理和普通RNA-seq不太一样，最关键的区别是Tn5 offset和fragment size筛选。

---

## 比对

```bash
# bwa mem比对
bwa mem -t 16 reference.fa \
  sample_R1.fastq.gz sample_R2.fastq.gz | \
  samtools view -b -q 30 - | \    # MAPQ >= 30过滤
  samtools sort -o sample.sorted.bam

# 去除chrM reads（ATAC-seq里chrM比例特别高，必须去）
samtools view -b sample.sorted.bam \
  $(samtools view -H sample.sorted.bam | \
    grep '^@SQ' | cut -f2 | \
    grep -v 'chrM' | \
    sed 's/SN://') > sample.no_chrM.bam

# 去重
sambamba markdup -t 8 \
  --remove-duplicates \
  sample.no_chrM.bam sample.dedup.bam
```

---

## Tn5 Insertion Offset

这是ATAC-seq最容易被忽略的步骤。Tn5转座酶以二聚体形式插入，导致read偏移：

- **+链**：+4bp偏移
- **-链**：-5bp偏移

不做这个correction的话，peak calling和footprinting都会出问题。

```bash
# alignmentSieve处理Tn5 offset
# 输出adjusted BAM
alignmentSieve -b sample.dedup.bam \
  -p sample.Tn5_adjusted.bam \
  --ATACshift
```

---

## Peak Calling

```bash
# MACS3 callpeak
# ATAC-seq用BAMPE模式（paired-end）
macs3 callpeak \
  -t sample.Tn5_adjusted.bam \
  -f BAMPE \
  -g hs \              # human genome
  -n sample_peaks \
  -q 0.01 \            # FDR阈值
  --nomodel \          # 不建shifting model，ATAC-seq不需要
  --outdir peaks/

# Blacklist过滤（重要！）
bedtools intersect -v \
  -a peaks/sample_peaks.narrowPeak \
  -b hg38.blacklist.bed \
  > peaks/sample_peaks.filtered.bed
```

> Blacklist区域一定要去掉！ATAC-seq在blacklist region里特别容易出假peak

---

## Fragment Size分析

ATAC-seq的fragment size分布可以判断实验质量：

```bash
# 从BAM提取insert size
samtools view sample.dedup.bam | \
  awk '{if($9>0) print $9}' | \
  sort -n | uniq -c > fragment_sizes.txt

# 理想分布应该有三个峰：
# <100bp: nucleosome-free (open chromatin)
# ~200bp: mono-nucleosome
# ~400bp: di-nucleosome
# ~600bp: tri-nucleosome
```

如果nucleosome-free peak不明显，说明实验质量有问题——可能Tn5消化不够或过度。

---

## BigWig可视化

```bash
# bamCoverage生成CPM标准化bigwig
bamCoverage -b sample.Tn5_adjusted.bam \
  --normalizeUsing CPM \
  --binSize 10 \
  -p 8 \
  -o sample.CPM.bw
```

CPM是ATAC-seq最常用的标准化方法——因为ATAC-seq没有"基因"这个概念，不能用TPM之类的。

---

## 质控指标

| 指标 | 好的标准 | 说明 |
|------|----------|------|
| FRiP | > 0.2 | peak区域reads占总reads比例 |
| TSS enrichment | > 6 | TSS区域信号vs背景的倍数 |
| NFR peak | 明显 | nucleosome-free region的fragment peak |
| dup rate | < 0.3 | 去重后的保留率 |
| chrM比例 | < 0.05 | 线粒体reads比例 |

```bash
# FRiP计算
total_reads=$(samtools view -c sample.dedup.bam)
peak_reads=$(bedtools intersect -u \
  -a sample.dedup.bam \
  -b peaks/sample_peaks.filtered.bed | \
  samtools view -c)
frip=$(echo "scale=4; $peak_reads / $total_reads" | bc)
echo "FRiP: $frip"
```

---

*ATAC-seq比ChIP-seq简单一些（不需要抗体control），但Tn5 offset和fragment size QC经常被忽略。做QTL之前一定要把这两步做好。*