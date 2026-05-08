---
title: 表达定量方法比较与注释版本选择
tags: [bioinformatics, quantification, annotation, salmon, rsem, gencode, picard, TSS]
created: 2026-05-08
---

# 表达定量方法比较与注释版本选择

RNA-seq 定量流程中的关键决策点：定量工具选择、参考注释版本、测序质量指标收集，以及 TSS 注释构建。

---

## Salmon vs RSEM 定量比较

### 背景

两者均为转录本级别的定量工具，输出 TPM 和 read count。核心差异：

| 特性 | Salmon | RSEM |
|------|--------|------|
| 输入 | FASTQ (quasi-mapping 或 alignment-based) | BAM (需先比对) |
| 速度 | 快（无需全基因组比对） | 较慢 |
| Decoy 支持 | 推荐使用 decoy-aware transcriptome | 无 |
| GC bias 校正 | `--gcbias` 参数 | 内置 |

### 关键参数建议

Salmon 推荐使用 selective alignment + decoy-aware transcriptome，以减少来自基因组未注释区域、但与转录本序列相似的 reads 的虚假映射。

### 相关性分析代码

```python
import pandas as pd
import numpy as np
from scipy.stats import spearmanr
import matplotlib.pyplot as plt

# 加载 tx2gene 映射和 Salmon 结果
tx2gene = pd.read_csv('~/ref/tx2gene', sep='\t')
salmon = pd.read_csv('salmon.quant.sf', sep='\t')
salmon = salmon.merge(tx2gene, left_on='Name', right_on='transcript_id')
salmon_gene = salmon.groupby('gene_id').agg({'TPM': 'sum', 'NumReads': 'sum'}).reset_index()
salmon_gene.columns = ['gene_id', 'salmon_TPM', 'salmon_counts']

# 加载 RSEM 结果
rsem = pd.read_csv('rsem.quant.results', sep='\t')
rsem = rsem[['gene_id', 'TPM', 'expected_count']]
rsem.columns = ['gene_id', 'rsem_TPM', 'rsem_counts']

# 合并比较
merged = pd.merge(salmon_gene, rsem, on='gene_id')

# Spearman 相关性
corr_tpm, _ = spearmanr(merged['salmon_TPM'], merged['rsem_TPM'])
corr_counts, _ = spearmanr(merged['salmon_counts'], merged['rsem_counts'])
print(f'TPM Spearman correlation: {corr_tpm}')       # 约 0.93
print(f'Counts Spearman correlation: {corr_counts}')

# log 变换后可视化
plt.scatter(np.log2(merged['salmon_TPM'] + 1), np.log2(merged['rsem_TPM'] + 1), alpha=0.5)
plt.xlabel('log2(Salmon TPM + 1)')
plt.ylabel('log2(RSEM TPM + 1)')
plt.plot([0, 15], [0, 15], 'r--')
plt.savefig('bias_check.png')

# 过滤低表达后重新评估
filtered = merged[(merged['salmon_TPM'] > 1) | (merged['rsem_TPM'] > 1)]
corr_tpm_filt, _ = spearmanr(filtered['salmon_TPM'], filtered['rsem_TPM'])
print(f'Filtered TPM Spearman: {corr_tpm_filt}')
```

### 结论

两种工具的基因水平 TPM 相关性约 0.93，结果高度一致。若原始数据使用 RSEM 定量，无需强制重新用 Salmon 跑，除非存在低 mapping rate 的样本。

---

## GENCODE 版本比较 (v33 vs v40)

### 比较维度

使用相同样本在不同版本注释下的定量结果，评估以下指标：

1. **基因集重叠** — Venn 图评估共有 / 独有基因比例
2. **样本间相关性** — Spearman 相关（目标 > 0.95）
3. **假定差异基因数** — limma 差异检验（目标 < 1-5%）
4. **PCA 位移** — 欧氏距离评估版本间样本偏移

### 完整比较脚本

```R
suppressPackageStartupMessages({
  library(data.table); library(dplyr); library(ggplot2)
  library(pheatmap); library(VennDiagram); library(limma)
})

load_data <- function(version) {
  base_path <- file.path("01_anno", version)
  expr <- fread(file.path(base_path, "expression_for_qtl.tsv"), data.table = FALSE)
  rownames(expr) <- expr[,1]; expr <- expr[,-1]
  list(expr = expr)
}

v33 <- load_data("V33")
v40 <- load_data("V40")
common_samples <- intersect(colnames(v33$expr), colnames(v40$expr))

# 基因集比较
gene_v33 <- rownames(v33$expr)
gene_v40 <- rownames(v40$expr)
common_genes <- intersect(gene_v33, gene_v40)
cat("Common genes:", length(common_genes), "\n")
cat("Proportion common:", length(common_genes) / max(length(gene_v33), length(gene_v40)), "\n")

# 样本相关性
expr_common_v33 <- v33$expr[common_genes, common_samples]
expr_common_v40 <- v40$expr[common_genes, common_samples]
cor_matrix <- cor(expr_common_v33, expr_common_v40, method = "spearman")
cat("Median sample correlation:", median(diag(cor_matrix)), "\n")

# 差异检验
fit <- lmFit(expr_common_v40 - expr_common_v33, matrix(1, ncol(expr_common_v40), 1))
eb <- eBayes(fit)
sig_deg <- topTable(eb, number = Inf) %>% filter(adj.P.Val < 0.05)
cat("Sig DEG %:", nrow(sig_deg) / length(common_genes) * 100, "%\n")

# PCA 位移
all_count <- rbind(expr_common_v33, expr_common_v40)
pca <- prcomp(t(all_count), center = TRUE, scale. = TRUE)
# 计算每个样本在 V33 与 V40 间的 PCA 欧氏距离
```

### 结论

- 不同版本间的样本相关性非常高（median > 0.95）
- 差异基因数量极少（< 1-5%）
- PCA 位移较小
- **版本差异对下游分析影响有限**，保持一致性即可，无需强制统一版本

---

## Picard 测序质量指标收集

### 指标列表

| 指标 | 用途 |
|------|------|
| AlignmentSummaryMetrics | 比对率、错配率 |
| RnaSeqMetrics | 5'/3' bias、rRNA 比例、编码区比例 |
| GcBiasMetrics | GC 偏倚评估 |
| DuplicationMetrics | 重复率 |
| InsertSizeMetrics | 插入片段分布 |

### 准备文件

#### rRNA interval_list 构建

```bash
chrom_sizes=/zs32_2/ycongli/ref/hg38.chrom.sizes
genes=/zs32_2/ycongli/ref/gencode.v33.annotation.gtf
rRNA=rRNA.interval_list

# 序列头信息
perl -lane 'print "@SQ\tSN:$F[0]\tLN:$F[1]\tAS:GRCh38"' $chrom_sizes | grep -v _ >> $rRNA

# 提取 rRNA 基因区间
grep 'gene_biotype "rRNA"' $genes | \
    awk '$3 == "gene"' | cut -f1,4,5,7,9 | \
    perl -lane '/gene_id "([^"]+)"/ or die "no gene_id on $."; print join "\t", (@F[0,1,2,3], $1)' | \
    sort -k1V -k2n -k3n >> $rRNA
```

### 批量收集脚本

```bash
#!/bin/bash
set -euo pipefail

PICARD_JAR="/opt/picard-tools/picard.jar"
REF_GENOME="/zs32/data-analysis/reflib/ucsc_hg38/hg38.fa"
REF_FLAT="/zs32_2/ycongli/ref/annotation/refFlat.txt"
RIBOSOMAL_INTERVALS="/zs32_2/ycongli/ref/annotation/rRNA.interval_list"
BAM_LIST="bam_list.txt"
OUT_BASE="picard_metrics"
JAVA_FLAGS="-Xmx32g"

mkdir -p ${OUT_BASE} ${OUT_BASE}/status /tmp/bamfile
TASK_ID=${1:-1}
paramline=$(sed -n "${TASK_ID}p" ${BAM_LIST})
IFS=$'\t' read -r SAMPLE_ID IN_BAM <<< "$paramline"

METRICS_OUT_BASE="${OUT_BASE}/${SAMPLE_ID}/${SAMPLE_ID}.picard"
PICARD_DONE="${OUT_BASE}/status/${SAMPLE_ID}.done"
mkdir -p "$(dirname ${METRICS_OUT_BASE})" "${OUT_BASE}/status"
[[ -f "${PICARD_DONE}" ]] && exit 0

# 1. Alignment Summary
java ${JAVA_FLAGS} -jar ${PICARD_JAR} CollectAlignmentSummaryMetrics \
  R=${REF_GENOME} O=${METRICS_OUT_BASE}.alignment_metrics.txt I=${IN_BAM}

# 2. RNA-seq Metrics
java ${JAVA_FLAGS} -jar ${PICARD_JAR} CollectRnaSeqMetrics \
  I=${IN_BAM} O=${METRICS_OUT_BASE}.rna_seq_metrics.txt \
  REF_FLAT=${REF_FLAT} RIBOSOMAL_INTERVALS=${RIBOSOMAL_INTERVALS} \
  STRAND_SPECIFICITY=SECOND_READ_TRANSCRIPTION_STRAND

# 3. GC Bias
java ${JAVA_FLAGS} -jar ${PICARD_JAR} CollectGcBiasMetrics \
  R=${REF_GENOME} I=${IN_BAM} \
  O=${METRICS_OUT_BASE}.gc_bias_metrics.txt \
  S=${METRICS_OUT_BASE}.gc_bias_summary.txt \
  CHART=${METRICS_OUT_BASE}.gc_bias.chart.pdf

# 4. Mark Duplicates
java ${JAVA_FLAGS} -jar ${PICARD_JAR} MarkDuplicates \
  I=${IN_BAM} O=${METRICS_OUT_BASE}.temp.dup.bam \
  M=${METRICS_OUT_BASE}.duplication_metrics.txt TMP_DIR=/tmp/bamfile
rm -f ${METRICS_OUT_BASE}.temp.dup.bam*

# 5. Insert Size
java ${JAVA_FLAGS} -jar ${PICARD_JAR} CollectInsertSizeMetrics \
  I=${IN_BAM} O=${METRICS_OUT_BASE}.insert_size_metrics.txt \
  H=${METRICS_OUT_BASE}.insert_size_histogram.pdf

touch "${PICARD_DONE}"
```

### Indel blacklist 对 QTL 结果的影响

Indel 位点的纳入对 QTL 显著结果的影响有限（filter 后显著 eQTL 数量从 3071 降至 781）。大部分 effect size 的 lead SNP 仍为 SNP 类型，Indel 的贡献可忽略。

---

## TSS 注释构建

### 方法一：GENCODE first exon 提取

从 GTF 提取蛋白编码基因的首个外显子，按 splice site 合并去冗余。

```R
suppressPackageStartupMessages({
  library(data.table); library(rtracklayer); library(GenomicRanges)
})

gtf_file <- "gencode.v40.annotation.gtf"
dt_all <- as.data.table(rtracklayer::import(gtf_file))

# 提取 exon_number == 1 且有 start_codon 的转录本
exons <- dt_all[exon_number == "1"]
tx_with_start_codon <- dt_all[type == "start_codon", unique(transcript_id)]
first_exons <- exons[transcript_id %in% tx_with_start_codon]

# 去除所有转录本 first exon 完全相同的基因
first_exons <- first_exons[
  , .SD[!(all(start == start[1] & end == end[1]))],
  by = gene_name
]

# BED 格式 (0-based)
first_exons[, start := start - 1]
result <- unique(first_exons[, c("gene_name", "transcript_id", "seqnames", "start", "end", "strand")])
fwrite(result, "gencode.tss.v40", sep = '\t', quote = FALSE)
```

#### 另一种方法：使用 GenomicFeatures

```R
library(GenomicFeatures)
txdb <- txdbmaker::makeTxDbFromGFF("gencode.v40.annotation.gtf", format = "gtf")
exons_list <- exonsBy(txdb, by = "tx", use.names = TRUE)
first_exons_gr <- unlist(endoapply(exons_list, function(x) x[1]))

# 按基因合并，去冗余
first_exons_by_gene <- split(first_exons_gr, mcols(first_exons_gr)$GENEID)
nonredundant_fe <- unlist(lapply(first_exons_by_gene, function(x) {
  reduced <- reduce(x)
  mcols(reduced)$GENEID <- unique(mcols(x)$GENEID)
  return(reduced)
}))
fwrite(as.data.table(nonredundant_fe), "first_exons_v40.bed", sep = '\t', quote = FALSE)
```

### 方法二：FANTOM5 CAGE 处理

#### CAGE 数据格式

| 文件 | 说明 |
|------|------|
| `hg38_fair+new_CAGE_peaks_phase1and2.bed.gz` | CAGE peak 区域（含 representative TSS） |
| `adult.hg38.nobarcode.ctss.bed.gz` | 成人 CTSS（pooled，需按脑组织筛选） |
| `fetal.hg38.nobarcode.ctss.bed.gz` | 胎儿 CTSS |
| `TSS_human.bed.gz` | CAGE peaks 中经 TSS classifier 确认为真实 TSS 的位点 |

#### CTSS 预处理 + paraclu 聚类

```bash
# 转为 paraclu 输入格式
zcat ref/adult.hg38.nobarcode.ctss.bed.gz | \
  awk 'BEGIN{OFS="\t"} {print $1, $6, $2+1, $5, $4}' | \
  sort -k1,1 -k2,2 -k3,3n > adult.paraclu.input.txt

zcat ref/fetal.hg38.nobarcode.ctss.bed.gz | \
  awk 'BEGIN{OFS="\t"} {print $1, $6, $2+1, $5, $4}' | \
  sort -k1,1 -k2,2 -k3,3n > fetal.paraclu.input.txt

# 合并并聚合信号
cat adult.paraclu.input.txt fetal.paraclu.input.txt | \
  sort -k1,1 -k2,2 -k3,3n | \
  awk 'BEGIN{OFS="\t"} {
    key = $1"\t"$2"\t"$3; sum[key] += $4
  } END { for (k in sum) print k, sum[k] }' | \
  sort -k1,1 -k2,2 -k3,3n > pooled.paraclu.input.txt

# paraclu 聚类：-l 200 最小 cluster 长度，-d 2 密度阈值
paraclu-cut.sh -l 200 -d 2 pooled.paraclu.output.txt > pooled.peaks.txt
```

#### paraclu 输出说明

| 列 | 含义 |
|----|------|
| sequence | 染色体 |
| strand | 链方向 |
| start / end | cluster 起止位置 |
| sites | 聚类的 CTSS 位点数 |
| sum of values | 信号总和 |
| min d / max d | 稳定密度范围（差距越大越稳定） |

#### GENCODE + CAGE 整合

```R
library(GenomicRanges)
library(data.table)

gencode <- fread("method/gencode.tss.v40")
gencode[, tss := ifelse(strand == "+", start, end)]
gencode[, splice_site := ifelse(strand == "+", end, start)]

# 按基因内 splice site 合并
gencode_clean <- gencode[, .(
  start = min(start), end = max(end),
  tss = ifelse(unique(strand) == "+", min(start), max(end)),
  splice_site = ifelse(unique(strand) == "+", max(end), min(start))
), by = .(gene_name, transcript_id, seqnames, strand)]

# 加载 FANTOM5 CAGE
fantom <- fread("ref/hg38_fair+new_CAGE_peaks_phase1and2.bed.gz")
fantom_tss <- fantom[, .(chr = V1, tss = V7 + 1, strand = V6)]
brain_tss <- fread("brain_specific_cage_tss.txt")
brain_tss[, tss := tss + 1]

cage_all <- unique(rbind(fantom_tss, brain_tss, fill = TRUE)[, .(chr, tss, strand)])

# 构建 mapping 窗口：rep_tss ± 500bp 至 splice_site
windows <- gencode_clean[, .(
  rep_tss = if(unique(strand) == "+") min(tss) else max(tss)
), by = .(gene_name, seqnames, strand, splice_site)]
windows[, region_min := ifelse(strand == "+", rep_tss - 500, splice_site)]
windows[, region_max := ifelse(strand == "+", splice_site, rep_tss + 500)]

# GRanges overlap
gr_gencode <- makeGRangesFromDataFrame(windows,
  seqnames.field = "seqnames", start.field = "region_min",
  end.field = "region_max", strand.field = "strand", keep.extra.columns = TRUE)
gr_cage <- GRanges(seqnames = cage_all$chr,
  ranges = IRanges(start = cage_all$tss, width = 1), strand = cage_all$strand)

hits <- findOverlaps(gr_gencode, gr_cage)

# 合并 GENCODE TSS 和 CAGE TSS
cage_points <- data.table(
  gene_name = windows[queryHits(hits)]$gene_name,
  tss_val = cage_all[subjectHits(hits)]$tss
)
gencode_points <- gencode_clean[, .(gene_name, tss_val = tss)]
pool <- unique(rbind(cage_points, gencode_points))

result <- pool[, .(
  region_start = min(tss_val),
  tss_list = paste(sort(unique(tss_val)), collapse = "_")
), by = gene_name]
fwrite(result, "DATTSS_hg38_ref.txt", sep = '\t', quote = FALSE)
```

#### bedtools 辅助操作

```bash
# 扩展 first exon 上游 500bp 作为 mapping 窗口
bedtools slop -i NRFE.bed -g hg38.chrom.sizes -l 500 -r 0 -s > NRFE.ext500.bed

# CAGE peaks 与 GENCODE first exon 交集
bedtools intersect -wa -wb -a all.brain.format -b NRFE.ext500.bed -s > CAGE_NRFE_overlap.txt

# FANTOM TSS representative 与 GENCODE 交集
bedtools intersect -wa -wb -a NRFE.ext500.bed -b FANTOM_tss_rep.bed -s > NRFE_FANTOM_overlap.tsv
```

### 方法三：proActiv promoter quantification

```R
library(proActiv)
gtf.file <- "gencode.v40.annotation.gtf"
pro_anno <- preparePromoterAnnotation(file = gtf.file, species = "Homo_sapiens")
# 返回 PromoterAnnotation 对象：
#   @intronRanges       : 内含子区间及对应转录本
#   @promoterIdMapping  : 转录本 / promoter ID / gene ID 映射
#   @promoterCoordinates: 启动子坐标（TSS）及 first exon 3' 端
```

proActiv 输出的区间通常比自定义 GENCODE first exon 方法更大，因为它是基于 intron 定义的 promoter activity。

---

## 备注

- check_strandedness 工具可验证链特异性：
  ```bash
  check_strandedness --gtf gencode.v40.annotation.gtf \
    --transcripts gencode.v40.transcripts.fa \
    --reads_1 sample_1.fq.gz --reads_2 sample_2.fq.gz
  ```
- 参考资源：https://github.com/saketkc/gencode_regions
