---
title: "服务器管理速查表"
date: 2026-05-08
tags: [server, linux, cheatsheet]
---

# 服务器管理速查表

自己常用的命令，方便快速查阅。

---

## 文件操作

```bash
du -sh directory/          # 目录大小
find . -type f -size +1G   # 找大文件
find . -name "*.tmp" -delete  # 批量删除

# 统计行数
wc -l file.txt

# 前/后几行
head -n 20 file.txt
tail -n 20 file.txt
```

---

## 进程管理

```bash
ps aux | grep python       # 找进程
htop                       # 友好的top

# 后台运行
nohup python script.py > output.log 2>&1 &
jobs                       # 查看后台任务
kill -9 PID                 # 杀进程
```

---

## 磁盘管理

```bash
df -h                      # 磁盘使用
du -sh */ | sort -h        # 目录大小排序

# 清理
conda clean --all           # conda缓存
docker system prune -a      # Docker清理
```

---

## Slurm

```bash
sbatch job_script.sh        # 提交任务
squeue -u $USER             # 查看任务
scancel JOB_ID              # 取消任务
scontrol show job JOB_ID   # 任务详情
sinfo                       # 节点信息
```

---

## 网络

```bash
ping google.com             # 测试连接
lsof -i :8080              # 端口占用
scp file user@server:/path  # 传输文件
rsync -avz dir/ user@server:/path/  # 同步目录
```