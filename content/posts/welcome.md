---
title: 欢迎来到我的个人博客
date: 2026-06-03
category: 站点说明
tags: [GitHub Pages, Markdown, 写作]
pdf:
summary: 这个站点使用原生 HTML、CSS、JavaScript 搭建，文章保存在仓库中，并由 GitHub Actions 自动部署。
---

# 欢迎来到我的个人博客

这里是一个轻量的 GitHub Pages 博客。它把内容和代码都放在同一个仓库里，方便长期维护，也方便从 GitHub 网页直接修改 Markdown。

## 为什么选择轻量方案

静态博客最重要的是稳定、可迁移和容易维护。这个模板没有后端服务，也没有复杂框架，核心流程只有三步：

1. 在 `content/posts/` 或 `content/diary/` 写 Markdown。
2. 构建脚本扫描内容并生成 `data/site.json`。
3. GitHub Actions 部署到 GitHub Pages。

## 代码块

```js
const message = "保持简单，才能写得更久。";
console.log(message);
```

## 数学公式

行内公式示例：$E = mc^2$。

块级公式示例：

$$
\hat{\beta} = (X'X)^{-1}X'y
$$

## 图片与附件

Markdown 图片可以放在 `resources/uploads/`：

![头像示例](resources/uploads/avatar.png)

如果文章有 PDF，可以在 Front Matter 的 `pdf` 字段里填写链接。
