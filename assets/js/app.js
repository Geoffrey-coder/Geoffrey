(() => {
  const DATA_URL = "data/site.json";
  const app = document.getElementById("app");
  const searchForm = document.getElementById("top-search");
  const searchInput = document.getElementById("search-input");
  const siteTitle = document.getElementById("site-title");

  const themes = [
    { id: "petit", name: "软萌粉蓝", swatch: "swatch-petit" },
    { id: "paper", name: "浅色阅读", swatch: "swatch-paper" },
    { id: "blush", name: "粉色时尚", swatch: "swatch-blush" },
    { id: "moss", name: "自然绿色", swatch: "swatch-moss" },
    { id: "retro", name: "复古纸页", swatch: "swatch-retro" },
    { id: "midnight", name: "深色夜读", swatch: "swatch-midnight" }
  ];

  const state = {
    site: null,
    theme: localStorage.getItem("blog-theme") || "petit"
  };

  const studio = {
    type: "post",
    slug: "",
    title: "",
    date: today(),
    category: "随笔",
    tags: "",
    pdf: "",
    summary: "",
    body: ""
  };

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    return `<i data-lucide="${name}" aria-hidden="true"></i>`;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function applyTheme(themeId) {
    const nextTheme = themes.some((theme) => theme.id === themeId) ? themeId : "petit";
    state.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("blog-theme", nextTheme);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [pathPart, queryPart = ""] = raw.split("?");
    const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
    return {
      path,
      params: new URLSearchParams(queryPart)
    };
  }

  function setActiveNav(path) {
    const root = path.startsWith("/post/")
      ? "/blog"
      : path.startsWith("/diary")
        ? "/diary"
        : path.startsWith("/resources")
          ? "/resources"
          : path.startsWith("/plans")
            ? "/plans"
            : path.startsWith("/search")
              ? ""
              : "/";

    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === root);
    });
  }

  async function loadSite() {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`无法载入 ${DATA_URL}`);
    state.site = await response.json();
    const title = state.site.profile?.siteTitle || "个人博客";
    document.title = title;
    siteTitle.textContent = title;
  }

  function getAllArticles() {
    return [...(state.site.posts || []), ...(state.site.diary || [])];
  }

  function articleLabel(item) {
    return item.type === "diary" ? "日记" : "博客";
  }

  function getArticle(type, slug) {
    const list = type === "diary" ? state.site.diary : state.site.posts;
    return list.find((item) => item.slug === slug);
  }

  function renderThemes() {
    return `
      <div class="theme-grid" role="group" aria-label="主题切换">
        ${themes
          .map(
            (theme) => `
              <button class="theme-button ${theme.id === state.theme ? "is-active" : ""}" data-theme-id="${theme.id}" type="button" title="${escapeHtml(theme.name)}">
                <span class="theme-swatch ${theme.swatch}" aria-hidden="true"></span>
                <span>${escapeHtml(theme.name)}</span>
              </button>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderModule(title, iconName, body) {
    return `
      <section class="module-panel">
        <h2 class="module-title">${icon(iconName)}${escapeHtml(title)}</h2>
        ${body}
      </section>
    `;
  }

  function renderAestheticModule(profile) {
    const aesthetic = profile.aesthetic || {};
    const palette = Array.isArray(aesthetic.palette) ? aesthetic.palette : [];
    const references = Array.isArray(aesthetic.references) ? aesthetic.references : [];
    if (!palette.length && !references.length && !aesthetic.note) return "";

    return renderModule(
      "灵感板",
      "sparkles",
      `<div class="aesthetic-module">
        ${aesthetic.note ? `<p class="aesthetic-note">${escapeHtml(aesthetic.note)}</p>` : ""}
        ${
          palette.length
            ? `<div class="palette-row">
                ${palette
                  .map(
                    (item) => `
                      <span class="palette-chip" title="${escapeHtml(item.name)}">
                        <span style="background:${escapeHtml(item.color)}"></span>
                        ${escapeHtml(item.name)}
                      </span>
                    `
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${
          references.length
            ? `<div class="reference-list">
                ${references
                  .map(
                    (item) => `
                      <a class="reference-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.subtitle || "")}</span>
                      </a>
                    `
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>`
    );
  }

  function renderProfileColumn() {
    const profile = state.site.profile || {};
    const categories = state.site.categories || [];
    const tags = state.site.tags || [];
    const friends = state.site.friends || [];

    return `
      <aside class="profile-column">
        <section class="profile-panel">
          <div class="profile-card">
            <img class="avatar" src="${escapeHtml(profile.avatar || "")}" alt="${escapeHtml(profile.nickname || "头像")}" />
            <div>
              <h1>${escapeHtml(profile.nickname || "站长")}</h1>
              <p>${escapeHtml(profile.location || "")}</p>
            </div>
          </div>
          <p class="profile-bio">${escapeHtml(profile.bio || "")}</p>
        </section>

        ${renderModule("主题", "palette", renderThemes())}

        ${renderAestheticModule(profile)}

        ${renderModule(
          "分类",
          "folder-open",
          `<div class="chip-list">
            ${
              categories.length
                ? categories
                    .map(
                      (item) =>
                        `<a class="chip" href="#/blog?category=${encodeURIComponent(item.name)}">${escapeHtml(item.name)} · ${item.count}</a>`
                    )
                    .join("")
                : '<span class="chip">暂无分类</span>'
            }
          </div>`
        )}

        ${renderModule(
          "标签",
          "tags",
          `<div class="chip-list">
            ${
              tags.length
                ? tags
                    .map(
                      (item) =>
                        `<a class="chip" href="#/blog?tag=${encodeURIComponent(item.name)}">${escapeHtml(item.name)} · ${item.count}</a>`
                    )
                    .join("")
                : '<span class="chip">暂无标签</span>'
            }
          </div>`
        )}

        ${renderModule(
          "友链",
          "link",
          `<div class="friend-list">
            ${
              friends.length
                ? friends
                    .map(
                      (friend) => `
                        <a class="friend-link" href="${escapeHtml(friend.url)}" target="_blank" rel="noopener noreferrer">
                          <img src="${escapeHtml(friend.avatar || "")}" alt="${escapeHtml(friend.title)}" />
                          <span>
                            <strong>${escapeHtml(friend.title)}</strong>
                            <span>${escapeHtml(friend.subtitle || "")}</span>
                          </span>
                        </a>
                      `
                    )
                    .join("")
                : '<div class="empty-state">暂无友链</div>'
            }
          </div>`
        )}
      </aside>
    `;
  }

  function renderArticleCard(item) {
    const href = item.url;
    return `
      <a class="article-card" href="${escapeHtml(href)}">
        <div class="card-meta">
          <span>${escapeHtml(formatDate(item.date))}</span>
          <span>${escapeHtml(item.category)}</span>
          <span>${escapeHtml(articleLabel(item))}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary || "")}</p>
        <div class="card-tags">
          ${(item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </a>
    `;
  }

  function renderHome() {
    const recentPosts = state.site.recentPosts || [];
    const aesthetic = state.site.profile?.aesthetic || {};
    app.innerHTML = `
      <div class="home-grid">
        ${renderProfileColumn()}
        <section class="home-main">
          ${
            aesthetic.poster
              ? `<section class="soft-banner">
                  <div>
                    <span class="banner-kicker">soft reading desk</span>
                    <h2>${escapeHtml(aesthetic.title || "小而可爱的书桌")}</h2>
                    <p>${escapeHtml(aesthetic.note || "")}</p>
                  </div>
                  <img src="${escapeHtml(aesthetic.poster)}" alt="${escapeHtml(aesthetic.title || "柔和书桌插画")}" />
                </section>`
              : ""
          }
          <div class="section-head">
            <div>
              <h2>近期文章</h2>
              <p>博客文章会显示在这里，日记默认留在日记页。</p>
            </div>
            <a class="chip" href="#/blog">全部博客</a>
          </div>
          <div class="article-grid">
            ${recentPosts.length ? recentPosts.map(renderArticleCard).join("") : '<div class="empty-state">暂无文章</div>'}
          </div>
        </section>
      </div>
    `;
  }

  function pageHeading(title, subtitle = "") {
    return `
      <header class="page-heading">
        <div>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
      </header>
    `;
  }

  function renderCollection(type, route) {
    const isDiary = type === "diary";
    const source = isDiary ? state.site.diary || [] : state.site.posts || [];
    const category = route.params.get("category");
    const tag = route.params.get("tag");
    const filtered = source.filter((item) => {
      if (category && item.category !== category) return false;
      if (tag && !(item.tags || []).includes(tag)) return false;
      return true;
    });

    const title = isDiary ? "日记" : "博客";
    const subtitle = category
      ? `分类：${category}`
      : tag
        ? `标签：${tag}`
        : isDiary
          ? "Markdown 日记独立归档，不进入首页近期文章。"
          : "文章支持分类、标签、数学公式、代码块、图片和 PDF 链接。";

    app.innerHTML = `
      ${pageHeading(title, subtitle)}
      ${
        category || tag
          ? `<div class="filter-row"><a class="chip" href="#/${isDiary ? "diary" : "blog"}">${icon("x")}清除筛选</a></div>`
          : ""
      }
      <div class="article-grid">
        ${filtered.length ? filtered.map(renderArticleCard).join("") : '<div class="empty-state">暂无匹配内容</div>'}
      </div>
    `;
  }

  function markdownToHtml(markdown) {
    if (!window.marked || !window.DOMPurify) {
      return `<p>${escapeHtml(markdown).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
    }
    window.marked.setOptions({
      gfm: true,
      breaks: false,
      mangle: false,
      headerIds: false
    });
    return window.DOMPurify.sanitize(window.marked.parse(markdown || ""));
  }

  function slugifyHeading(text, used) {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "") || "section";
    let next = base;
    let index = 2;
    while (used.has(next)) {
      next = `${base}-${index}`;
      index += 1;
    }
    used.add(next);
    return next;
  }

  function enrichMarkdown(container, titleForDedup = "") {
    const firstHeading = container.querySelector("h1");
    if (firstHeading && firstHeading.textContent.trim() === titleForDedup) {
      firstHeading.remove();
    }

    const used = new Set();
    const toc = [];
    container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      const text = heading.textContent.trim();
      const level = Number(heading.tagName.slice(1));
      const id = slugifyHeading(text, used);
      heading.id = id;
      toc.push({ id, text, level });
    });

    container.querySelectorAll("pre code").forEach((block) => {
      if (window.hljs) window.hljs.highlightElement(block);
    });

    container.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    if (window.renderMathInElement) {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }

    return toc;
  }

  function renderToc(toc) {
    if (!toc.length) return '<p class="status-line">暂无目录</p>';
    return `
      <ul class="toc-list">
        ${toc
          .map(
            (item) => `
              <li class="toc-level-${item.level}">
                <a href="#${escapeHtml(item.id)}" data-scroll-heading="${escapeHtml(item.id)}">${escapeHtml(item.text)}</a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderSameCategory(item) {
    const source = item.type === "diary" ? state.site.diary || [] : state.site.posts || [];
    const same = source.filter((entry) => entry.category === item.category);
    return `
      <ul class="side-list">
        ${same
          .map(
            (entry) => `
              <li>
                <a class="${entry.slug === item.slug ? "is-current" : ""}" href="${escapeHtml(entry.url)}">
                  ${escapeHtml(entry.title)}
                </a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderPager(item) {
    const link = (target, label) =>
      target
        ? `<a class="pager-link" href="${escapeHtml(target.url)}"><span>${label}</span>${escapeHtml(target.title)}</a>`
        : `<div class="pager-link"><span>${label}</span>没有更多文章</div>`;

    return `
      <nav class="article-pager" aria-label="上一篇和下一篇">
        ${link(item.previous, "上一篇")}
        ${link(item.next, "下一篇")}
      </nav>
    `;
  }

  function renderArticle(type, slug) {
    const item = getArticle(type, slug);
    if (!item) {
      renderNotFound();
      return;
    }

    app.innerHTML = `
      <div class="reader-shell" id="reader-shell">
        <aside class="reader-side" id="left-reader-side">
          <button class="icon-button" type="button" data-toggle-side="left" title="展开同分类文章">${icon("panel-left-open")}</button>
          <div class="reader-side-content">
            <h2 class="side-title">同分类文章</h2>
            ${renderSameCategory(item)}
          </div>
        </aside>

        <article class="reader-article">
          <header class="article-header">
            <h1>${escapeHtml(item.title)}</h1>
            <div class="article-meta">
              <span>${icon("calendar-days")}${escapeHtml(formatDate(item.date))}</span>
              <a href="#/${item.type === "diary" ? "diary" : "blog"}?category=${encodeURIComponent(item.category)}">${icon("folder")}${escapeHtml(item.category)}</a>
              ${item.pdf ? `<a href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener noreferrer">${icon("file-text")}PDF</a>` : ""}
              ${(item.tags || [])
                .map((tag) => `<a href="#/${item.type === "diary" ? "diary" : "blog"}?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`)
                .join("")}
            </div>
          </header>
          <div class="markdown-body" id="article-body">${markdownToHtml(item.body)}</div>
          ${renderPager(item)}
        </article>

        <aside class="reader-side" id="right-reader-side">
          <button class="icon-button" type="button" data-toggle-side="right" title="展开文章目录">${icon("list-tree")}</button>
          <div class="reader-side-content">
            <h2 class="side-title">文章目录</h2>
            <div id="article-toc"></div>
          </div>
        </aside>
      </div>
    `;

    const body = document.getElementById("article-body");
    const toc = enrichMarkdown(body, item.title);
    document.getElementById("article-toc").innerHTML = renderToc(toc);
    document.title = `${item.title} · ${state.site.profile?.siteTitle || "个人博客"}`;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\s+/g, "");
  }

  function bigrams(value) {
    const text = normalizeText(value);
    if (!text) return [];
    if (text.length <= 2) return [...text];
    const result = [];
    for (let index = 0; index < text.length - 1; index += 1) {
      result.push(text.slice(index, index + 2));
    }
    return result;
  }

  function diceSimilarity(query, target) {
    const left = bigrams(query);
    const right = bigrams(target);
    if (!left.length || !right.length) return 0;
    const counts = new Map();
    right.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
    let hits = 0;
    left.forEach((item) => {
      const count = counts.get(item) || 0;
      if (count > 0) {
        hits += 1;
        counts.set(item, count - 1);
      }
    });
    return (2 * hits) / (left.length + right.length);
  }

  function searchArticles(query) {
    const q = normalizeText(query);
    if (!q) return [];

    const prepared = getAllArticles().map((item) => {
      const text = [item.title, item.summary, item.category, ...(item.tags || []), item.body].join(" ");
      const normalized = normalizeText(text);
      const title = normalizeText(item.title);
      const exact = normalized.includes(q);
      const titleExact = title.includes(q);
      const score = exact
        ? 100 + (titleExact ? 30 : 0) + (normalizeText(item.summary).includes(q) ? 10 : 0)
        : diceSimilarity(query, text) * 100 + diceSimilarity(query, item.title) * 40;

      return { item, exact, score };
    });

    const exact = prepared.filter((entry) => entry.exact);
    const source = exact.length ? exact : prepared.filter((entry) => entry.score > 0);
    return source
      .sort((a, b) => b.score - a.score || new Date(b.item.date) - new Date(a.item.date))
      .slice(0, 30)
      .map((entry) => entry.item);
  }

  function renderSearch(route) {
    const query = route.params.get("q") || "";
    const results = searchArticles(query);
    app.innerHTML = `
      ${pageHeading("搜索", query ? `关键词：${query}` : "先输入关键词，再查看匹配文章。")}
      <form class="search-page-form" id="search-page-form">
        <input type="search" id="search-page-input" value="${escapeHtml(query)}" placeholder="输入标题、标签、正文关键词" autocomplete="off" />
        <button class="primary-button" type="submit">${icon("search")}搜索</button>
      </form>
      <div class="result-list">
        ${
          query
            ? results.length
              ? results.map(renderArticleCard).join("")
              : '<div class="empty-state">没有找到匹配文章</div>'
            : '<div class="empty-state">输入内容后开始搜索</div>'
        }
      </div>
    `;
  }

  function renderResources() {
    const resources = state.site.resources || [];
    app.innerHTML = `
      ${pageHeading("资源", "PDF、文件、链接和数据集可以集中放在这里。")}
      <div class="resource-grid">
        ${
          resources.length
            ? resources
                .map(
                  (item) => `
                    <a class="resource-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                      <div class="resource-meta">
                        <span>${escapeHtml(item.type || "Resource")}</span>
                      </div>
                      <h3>${escapeHtml(item.title)}</h3>
                      <p>${escapeHtml(item.description || "")}</p>
                      <div class="card-tags">
                        ${(item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                      </div>
                    </a>
                  `
                )
                .join("")
            : '<div class="empty-state">暂无资源</div>'
        }
      </div>
    `;
  }

  function renderPlans() {
    const plans = state.site.plans || [];
    app.innerHTML = `
      ${pageHeading("计划", "目标、进度和完成状态。")}
      <div class="plan-grid">
        ${
          plans.length
            ? plans
                .map(
                  (item) => `
                    <article class="plan-card">
                      <div class="plan-meta">
                        <span>${escapeHtml(item.status || "")}</span>
                        ${item.due ? `<span>${icon("calendar-check")}${escapeHtml(item.due)}</span>` : ""}
                      </div>
                      <h3>${escapeHtml(item.title)}</h3>
                      <div class="progress-track" aria-label="进度 ${Number(item.progress || 0)}%">
                        <div class="progress-bar" style="width: ${Math.max(0, Math.min(100, Number(item.progress || 0)))}%"></div>
                      </div>
                      <ul class="plan-items">
                        ${(item.items || []).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
                      </ul>
                    </article>
                  `
                )
                .join("")
            : '<div class="empty-state">暂无计划</div>'
        }
      </div>
    `;
  }

  function renderNotFound() {
    document.title = state.site.profile?.siteTitle || "个人博客";
    app.innerHTML = `
      ${pageHeading("没有找到页面", "检查地址，或返回首页。")}
      <a class="primary-button" href="#/">${icon("home")}返回首页</a>
    `;
  }

  function studioSession() {
    const profileGithub = state.site.profile?.github || {};
    return {
      token: sessionStorage.getItem("studio-token") || "",
      owner: sessionStorage.getItem("studio-owner") || profileGithub.owner || "",
      repo: sessionStorage.getItem("studio-repo") || profileGithub.repo || "",
      branch: sessionStorage.getItem("studio-branch") || profileGithub.branch || "main"
    };
  }

  function renderStudioLogin() {
    const session = studioSession();
    return `
      ${pageHeading("写作台", "隐藏入口")}
      <section class="studio-panel">
        <form class="studio-login" id="studio-login-form">
          <div class="field wide">
            <label for="studio-token">GitHub Token</label>
            <input class="studio-input" id="studio-token" type="password" autocomplete="off" required />
          </div>
          <div class="field">
            <label for="studio-owner">Owner</label>
            <input class="studio-input" id="studio-owner" value="${escapeHtml(session.owner)}" required />
          </div>
          <div class="field">
            <label for="studio-repo">Repo</label>
            <input class="studio-input" id="studio-repo" value="${escapeHtml(session.repo)}" required />
          </div>
          <div class="field">
            <label for="studio-branch">Branch</label>
            <input class="studio-input" id="studio-branch" value="${escapeHtml(session.branch)}" required />
          </div>
          <div class="button-row wide">
            <button class="primary-button" type="submit">${icon("log-in")}进入</button>
          </div>
        </form>
      </section>
    `;
  }

  function studioArticleOptions() {
    const items = studio.type === "diary" ? state.site.diary || [] : state.site.posts || [];
    return [
      '<option value="">新建</option>',
      ...items.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.title)}</option>`)
    ].join("");
  }

  function renderStudioWorkspace() {
    return `
      ${pageHeading("写作台", "Markdown 编辑与预览")}
      <section class="studio-panel">
        <div class="studio-workspace">
          <form class="studio-toolbar" id="studio-meta-form">
            <div class="field">
              <label for="studio-type">类型</label>
              <select class="studio-select" id="studio-type">
                <option value="post" ${studio.type === "post" ? "selected" : ""}>博客</option>
                <option value="diary" ${studio.type === "diary" ? "selected" : ""}>日记</option>
              </select>
            </div>
            <div class="field">
              <label for="studio-existing">文章</label>
              <select class="studio-select" id="studio-existing">${studioArticleOptions()}</select>
            </div>
            <div class="field">
              <label for="studio-title-field">标题</label>
              <input class="studio-input" id="studio-title-field" value="${escapeHtml(studio.title)}" required />
            </div>
            <div class="field">
              <label for="studio-slug-field">Slug</label>
              <input class="studio-input" id="studio-slug-field" value="${escapeHtml(studio.slug)}" required />
            </div>
            <div class="field">
              <label for="studio-date-field">日期</label>
              <input class="studio-input" id="studio-date-field" type="date" value="${escapeHtml(studio.date)}" required />
            </div>
            <div class="field">
              <label for="studio-category-field">分类</label>
              <input class="studio-input" id="studio-category-field" value="${escapeHtml(studio.category)}" />
            </div>
            <div class="field">
              <label for="studio-tags-field">标签</label>
              <input class="studio-input" id="studio-tags-field" value="${escapeHtml(studio.tags)}" />
            </div>
            <div class="field">
              <label for="studio-pdf-field">PDF</label>
              <input class="studio-input" id="studio-pdf-field" value="${escapeHtml(studio.pdf)}" />
            </div>
            <div class="field">
              <label for="studio-summary-field">摘要</label>
              <textarea class="studio-textarea" id="studio-summary-field" rows="4" style="min-height: 110px">${escapeHtml(studio.summary)}</textarea>
            </div>
            <div class="button-row wide">
              <button class="secondary-button" type="button" id="studio-new-button">${icon("file-plus-2")}新建</button>
              <button class="primary-button" type="submit">${icon("save")}保存</button>
              <button class="secondary-button" type="button" id="studio-logout-button">${icon("log-out")}退出</button>
            </div>
            <div class="status-line wide" id="studio-status"></div>
          </form>

          <div class="studio-editor-grid">
            <textarea class="studio-textarea" id="studio-body-field" spellcheck="false">${escapeHtml(studio.body)}</textarea>
            <div class="studio-preview markdown-body" id="studio-preview"></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderStudio() {
    const session = studioSession();
    if (!session.token || !session.owner || !session.repo || !session.branch) {
      app.innerHTML = renderStudioLogin();
      return;
    }
    app.innerHTML = renderStudioWorkspace();
    document.getElementById("studio-existing").value = studio.slug;
    updateStudioPreview();
  }

  function collectStudioFields() {
    studio.type = document.getElementById("studio-type")?.value || studio.type;
    studio.title = document.getElementById("studio-title-field")?.value.trim() || "";
    studio.slug = document.getElementById("studio-slug-field")?.value.trim() || "";
    studio.date = document.getElementById("studio-date-field")?.value || today();
    studio.category = document.getElementById("studio-category-field")?.value.trim() || (studio.type === "diary" ? "日记" : "随笔");
    studio.tags = document.getElementById("studio-tags-field")?.value.trim() || "";
    studio.pdf = document.getElementById("studio-pdf-field")?.value.trim() || "";
    studio.summary = document.getElementById("studio-summary-field")?.value.trim() || "";
    studio.body = document.getElementById("studio-body-field")?.value || "";
  }

  function resetStudio(type = studio.type) {
    studio.type = type;
    studio.slug = "";
    studio.title = "";
    studio.date = today();
    studio.category = type === "diary" ? "日记" : "随笔";
    studio.tags = "";
    studio.pdf = "";
    studio.summary = "";
    studio.body = "# 新文章\n\n";
  }

  function loadStudioArticle(slug) {
    const item = getArticle(studio.type, slug);
    if (!item) {
      resetStudio(studio.type);
      return;
    }
    studio.slug = item.slug;
    studio.title = item.title;
    studio.date = item.date;
    studio.category = item.category;
    studio.tags = (item.tags || []).join(", ");
    studio.pdf = item.pdf || "";
    studio.summary = item.summary || "";
    studio.body = item.body || "";
  }

  function updateStudioPreview() {
    const preview = document.getElementById("studio-preview");
    const body = document.getElementById("studio-body-field");
    if (!preview || !body) return;
    preview.innerHTML = markdownToHtml(body.value);
    enrichMarkdown(preview);
  }

  function safeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function splitTags(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function quoteFrontMatter(value) {
    return JSON.stringify(String(value || "").replace(/\r?\n/g, " ").trim());
  }

  function buildStudioMarkdown() {
    collectStudioFields();
    const tags = splitTags(studio.tags);
    const frontMatter = [
      "---",
      `title: ${quoteFrontMatter(studio.title)}`,
      `date: ${quoteFrontMatter(studio.date)}`,
      `category: ${quoteFrontMatter(studio.category)}`,
      `tags: [${tags.map(quoteFrontMatter).join(", ")}]`,
      `pdf: ${quoteFrontMatter(studio.pdf)}`,
      `summary: ${quoteFrontMatter(studio.summary)}`,
      "---",
      ""
    ].join("\n");
    return `${frontMatter}${studio.body.trimStart()}\n`;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function utf8ToBase64(value) {
    return bytesToBase64(new TextEncoder().encode(value));
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function githubRequest(path, options = {}) {
    const session = studioSession();
    const response = await fetch(`https://api.github.com/repos/${session.owner}/${session.repo}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${session.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = body.message || message;
      } catch {
        // Ignore JSON parse errors for GitHub error bodies.
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function getContentSha(repoPath) {
    const session = studioSession();
    try {
      const data = await githubRequest(`/contents/${encodeURIComponentPath(repoPath)}?ref=${encodeURIComponent(session.branch)}`);
      return data.sha || null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  function encodeURIComponentPath(repoPath) {
    return repoPath.split("/").map(encodeURIComponent).join("/");
  }

  async function putContent(repoPath, contentBase64, message) {
    const session = studioSession();
    const sha = await getContentSha(repoPath);
    const body = {
      message,
      content: contentBase64,
      branch: session.branch
    };
    if (sha) body.sha = sha;
    return githubRequest(`/contents/${encodeURIComponentPath(repoPath)}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  function setStudioStatus(message) {
    const status = document.getElementById("studio-status");
    if (status) status.textContent = message;
  }

  function articleRepoPath() {
    const folder = studio.type === "diary" ? "diary" : "posts";
    return `content/${folder}/${studio.slug}.md`;
  }

  async function saveStudioArticle() {
    collectStudioFields();
    if (!studio.title) throw new Error("请填写标题");
    studio.slug = safeSlug(studio.slug || studio.title);
    if (!studio.slug) throw new Error("请填写 Slug");
    const markdown = buildStudioMarkdown();
    const path = articleRepoPath();
    await putContent(path, utf8ToBase64(markdown), `Save ${path}`);
  }

  async function uploadImage(file) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const safeName = safeSlug(file.name.replace(/\.[^.]+$/, "")) || "image";
    const ext = (file.name.match(/\.[^.]+$/)?.[0] || ".png").toLowerCase();
    const repoPath = `resources/uploads/${year}/${month}/${Date.now()}-${safeName}${ext}`;
    const content = await fileToBase64(file);
    await putContent(repoPath, content, `Upload ${repoPath}`);
    return repoPath;
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    updateStudioPreview();
  }

  async function handleImagePaste(event) {
    const textarea = event.currentTarget;
    const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    event.preventDefault();
    setStudioStatus("正在上传图片...");
    try {
      for (const file of files) {
        const path = await uploadImage(file);
        insertAtCursor(textarea, `![${file.name}](${path})`);
      }
      setStudioStatus("图片已上传");
    } catch (error) {
      setStudioStatus(`图片上传失败：${error.message}`);
    }
  }

  function bindTopSearch() {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = searchInput.value.trim();
      location.hash = `#/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    });
  }

  function bindEvents(route) {
    app.querySelectorAll("[data-theme-id]").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeId);
        app.querySelectorAll("[data-theme-id]").forEach((item) => {
          item.classList.toggle("is-active", item.dataset.themeId === state.theme);
        });
      });
    });

    app.querySelectorAll("[data-toggle-side]").forEach((button) => {
      button.addEventListener("click", () => {
        const side = button.dataset.toggleSide;
        const shell = document.getElementById("reader-shell");
        const panel = document.getElementById(`${side}-reader-side`);
        const openClass = `${side}-open`;
        panel.classList.toggle("is-open");
        shell.classList.toggle(openClass);
        const isOpen = panel.classList.contains("is-open");
        button.setAttribute("title", isOpen ? "隐藏" : "展开");
        button.innerHTML = icon(isOpen ? (side === "left" ? "panel-left-close" : "panel-right-close") : side === "left" ? "panel-left-open" : "list-tree");
        refreshIcons();
      });
    });

    const searchPageForm = document.getElementById("search-page-form");
    if (searchPageForm) {
      searchPageForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = document.getElementById("search-page-input").value.trim();
        location.hash = `#/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      });
    }

    app.querySelectorAll("[data-scroll-heading]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById(link.dataset.scrollHeading)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    });

    const studioLoginForm = document.getElementById("studio-login-form");
    if (studioLoginForm) {
      studioLoginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        sessionStorage.setItem("studio-token", document.getElementById("studio-token").value.trim());
        sessionStorage.setItem("studio-owner", document.getElementById("studio-owner").value.trim());
        sessionStorage.setItem("studio-repo", document.getElementById("studio-repo").value.trim());
        sessionStorage.setItem("studio-branch", document.getElementById("studio-branch").value.trim() || "main");
        renderRoute();
      });
    }

    const studioType = document.getElementById("studio-type");
    if (studioType) {
      studioType.addEventListener("change", () => {
        collectStudioFields();
        resetStudio(studioType.value);
        renderRoute();
      });
    }

    const studioExisting = document.getElementById("studio-existing");
    if (studioExisting) {
      studioExisting.addEventListener("change", () => {
        collectStudioFields();
        loadStudioArticle(studioExisting.value);
        renderRoute();
      });
    }

    const titleField = document.getElementById("studio-title-field");
    const slugField = document.getElementById("studio-slug-field");
    if (titleField && slugField) {
      titleField.addEventListener("input", () => {
        if (!slugField.value.trim()) slugField.value = safeSlug(titleField.value);
      });
    }

    const bodyField = document.getElementById("studio-body-field");
    if (bodyField) {
      bodyField.addEventListener("input", updateStudioPreview);
      bodyField.addEventListener("paste", handleImagePaste);
    }

    const studioMetaForm = document.getElementById("studio-meta-form");
    if (studioMetaForm) {
      studioMetaForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStudioStatus("正在保存...");
        try {
          await saveStudioArticle();
          setStudioStatus("已提交，GitHub Actions 会自动部署");
        } catch (error) {
          setStudioStatus(`保存失败：${error.message}`);
        }
      });
    }

    const newButton = document.getElementById("studio-new-button");
    if (newButton) {
      newButton.addEventListener("click", () => {
        resetStudio(studio.type);
        renderRoute();
      });
    }

    const logoutButton = document.getElementById("studio-logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("studio-token");
        renderRoute();
      });
    }

    if (route.path.startsWith("/search")) {
      const query = route.params.get("q") || "";
      searchInput.value = query;
    }
  }

  function renderRoute() {
    if (!state.site) return;
    const route = parseRoute();
    setActiveNav(route.path);
    document.title = state.site.profile?.siteTitle || "个人博客";

    if (route.path === "/") renderHome();
    else if (route.path === "/blog") renderCollection("post", route);
    else if (route.path === "/diary") renderCollection("diary", route);
    else if (route.path.startsWith("/post/")) renderArticle("post", decodeURIComponent(route.path.slice("/post/".length)));
    else if (route.path.startsWith("/diary/")) renderArticle("diary", decodeURIComponent(route.path.slice("/diary/".length)));
    else if (route.path === "/resources") renderResources();
    else if (route.path === "/plans") renderPlans();
    else if (route.path === "/search") renderSearch(route);
    else if (route.path === "/studio") renderStudio();
    else renderNotFound();

    bindEvents(route);
    refreshIcons();
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function init() {
    applyTheme(state.theme);
    bindTopSearch();
    try {
      await loadSite();
      renderRoute();
      window.addEventListener("hashchange", renderRoute);
    } catch (error) {
      app.innerHTML = `
        <section class="empty-state">
          <h1>站点数据载入失败</h1>
          <p>${escapeHtml(error.message)}</p>
          <p>请先运行 <code>node scripts/build-site-data.js</code>。</p>
        </section>
      `;
    }
    refreshIcons();
  }

  init();
})();
