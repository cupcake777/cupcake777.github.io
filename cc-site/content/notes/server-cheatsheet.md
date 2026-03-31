---
title: "服务器管理速查表"
date: 2026-03-31
tags:
  - server
  - linux
  - cheatsheet
---

> 常用的服务器命令和配置，方便快速查阅。

---

## 文件操作

```bash
# 查看文件大小
du -sh directory/

# 查找大文件
find . -type f -size +1G

# 批量重命名
for file in *.txt; do
    mv "$file" "${file%.txt}.bak"
done

# 统计文件行数
wc -l file.txt

# 查看文件前/后几行
head -n 20 file.txt
tail -n 20 file.txt
```

---

## 进程管理

```bash
# 查看进程
ps aux | grep python

# 查看资源占用
top
htop  # 更友好的界面

# 后台运行
nohup python script.py > output.log 2>&1 &

# 查看后台任务
jobs

# 杀死进程
kill -9 PID
```

---

## 磁盘管理

```bash
# 查看磁盘使用
df -h

# 查看目录大小（排序）
du -sh */ | sort -h

# 清理空间
# 1. 删除旧日志
find /var/log -name "*.log" -mtime +30 -delete

# 2. 清理 conda 缓存
conda clean --all

# 3. 清理 Docker
docker system prune -a
```

---

## 网络相关

```bash
# 测试连接
ping google.com

# 查看端口占用
netstat -tuln | grep 8080
lsof -i :8080

# 下载文件
wget https://example.com/file.tar.gz
curl -O https://example.com/file.tar.gz

# 传输文件
scp local_file user@server:/remote/path
rsync -avz local_dir/ user@server:/remote/dir/
```

---

## Slurm 任务管理

```bash
# 提交任务
sbatch job_script.sh

# 查看任务状态
squeue -u $USER

# 取消任务
scancel JOB_ID

# 查看任务详情
scontrol show job JOB_ID

# 查看节点信息
sinfo
```

**任务脚本模板**：
```bash
#!/bin/bash
#SBATCH --job-name=my_job
#SBATCH --output=output_%j.log
#SBATCH --error=error_%j.log
#SBATCH --nodes=1
#SBATCH --ntasks=8
#SBATCH --mem=32G
#SBATCH --time=24:00:00

# 加载环境
module load python/3.9

# 运行任务
python analysis.py
```

---

## 权限管理

```bash
# 修改权限
chmod 755 script.sh  # rwxr-xr-x
chmod +x script.sh   # 添加执行权限

# 修改所有者
chown user:group file.txt

# 递归修改
chmod -R 755 directory/
chown -R user:group directory/
```

---

## 压缩解压

```bash
# tar.gz
tar -czvf archive.tar.gz directory/
tar -xzvf archive.tar.gz

# zip
zip -r archive.zip directory/
unzip archive.zip

# gzip
gzip file.txt
gunzip file.txt.gz
```

---

## 实用技巧

### 1. 查看命令历史
```bash
history | grep "keyword"
```

### 2. 快速跳转目录
```bash
# 回到上一个目录
cd -

# 回到家目录
cd ~
```

### 3. 批量操作
```bash
# 批量创建目录
mkdir -p project/{data,results,scripts}

# 批量删除
find . -name "*.tmp" -delete
```

### 4. 监控日志
```bash
# 实时查看日志
tail -f logfile.log

# 搜索日志
grep "ERROR" logfile.log
```

---

*持续更新中……*
