---
title: "批次效应求生记"
date: 2026-05-08
tags: [bioinformatics, batch-effect]
---

# 批次效应求生记

> 哈，真是给整无语了。

912个样本的RNA-seq数据，横跨多个发育阶段（developing / maturing / aging），分散在不同批次里做的测序。目标很朴素：把batch effect去掉，留下干净的生物学信号。

听起来是教科书级别的标准操作对吧？

错。

---

## 条件和批次完全混杂

常规批次校正的前提是batch和生物学条件独立——stage1的样本均匀分布在各个batch里，算法才能分辨"哪些差异来自batch，哪些来自biology"。

但我的数据里stage1全集中在batch1、batch2，stage2全在batch3、batch4。完全confounded。

"真是给整无语了"就是在这个时候说出来的。

---

## 桥接设计救了一命

好在数据里有一批重复测序的样本——batch9里有些样本带`_rep`后缀，是原始样本的重测。这就是bridge pair。

同一批样本分别在不同条件下测序，表达差异理论上只来自技术噪音。这给了我们一把"尺子"：在PCA空间里，bridge pair距离越小，校正越好。

没有bridge pair的话，一切评估都是自欺欺人。

---

## 基因过滤：别在垃圾数据上跑花式算法

> 本人还是觉得应当进行一个比较全面的基因过滤再开始。

这是整个过程中我最坚持的一点。数据还没校正之前：

- TPM > 0.1 至少覆盖20%样本
- count >= 6 至少覆盖20%样本
- 只保留常染色体（扔掉chrX、chrY、chrM）
- 过滤低RIN样本（RIN < 5的不要）
- WGCNA connectivity Z-score排除离群样本

正态化用的是TMM → log-CPM。这一步做好了后面才不会出幺蛾子。

---

## ComBat

第一个试的是sva包的ComBat。经验贝叶斯框架，对每个基因估计batch effect参数（加性+乘性），然后抹掉。

配置：batch = RNA_batch，design矩阵控制group，参考批次选batch5，par.prior = TRUE。

PCA上看batch聚类确实松散了一些，但bridge distance改善有限。ComBat假设batch effect是线性的，而且要求"多数基因不受batch影响"——我的数据里这两个假设都存疑。

---

## limma::removeBatchEffect

就是把batch当协变量，残差当校正后的表达。快，简单。

但和ComBat一样依赖线性假设，而且是design-aware的——你必须提前知道哪些是生物学变量。多阶段实验里这个假设未必成立。

---

## RUV-III：用阴性对照

RUV-III思路完全不同：不需要假设batch effect的形式，利用negative control genes来估计hidden factors。

stable genes的筛选：bridge pair之间方差最小的10%基因。这些基因的变异理论上只来自技术噪音，RUV-III用它们提取unwanted factors。

k值从1到10都跑了一遍，control genes残余方差vs总方差，带惩罚项的综合评分选出最优k。

---

## 没有银弹

三个维度评估：

| 维度 | 含义 |
|------|------|
| bridge distance | 校正后同一原样两个测序在PCA空间有多近 |
| batch R² | PCA主成分能被batch解释的比例（越低越好）|
| biology R² | PCA主成分能被group解释的比例（越高越好）|

结果：

- **ComBat**：batch R²降得明显，bridge distance改善有限
- **limma**：快，效果和ComBat差不多
- **RUV-III**：bridge distance最小，但可能过度校正掉biology signal

最终选择：**ComBat修正技术batch + PEER因子捕获hidden confounders**。两层过滤，比单用任何一个都稳。

---

批次效应校正本质是在"去噪"和"保真"之间走钢丝。走多了会发现，真正重要的不是选哪个算法，而是实验设计阶段就别让batch和condition confound。

可惜这个道理，通常是撞了南墙之后才懂的。