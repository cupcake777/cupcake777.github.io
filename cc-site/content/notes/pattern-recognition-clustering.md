# 模式识别与聚类分析方法集

> 从2026年APA时序分析工作日志中提取的无监督模式识别方法体系。
> 数据背景：PFC（前额皮层）life-span APA事件，经批次效应校正（ComBat）和逆正态化处理后的PDUI矩阵。
> 核心目标：在发育时间轴上识别基因表达/APA变化的模式（pattern），不做人为分组假设。

---

## 1. 整体分析策略

模式识别的思路是"多方法交叉验证"——不依赖单一聚类算法，而是用多种方法从不同角度识别模式，最终取共识结果。

分析流水线：
1. 数据预处理 → 2. 最优K确定 → 3. 多方法聚类 → 4. 交叉验证 → 5. 功能注释 → 6. 时序DE筛选

关键约束：输入数据已完成ComBat批次校正 + 逆正态化，**严禁二次scale()或normalize()**，保持原始分布特性。

---

## 2. 最优聚类数K的确定

### 2.1 NbClust综合指标法

NbClust内置30个指标投票选出最优K，是最权威的K选择方法之一。

```R
library(NbClust)

# 构建基于相关性的距离矩阵（关注曲线形状而非绝对值）
diss_matrix <- as.dist(1 - cor(t(expr_matrix), method = "pearson"))

set.seed(2025)
nb <- NbClust(data = data_scaled,
              diss = diss_matrix,
              distance = NULL,        # 已提供diss时设NULL
              min.nc = 2,
              max.nc = 10,
              method = "ward.D2",
              index = "all")          # 运行全部30个指标
best_k <- nb$Best.nc[1]
cat("NbClust suggest best k:", best_k, "\n")
```

要点：
- `diss`参数传入预计算的距离矩阵时，`distance`设为NULL
- 使用Pearson相关距离 `1 - cor(t(expr))` 关注曲线形状相似性
- `method = "ward.D2"` 是层次聚类的链接方法，最小化组内方差增量
- `index = "all"` 跑全部指标，最终取多数投票结果

### 2.2 GMM + BIC拐点法

基于高斯混合模型的BIC曲线，用"点到直线最大距离"法自动检测拐点：

```R
library(ClusterR)

gmm_bic <- Optimal_Clusters_GMM(
  data_scaled,
  max_clusters = 10,
  criterion = "BIC",
  dist_mode = "maha_dist",
  seed_mode = "random_subset",
  km_iter = 10, em_iter = 10,
  var_floor = 1e-10,
  plot_data = FALSE
)

# 拐点检测：连接K=1和K=10的BIC值画直线，找离直线最远的点
plot_df <- data.frame(K = 1:length(gmm_bic), BIC = gmm_bic)
p1 <- c(1, plot_df$BIC[1])
p2 <- c(nrow(plot_df), plot_df$BIC[nrow(plot_df)])

calc_distance <- function(p_check, p_start, p_end) {
  numerator <- abs((p_end[2] - p_start[2]) * p_check[1] -
                   (p_end[1] - p_start[1]) * p_check[2] +
                   p_end[1] * p_start[2] - p_end[2] * p_start[1])
  denominator <- sqrt((p_end[2] - p_start[2])^2 + (p_end[1] - p_start[1])^2)
  return(numerator / denominator)
}

plot_df$dist_to_line <- sapply(1:nrow(plot_df), function(i) {
  calc_distance(c(plot_df$K[i], plot_df$BIC[i]), p1, p2)
})
top_candidates <- plot_df[order(plot_df$dist_to_line, decreasing = TRUE)[1:5], ]
```

### 2.3 Elbow + Silhouette 辅助验证

```R
library(factoextra)

p_elbow <- fviz_nbclust(data_scaled, kmeans, method = "wss", k.max = 8) +
  geom_vline(xintercept = 3, linetype = 2) +
  labs(title = "Elbow Method (WSS)")
p_sil <- fviz_nbclust(data_scaled, kmeans, method = "silhouette", k.max = 8) +
  labs(title = "Silhouette Method")
p_elbow / p_sil
```

### 2.4 Mfuzz Dmin曲线

Mfuzz自带的Dmin方法用于软聚类的K选择：

```R
library(Mfuzz)
eset <- new("ExpressionSet", exprs = data_scaled)
eset <- standardise(eset)
m_val <- mestimate(eset)

# Dmin曲线：随K增大，Dmin下降的拐点即最优K
cl_choose <- Dmin(eset, m_val, crange = seq(2, 10, 1), repeats = 3, visu = TRUE)
```

---

## 3. 聚类方法

### 3.1 K-means聚类

```R
set.seed(2025)
km_final <- kmeans(data_scaled, centers = 3,
                   nstart = 50, iter.max = 1000,
                   algorithm = "MacQueen")
```

MacQueen算法比默认Lloyd更快收敛。nstart=50确保多次随机初始化取最优。

**聚类标签重排序函数**（按均值从高到低统一编号）：

```R
reorder_clusters <- function(data_scaled, cluster_labels) {
  gene_means <- rowMeans(data_scaled, na.rm = TRUE)
  cluster_scores <- tapply(gene_means, cluster_labels, mean)
  sorted_scores <- sort(cluster_scores, decreasing = TRUE)
  new_ids_map <- 1:length(sorted_scores)
  names(new_ids_map) <- names(sorted_scores)
  return(new_ids_map[as.character(cluster_labels)])
}
final_labels <- reorder_clusters(data_scaled, km_final$cluster)
```

### 3.2 层次聚类（Hierarchical Clustering）

使用Pearson相关距离 + Ward.D2链接：

```R
dist_mat <- as.dist(1 - cor(t(data_scaled), method = "pearson"))
hc <- hclust(dist_mat, method = "complete")
hc_clusters <- cutree(hc, k = 3)
```

### 3.3 K-means与HC的交叉验证（ARI）

Adjusted Rand Index衡量两种聚类的一致性：

```R
library(mclust)
ari_score <- adjustedRandIndex(kmeans_labels, hc_clusters)
message(paste0("Adjusted Rand Index (K-means vs HC): ", round(ari_score, 3)))
```

ARI = 1表示完全一致，ARI ≈ 0表示随机分配。用Sankey图可视化两个方法间的对应关系。

### 3.4 Mfuzz软聚类

Mfuzz基于模糊C-means，每个基因对每个cluster有一个隶属度（membership），而非硬分配。

```R
library(Mfuzz)

eset <- new("ExpressionSet", exprs = data_scaled)
eset <- standardise(eset)
m_val <- mestimate(eset)

# 软聚类
cl <- mfuzz(eset, c = 4, m = m_val)

# 可视化：min.mem过滤低隶属度基因，centre显示中心线
mfuzz.plot2(eset, cl = cl, mfrow = c(2, 2), min.mem = 0.7, centre = TRUE)
```

关键参数：
- `c`：聚类数（由NbClust/Dmin确定）
- `m`：模糊权重系数，由`mestimate()`自动估计，越大越"软"
- `min.mem`：只显示隶属度>0.7的基因，过滤噪声

**Mfuzz的一阶导数聚类**——对变化速率（斜率）聚类，识别"加速/减速/转折"模式：

```R
# 计算一阶导数（速度）
pdui_velocity <- t(apply(pdui_smoothed_final, 1, function(x) diff(x)))

eset_vel <- ExpressionSet(assayData = pdui_velocity)
eset_vel_std <- standardise(eset_vel)
cl_vel <- mfuzz(eset_vel_std, c = 9, m = 1.5)
mfuzz.plot(eset_vel_std, cl = cl_vel)
```

### 3.5 DBSCAN密度聚类

DBSCAN不需要预设K，基于密度发现任意形状的cluster。在t-SNE空间使用效果最佳：

```R
library(dbscan)

# 先做t-SNE降维
set.seed(42)
tsne_res <- Rtsne::Rtsne(data_scaled, dims = 2, perplexity = 30)
tsne_df <- data.frame(X = tsne_res$Y[, 1], Y = tsne_res$Y[, 2])

# 需要加微扰动避免奇异值（数据太相似时t-SNE无法分群）
data_scaled_pruned <- data_scaled + matrix(
  rnorm(nrow(data_scaled) * ncol(data_scaled), mean = 0, sd = 1e-6),
  nrow = nrow(data_scaled), ncol = ncol(data_scaled)
)

# DBSCAN聚类
db <- dbscan(tsne_df, eps = 0.5, minPts = 5)
tsne_df$cluster <- as.factor(db$cluster)
```

注意：当数据本身差异很小时，t-SNE可能呈现"一坨"——此时DBSCAN也无法有效分群。说明数据的全局结构可能是连续的而非离散分层。

### 3.6 GMM（高斯混合模型）聚类

```R
library(mclust)

# GMM聚类
gmm_res <- Mclust(data_scaled, G = 3)  # G = 簇数
summary(gmm_res)

# BIC模型选择
plot(gmm_res, what = "BIC")
plot(gmm_res, what = "classification")
```

GMM与K-means的区别：GMM允许椭圆形簇、不同大小的簇，且给出概率分配而非硬分配。

---

## 4. 时序差异表达：maSigPro

maSigPro专为时间序列实验设计，用多项式回归建模时间效应，筛选显著变化的基因。

```R
library(maSigPro)

# 构建实验设计矩阵
edesign <- data.frame(
  Time = meta_final$LogAge,        # 连续时间变量（对数年龄）
  Replicates = 1:nrow(meta_final),
  Group_All = 1                     # 所有样本为一组
)
rownames(edesign) <- rownames(meta_final)

# 二次多项式设计矩阵
design_res <- make.design.matrix(edesign, degree = 2)

# 第一步：全局筛选（BH校正）
fit <- p.vector(data_matrix, edesign, Q = 0.05, MT.adjust = "BH", min.obs = 3)

# 第二步：逐步回归
tstep <- T.fit(fit, step.method = "backward", alfa = 0.05)

# 第三步：提取显著基因（R²阈值）
sigs <- get.siggenes(tstep, rsq = 0.3, vars = "all")
sig_genes_list <- sigs$summary

cleaned_matrix <- data_matrix[sig_genes_list, ]
cat("maSigPro identify:", nrow(cleaned_matrix), "sig genes.\n")
```

参数说明：
- `degree = 2`：二次多项式，能捕捉"先升后降"等非线性趋势
- `Q = 0.05`：FDR控制阈值
- `rsq = 0.3`：模型R²阈值，过滤拟合不好的基因
- `min.obs = 3`：至少3个时间点有观测值

maSigPro的结果可以作为下游聚类的输入——只对时序显著变化的基因做聚类，减少噪声。

---

## 5. 时序平滑与断点检测

### 5.1 GAM平滑

用广义加性模型对每个基因的PDUI~Age关系做平滑拟合：

```R
library(mgcv)

fit <- gam(PDUI ~ s(Age, k = 5, bs = "cr"), data = df_single, method = "REML")
```

- `k = 5`：平滑基维度，不宜过大（样本少时易过拟合）
- `bs = "cr"`：三次回归样条

### 5.2 二阶导数断点检测

找到APA变化加速度最大的年龄点——即"发育转折点"：

```R
find_breakpoint_manual <- function(gene_id, data_mat, meta_df) {
  df_single <- data.frame(PDUI = as.numeric(data_mat[gene_id, ]),
                          Age = as.numeric(meta_df$LogAge))
  fit <- gam(PDUI ~ s(Age, k = 5, bs = "cr"), data = df_single, method = "REML")

  age_range <- range(df_single$Age)
  new_ages <- seq(age_range[1], age_range[2], length.out = 200)
  h <- 1e-4

  p_mid  <- predict(fit, newdata = data.frame(Age = new_ages))
  p_plus <- predict(fit, newdata = data.frame(Age = new_ages + h))
  p_minus <- predict(fit, newdata = data.frame(Age = new_ages - h))

  # 二阶导数: f''(x) ≈ [f(x+h) - 2f(x) + f(x-h)] / h²
  sec_deriv <- (p_plus - 2 * p_mid + p_minus) / (h^2)
  best_idx <- which.max(abs(sec_deriv))

  data.frame(gene = gene_id,
             bp_age = new_ages[best_idx],
             max_accel = sec_deriv[best_idx],
             mean_pdui = mean(df_single$PDUI))
}

# 并行运行全部基因
n_cores <- detectCores() - 4
results_list <- mclapply(rownames(data), function(g) {
  find_breakpoint_manual(g, data, meta)
}, mc.cores = n_cores)
final_breakpoints <- rbindlist(results_list)
```

所有基因断点的密度分布图可揭示发育阶段分界——密度峰值处即为最频繁的APA切换年龄。

### 5.3 带权重的GAM平滑

当某个发育阶段样本量极少（如Stage2仅17个样本）时，增加该阶段权重：

```R
meta$weight <- ifelse(meta$Age > 4.7 & meta$Age <= 21.2, 5, 1)

# 加密采样 + 权重拟合
target_ages <- c(
  seq(min(meta$Age), 4.7, length.out = 10),       # Stage 1
  seq(4.71, 21.2, length.out = 20),                # Stage 2 (加密)
  seq(21.21, max(meta$Age), length.out = 10)       # Stage 3
)

pdui_weighted_smooth <- apply(data, 1, function(x) {
  tmp_df <- data.frame(PDUI = as.numeric(x), Age = meta$Age, w = meta$weight)
  mod <- gam(PDUI ~ s(Age, k = 5), data = tmp_df, weights = w)
  predict(mod, newdata = data.frame(Age = target_ages))
})
```

---

## 6. 时间序列形状聚类：dtwclust

dtwclust使用Shape-Based Distance (SBD)，对时间序列的形状相似性聚类：

```R
library(dtwclust)

# 先对每个基因做GAM平滑到等距100个时间点
pdui_smoothed <- apply(data, 1, function(x) {
  tmp_df <- data.frame(PDUI = as.numeric(x), Age = meta$Age)
  mod <- gam(PDUI ~ s(Age, k = 5), data = tmp_df)
  predict(mod, newdata = data.frame(Age = target_ages))
})
pdui_smoothed_final <- t(pdui_smoothed)

# 取高变异基因
gene_vars <- apply(pdui_smoothed_final, 1, sd)
top_genes_idx <- order(gene_vars, decreasing = TRUE)[1:2000]

# Shape-based聚类
pc_sbd <- tsclust(pdui_smoothed_final[top_genes_idx, ],
                  type = "partitional",
                  k = 4L,
                  distance = "sbd",
                  centroid = "shape",
                  preproc = zscore)
plot(pc_sbd, type = "centroids")
```

---

## 7. 功能验证：聚类质量的生物学检验

### 7.1 聚类间GO富集Jaccard重叠度

理想情况下，不同cluster应富集到不同的生物学功能。用Jaccard指数量化cluster间的功能重叠：

```R
calc_jaccard <- function(set1, set2) {
  if (length(set1) == 0 && length(set2) == 0) return(0)
  length(intersect(set1, set2)) / length(union(set1, set2))
}

# 对每个K值计算平均Jaccard
for (k in 2:5) {
  gene_list_for_go <- split(all_genes_symbol, cluster_results[[paste0("K", k)]])
  ck <- compareCluster(geneCluster = gene_list_for_go,
                       fun = "enrichGO", OrgDb = org.Hs.eg.db,
                       keyType = "SYMBOL", ont = "BP",
                       pvalueCutoff = 1, qvalueCutoff = 1,
                       universe = universe_genes)
  # 计算所有cluster对之间的Jaccard
  cluster_pathways <- split(res_df$ID, res_df$Cluster)
  pairs <- combn(1:k, 2)
  j_values <- sapply(1:ncol(pairs), function(i) {
    calc_jaccard(cluster_pathways[[as.character(pairs[1, i])]],
                 cluster_pathways[[as.character(pairs[2, i])]])
  })
  avg_j <- mean(j_values, na.rm = TRUE)
}
```

Jaccard越低说明cluster间的功能区分度越好——选使Jaccard最低的K值。

### 7.2 Cluster Evolution Sankey图

展示不同K值下cluster之间的继承关系：

```R
library(ggalluvial)

sankey_data <- cluster_results %>%
  group_by(K2, K3, K4, K5) %>%
  summarise(n = n(), .groups = 'drop') %>%
  mutate(across(c(K2, K3, K4, K5), as.factor))

ggplot(sankey_data, aes(y = n, axis1 = K2, axis2 = K3, axis3 = K4, axis4 = K5)) +
  geom_alluvium(aes(fill = K2), width = 1/12, alpha = 0.7) +
  geom_stratum(width = 1/12, fill = "grey90", color = "grey") +
  geom_text(stat = "stratum", aes(label = after_stat(stratum)), size = 3)
```

---

## 8. 可视化：最终结果展示

### 8.1 ComplexHeatmap表达热图

```R
library(ComplexHeatmap)
library(circlize)

ordered_genes <- names(sort(final_labels))
plot_matrix <- data_scaled[ordered_genes, ]

row_ha <- rowAnnotation(
  Cluster = as.factor(final_labels[ordered_genes]),
  col = list(Cluster = c("1" = "#E41A1C", "2" = "#377EB8", "3" = "#4DAF4A")),
  show_annotation_name = FALSE
)

Heatmap(plot_matrix,
        name = "Z-score",
        cluster_rows = FALSE, cluster_columns = FALSE,
        left_annotation = row_ha,
        show_row_names = FALSE,
        col = colorRamp2(c(-2, 0, 2), c("navy", "white", "firebrick3")),
        row_split = final_labels[ordered_genes],
        row_gap = unit(2, "mm"),
        border = TRUE)
```

---

## 9. 方法选择决策树

| 场景 | 推荐方法 | 理由 |
|------|----------|------|
| 确定最优K | NbClust (30指标投票) | 最全面，避免单一指标偏差 |
| 硬聚类 | K-means + HC交叉验证 | ARI验证一致性 |
| 软聚类（隶属度） | Mfuzz | 处理边界基因，给出membership |
| 时序DE筛选 | maSigPro | 专为时间序列设计，多项式回归 |
| 形状相似性聚类 | dtwclust (SBD) | 对时间序列shape敏感 |
| 连续空间密度聚类 | DBSCAN | 不需预设K，发现任意形状簇 |
| 概率聚类 | GMM (mclust) | 椭圆簇+概率分配 |
| 发育断点检测 | GAM二阶导数 | 找APA变化加速最大的年龄点 |
| 聚类质量评估 | GO Jaccard重叠度 | 生物学意义验证 |

---

## 10. 常见陷阱与经验

1. **数据太相似时**：t-SNE呈"一坨"，DBSCAN/GMM均无法有效分群。说明全局结构连续而非离散。可尝试过滤低方差基因或只取高变异基因子集。

2. **二次标准化问题**：已ComBat校正的数据严禁再scale()，会破坏校正后的分布特性。

3. **Stage2样本量过少（N=17）**：需在GAM平滑时加权重，或在maSigPro中用LogAge而非分组变量。

4. **浮点精度陷阱**：合并/子集操作可能引入浮点差异，导致下游分析出现微小不一致。

5. **NbClust的distance参数**：如果传入了预计算的`diss`矩阵，`distance`必须设为NULL，否则会冲突。

6. **Mfuzz的m参数**：不要手动设定，用`mestimate()`自动估计。过大的m会使所有cluster趋于"一样软"。

---

*来源：2026年1月工作日志 `/root/ops/vault/OB/2026/1 working-log.md`*
*上下文：PFC life-span APA时序模式识别分析*
