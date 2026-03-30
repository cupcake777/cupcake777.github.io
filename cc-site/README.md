# cc's site

cupcake (cc) 的个人主页 + 学习笔记站

薄荷绿 × 白底 × Quartz v4

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 本地预览
node ./quartz/bootstrap-cli.mjs build --serve --directory cc-site/content
# 打开 http://localhost:8080
```

## 文件结构

```
cc-site/content/
  index.md          # 首页
  about.md          # 关于我
  notes/
    index.md        # 笔记目录
    *.md            # 每篇笔记
quartz.config.ts    # 根目录 Quartz 配置
quartz.layout.ts    # 根目录页面布局
quartz/styles/custom.scss
.github/workflows/deploy.yml
```

## 如何添加新笔记

在 `content/notes/` 下新建 `.md` 文件，顶部加 frontmatter：

```markdown
---
title: "笔记标题"
date: 2026-03-28
tags:
  - server
  - bioinformatics
---

正文内容...
```

push 到默认部署分支后会通过 GitHub Actions 自动部署到 GitHub Pages。

## 自定义样式

样式直接改 `quartz/styles/custom.scss`，颜色在根目录 `quartz.config.ts` 里调整。
