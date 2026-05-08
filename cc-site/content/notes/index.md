---
title: "notes"
---

# notes

踩坑记录 · 碎碎念 · 不保证全对

> 好记心不如敲键盘

不是教程——是真实踩过的坑、遇到的问题、以及当时怎么想的。

---

## 生信流程

- [[notes/preprocessing-comparison|五种标准化方法对比实录]] — TMM、VST、QN、log2CPM、TPM全跑一遍
- [[notes/batch-effect-battle|批次效应求生记]] — ComBat、RUV-III、limma反复横跳
- [[notes/qtl-pipeline-guide|QTL分析：从genotype到coloc]] — 一条龙pipeline
- [[notes/genotype-processing|基因型数据处理流水线]] — VCF到imputation到QC
- [[notes/apa-ati-methodology|APA与ATI分析方法论]] — 3' UTR动态重塑的量化
- [[notes/cross-ancestry-qtl|跨人群QTL分析]] — 多ancestry group比较的坑
- [[notes/coloc-fine-mapping|Coloc与Fine-mapping实战]] — SuSiE + coloc
- [[notes/sv-detection|SV检测：多工具合并策略]] — 五caller取交集
- [[notes/atac-seq-pipeline|ATAC-seq处理流程]] — Tn5 offset、peak calling
- [[notes/multi-tissue-expression|多组织表达分析]] — 32组织QC与outlier检测
- [[notes/pattern-recognition-clustering|模式识别与聚类分析]] — NbClust/Mfuzz/maSigPro/DBSCAN/GMM

## Pipeline脚本

- [[notes/qtl-pipeline-scripts|QTL完整pipeline脚本集]] — SLURM作业脚本
- [[notes/susie-coloc-pipeline|SuSiE-coloc可复用pipeline]] — 完整R脚本
- [[notes/smr-gene-coloc|SMR分析与基因水平coloc]] — SMR/HEIDI/基因级coloc
- [[notes/smr-gwas-integration|SMR与GWAS数据整合]] — GWAS数据源与格式转换

## 定量与注释

- [[notes/quantification-annotation|表达定量与注释版本]] — Salmon vs RSEM、GENCODE版本比较

## 命令速查

- [[notes/bioinfo-commands|生信常用命令速查]] — bcftools/plink/STAR/GATK/DESeq2
- [[notes/server-cheatsheet|服务器管理速查表]] — 日常命令

## 碎碎念

- [[notes/survival-guide|直博碎碎念]] — 不一定有用但真实