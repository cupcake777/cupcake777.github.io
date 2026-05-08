---
title: "SV检测流程：多工具合并策略"
date: 2025-11-01
tags: [bioinformatics, SV, variant-calling]
---

# SV检测流程：多工具合并策略

结构变异（SV）比SNP难检测多了——不同工具call出来的结果差异很大，最终只能取交集来保证可靠性。

---

## 五款工具各有所长

| 工具 | 擅长检测 | 特点 |
|------|----------|------|
| smoove (lumpy) | DEL/DUP/INV | 基于split-read和discordant pair，对中等长度SV敏感 |
| delly | DEL/DUP/INV/BND | 同时用paired-end和split-read，双保险 |
| breakdancer | DEL/INS/INV/TRA | 老牌工具，速度快但precision不算高 |
| cnvnator | DEL/DUP | 基于read depth，对大片段CNV特别准 |
| manta | DEL/INS/DUP/INV/BND | 基于paired-end和split-read，对小SV（<100bp）敏感 |

没有哪个工具能包打天下。我的做法是：五个全跑，然后SURVIVOR合并。

---

## Docker运行

每款工具的Docker命令：

```bash
# smoove (lumpy wrapper)
docker run -v /data:/data quay.io/biocontainers/smoove:0.2.5--0 \
  smoove call --outdir /data/sv_results \
  --name sample1 \
  --genotype \
  /data/reference.fa \
  /data/sample1.bam

# delly
docker run -v /data:/data quay.io/biocontainers/delly:1.1.5--0 \
  delly call -g /data/reference.fa \
  -o /data/sv_results/sample1.bcf \
  /data/sample1.bam

# breakdancer
docker run -v /data:/data quay.io/biocontainers/breakdancer:1.4.0--0 \
  breakdancer-max config.txt > /data/sv_results/sample1_breakdancer.txt

# cnvnator
docker run -v /data:/data quay.io/biocontainers/cnvnator:0.4.1--0 \
  cnvnator -root /data/sv_results/sample1.root \
  -genome /data/reference.fa \
  -unique -chrom 1-22,X,Y

# manta
docker run -v /data:/data quay.io/biocontainers/manta:1.6.0--0 \
  configManta.py --bam /data/sample1.bam \
  --referenceFasta /data/reference.fa \
  --runDir /data/sv_results/manta_run
  /data/sv_results/manta_run/runWorkflow.py -m local -j 8
```

---

## SURVIVOR合并

SURVIVOR合并多个caller的结果，指定最小支持caller数：

```bash
# SURVIVOR merge
# 参数：max_distance(500bp) min_support(3) 
#      type_match(1=SV type must match) 
#      estimate_dist(0) min_svlen(50)
SURVIVOR merge \
  caller_files.txt \
  500 \     # max distance between breakpoints
  3 \       # 至少3个caller支持
  1 \       # SV type必须一致
  0 \       # 不估计距离
  50 \      # 最小SV长度
  merge_output.vcf
```

关键参数选择：
- **max_distance=500bp**：太小会合并不了同一事件，太大会把不同事件合并。500bp是常用值
- **min_support=3**：5个caller里至少3个检测到，可靠性大幅提升
- **type_match=1**：要求SV类型一致（都是DEL或都是DUP），避免把DEL和DUP合并在一起

---

## SVtyper分型

合并后的SV需要重新genotype：

```bash
# SVtyper对合并后的SV做genotyping
svtyper \
  -i merge_output.vcf \
  -B sample1.bam \
  -o sample1_genotyped.vcf
```

genotyping之后就可以做样本级别的质量控制了——call rate太低或MAF太低的SV过滤掉。

---

## bcftools标准化

合并后的VCF经常有格式不一致的问题：

```bash
# bcftools norm：左对齐 + 分解多等位位点
bcftools norm \
  -f reference.fa \
  -Oz -o sv_normalized.vcf.gz \
  merge_output.vcf

# 过滤
bcftools view -i 'INFO/SVLEN>=50 && INFO/SUPPORT>=3' \
  -Oz -o sv_filtered.vcf.gz \
  sv_normalized.vcf.gz
```

---

## 一些坑

- **命名不统一**：有的工具用`chr1`有的用`1`，合并前必须统一
- **SV type不一致**： smoove报`DUP`，cnvnator报`CN2`，其实是同一件事。合并之前要做type mapping
- **inDel**：小inDel（<50bp）有些工具会报，有些不会。设最小长度阈值统一处理
- **BND vs INV**：有些工具把inversion报成BND（breakend），需要额外处理

```bash
# SV type mapping
# CNV-type mapping
cnv_map = {
    "CN0": "DEL",   # homozygous deletion
    "CN1": "DEL",   # heterozygous deletion  
    "CN2": "DUP",   # duplication (copy number 2+)
    "CN3": "DUP",   # multi-copy duplication
}
```

---

*SV检测是目前最不成熟的方向之一——caller之间的consistency大概只有50-70%。多caller合并是必须的，但也不能保证100%准确。如果后面要做QTL，建议保守一点，3个caller以上支持再纳入分析。*