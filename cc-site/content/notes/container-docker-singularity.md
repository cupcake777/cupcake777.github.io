---
title: "Container 踩坑：Docker vs Singularity"
date: 2026-03-28
tags:
  - server
  - container
  - tutorial
---

> 这是我今天才开始学 container，边学边写的记录。不是教程，是踩坑日记。

---

## 为什么要学 container

在服务器上跑生信流程，最头疼的是**环境依赖**。  
A 软件要 Python 3.8，B 软件要 Python 3.11，互相冲突，conda 环境管理到后来一团乱。

Container 的思路是：把软件和它需要的所有依赖打包成一个镜像，哪里都能跑，不污染宿主机环境。

---

## Docker vs Singularity

| | Docker | Singularity |
|---|---|---|
| 适用场景 | 本地开发、云服务器 | HPC / 集群（无 root）|
| 权限要求 | 需要 root / sudo | 不需要 root |
| 生信常用度 | 一般 | 非常常用 |

**结论**：如果你在用学校的 HPC 集群，大概率只能用 Singularity。  
如果是自己的服务器，Docker 更方便。

---

## 我踩的坑

1. `docker run` 忘了加 `-v` 挂载数据目录，容器里找不到文件
2. Singularity pull 镜像时网络超时，要挂代理或者找国内镜像
3. 权限问题：容器内生成的文件 owner 是 root，宿主机改不了

---

*持续更新中……*
