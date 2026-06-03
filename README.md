# 个人博客网站

这是一个面向 GitHub Pages 的轻量静态博客模板。内容放在仓库里，文章和日记使用 Markdown，`scripts/build-site-data.js` 会扫描内容与 JSON 数据并生成 `data/site.json`，GitHub Actions 会自动构建并部署。

## 目录

- `content/posts/`：博客文章 Markdown
- `content/diary/`：日记 Markdown
- `resources/uploads/`：图片、PDF、附件等资源
- `data/profile.json`：个人资料与仓库配置
- `data/friends.json`：友链
- `data/resources.json`：资源列表
- `data/plans.json`：计划列表
- `data/site.json`：自动生成的站点数据
- `scripts/build-site-data.js`：构建脚本
- `.github/workflows/pages.yml`：GitHub Pages 自动部署

## 本地预览

```bash
npm run build
npm run serve
```

然后访问 `http://localhost:8093`。

## 写作台

写作台没有放在导航里。站长可以直接访问 `#/studio`，使用 GitHub Token 登录后在网页内新建或编辑文章。Token 只保存在浏览器会话中，不会写入仓库。

GitHub Token 建议使用 fine-grained personal access token，并只授权当前仓库的 `Contents: Read and write`。

## Markdown Front Matter

```markdown
---
title: 文章标题
date: 2026-06-03
category: 研究札记
tags: [Markdown, GitHub Pages]
pdf: resources/uploads/example.pdf
summary: 首页和列表页显示的摘要。
---

正文从这里开始。
```
