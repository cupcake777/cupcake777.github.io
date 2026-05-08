---
title: "APA与ATI分析方法论"
date: 2025-06-01
tags: [bioinformatics, APA, ATI]
---

# APA与ATI分析方法论

研究3' UTR动态重塑，核心就是两个问题：APA（从哪个polyA位点剪接）和ATI（从哪个转录起始位点开始）。量化这两件事的方法不一样，踩的坑也完全不同。

---

## APA定量：DaPars2

DaPars2是做APA分析最常用的工具，输出PDUI值（0到1之间）。

- PDUI高 → distal poly(A) site使用多 → 3' UTR偏长
- PDUI低 → proximal poly(A) site使用多 → 3' UTR偏短

```bash
# DaPars2基本用法
python DaPars2.py \
  --sample_1 bedgraph_control \
  --sample_2 bedgraph_treated \
  --output_dir results/ \
  --PDUI_output PDUI_matrix.txt
```

关键参数：
- `--coverage_threshold`：最低覆盖度，太松会引入噪音，太严丢掉太多基因
- `--PDUI_cutoff`：PDUI差异阈值，决定哪些APA事件被判为显著

坑：DaPars2对输入格式非常挑剔，bedgraph必须是正负链分开的。而且它默认只处理有足够覆盖度的基因——如果你样本少或者覆盖度低，很多基因直接被跳过了。

---

## ATI定量：TSS注释

ATI比APA更棘手，因为转录起始位点的定义本身就不统一。

我试了几种TSS注释源：

| 注释源 | 优点 | 缺点 |
|--------|------|------|
| GENCODE first exon | 标准化，易获取 | 只覆盖已知的canonical TSS |
| FANTOM5 CAGE peaks | 实验验证的TSS | 需要biological sample匹配 |
| proActiv | 从RNA-seq直接推断promoter usage | 依赖比对质量 |
| dbTSS | 日本数据库，东亚覆盖好 | 更新不频繁 |

最终方案：GENCODE first exon做基准，FANTOM5 CAGE做补充，proActiv做交叉验证。

```r
# 从GENCODE GTF提取first exon
library(rtracklayer)
gtf <- import("gencode.v38.annotation.gtf")
first_exons <- gtf[gtf$type == "exon"] %>%
  as.data.frame() %>%
  group_by(gene_id) %>%
  filter(exon_number == 1) %>%
  ungroup()
```

### CAGE peak处理

FANTOM5的CAGE数据需要聚类才能定义TSS。用paraclu做CTSS聚类：

```bash
# CAGE聚类
paraclu -b 50 -s 100000 -t 2 ctss.bedgraph > clusters.bed
```

> 不是哥们，那我算的算什么——不同注释源出来的TSS差异还挺大的

GENCODE v33 vs v38/v40的first exon坐标也不完全一致。我最终选了v38稳定性最好的版本，但注释版本的选择确实会影响下游结果。

---

## proActiv：从RNA-seq推断promoter usage

proActiv的好处是不需要额外实验数据，直接从RNA-seq的junction reads推断哪个promoter在使用。

```r
library(proActiv)

# 从BAM文件计算promoter usage
promoter_counts <- proActiv(
  bamFiles = bam_list,
  annotation = gtf_file,
  promoterWidth = 500,  # TSS上下游
  ncores = 8
)

# 输出每个基因在每个样本中的promoter usage比例
# 可以直接做差异分析
```

坑：proActiv依赖junction reads，如果splice junction比对率低（比如STAR的--chimSegmentMin设太短），结果会不准确。

---

## PDUI vs promoter usage：不同指标反映不同事

| 指标 | 衡量什么 | 范围 | 适用场景 |
|------|----------|------|----------|
| PDUI | 3' UTR长度变化偏好 | 0-1 | APA分析 |
| Promoter usage % | 某个TSS的使用比例 | 0-1 | ATI分析 |
| Iron ratio | 简化的APA指标 | 连续值 | 快速初筛 |

两个指标可以独立变化——一个基因可以3' UTR变长但promoter没变，反之亦然。所以做QTL分析的时候要分开看apaQTL和atiQTL，不能混在一起。

---

## 注释版本对比

这是一个容易被忽略但非常重要的坑。

我对比了GENCODE v33、v38、v40的first exon注释：

- v33 vs v38：约5%的first exon坐标有差异
- v38 vs v40：差异更大，部分基因新增了alternative first exon

> 所以我在这里使用了我自己的注释

最终用v38，因为和GTEx v8的注释对齐最好。但如果你用不同版本的GTEx，注释选哪个可能会变。

---

## 下游分析注意事项

1. **PDUI要做inverse normal transformation（INT）**——因为PDUI的分布不是正态的，直接跑线性模型会违反假设

```r
# INT transformation
library(RNOmni)
pdui_int <- rankNorm(pdui_matrix)
```

2. **ATI和APA的QTL信号可能重叠**——同一个variant可能同时影响3'端和5'端，做coloc的时候要注意区分

3. **年龄作为协变量很重要**——脑组织样本年龄跨度大，3' UTR长度和年龄显著相关

---

*这个领域的方法还在快速迭代，DaPars3已经有alpha版了，但稳定性还不够。目前DaPars2还是最稳的选择。*