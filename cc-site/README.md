# cc's site

cupcake (cc) 的个人主页 + 学习笔记站

薄荷绿 × 白底 × Quartz v4

---

## 本地开发

```bash
# 1. fork https://github.com/jackyzha0/quartz
# 然后把这些文件复制进去

# 2. 安装依赖
npm install

# 3. 本地预览
npx quartz build --serve
# 打开 http://localhost:8080
```

## 文件结构

```
content/
  index.md          # 首页
  about.md          # 关于我
  notes/
    index.md        # 笔记目录
    *.md            # 每篇笔记
quartz.config.ts    # 网站配置（颜色、标题等）
custom.scss         # 自定义样式（放到 quartz/styles/custom.scss）
.github/workflows/
  deploy.yml        # 自动部署到 GitHub Pages
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

push 到 main 分支后自动部署 ✨

## 自定义样式

`custom.scss` 复制到 `quartz/styles/custom.scss`，修改颜色在 `quartz.config.ts` 里改 `secondary` 的值。
