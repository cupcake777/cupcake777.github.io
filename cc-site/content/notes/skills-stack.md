---
title: "技能栈 & 工具箱"
date: 2026-03-31
tags:
  - about
  - skills
---

> 记录我在用和正在学的工具，持续更新。

---

## 编程语言

```mermaid
graph LR
    A[Python] -->|熟练| B[数据分析]
    A -->|熟练| C[脚本自动化]
    D[R] -->|常用| E[统计分析]
    D -->|常用| F[可视化]
    G[Bash] -->|日常| H[服务器管理]
    I[JavaScript] -->|学习中| J[Web 开发]
```

**Python** ⭐⭐⭐⭐  
主力语言。pandas、numpy、matplotlib 用得最多，最近在学 FastAPI。

**R** ⭐⭐⭐  
做统计和画图。ggplot2、DESeq2、Seurat 是常客。

**Bash** ⭐⭐⭐  
服务器日常操作、批处理脚本。

**JavaScript / React** ⭐⭐  
最近开始学前端，正在做 Cat Journal 项目。

---

## 生信工具

### 测序数据分析
- **STAR** / **HISAT2** - RNA-seq 比对
- **featureCounts** - 基因计数
- **DESeq2** / **edgeR** - 差异表达分析
- **BWA** / **Bowtie2** - DNA 比对
- **GATK** - 变异检测

### 可视化
- **IGV** - 基因组浏览器
- **ggplot2** - R 绘图
- **matplotlib** / **seaborn** - Python 绘图

---

## 服务器 & DevOps

```mermaid
mindmap
  root((服务器技能))
    Linux
      Ubuntu
      CentOS
    容器化
      Docker
      Singularity
    资源管理
      Slurm
      PBS
    版本控制
      Git
      GitHub
```

**正在学习**：
- Container 技术（Docker + Singularity）
- CI/CD 基础
- Nginx 反向代理

---

## AI 工具

**日常使用**：
- Claude / ChatGPT - 代码调试、文档理解
- GitHub Copilot - 代码补全
- Cursor - AI 辅助编程

**实验中**：
- 用 LLM 辅助文献总结
- 自动化生成分析报告

---

## 学习路线

```mermaid
timeline
    title 技能发展时间线
    2023 : 开始学 Python
         : 接触 R 和生信分析
    2024 : 深入 RNA-seq 流程
         : 学习服务器管理
    2025 : 开始学 Container
         : 尝试 Web 开发
    2026 : 探索 AI 工具应用
         : 构建个人项目
```

---

*最后更新：2026-03-31*
