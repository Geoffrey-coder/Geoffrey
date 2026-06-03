(() => {
  const DATA_URL = "data/site.json";
  const app = document.getElementById("app");
  const searchForm = document.getElementById("top-search");
  const searchInput = document.getElementById("search-input");
  const siteTitle = document.getElementById("site-title");

  const themes = [
    { id: "atelier", name: "古典书房", swatch: "swatch-atelier" },
    { id: "petit", name: "软萌粉蓝", swatch: "swatch-petit" },
    { id: "paper", name: "浅色阅读", swatch: "swatch-paper" },
    { id: "blush", name: "粉色时尚", swatch: "swatch-blush" },
    { id: "moss", name: "自然绿色", swatch: "swatch-moss" },
    { id: "retro", name: "复古纸页", swatch: "swatch-retro" },
    { id: "midnight", name: "深色夜读", swatch: "swatch-midnight" }
  ];

  const savedThemeVersion = localStorage.getItem("blog-theme-version");
  const savedTheme = localStorage.getItem("blog-theme");

  const state = {
    site: null,
    theme: savedThemeVersion === "vintage-library-v1" && savedTheme ? savedTheme : "atelier"
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
    const nextTheme = themes.some((theme) => theme.id === themeId) ? themeId : "atelier";
    state.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("blog-theme", nextTheme);
    localStorage.setItem("blog-theme-version", "vintage-library-v1");
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
    const root = path.startsWith("/courses") || path.startsWith("/blog") || path.startsWith("/post/")
      ? "/courses"
      : path.startsWith("/workflow") || path.startsWith("/resources")
        ? "/workflow"
        : path.startsWith("/friends")
          ? "/friends"
          : path.startsWith("/ideas")
            ? "/ideas"
            : path.startsWith("/plans")
              ? "/plans"
              : path.startsWith("/about") || path.startsWith("/diary")
                ? "/about"
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

  function renderLibraryMetric(iconName, label, value) {
    return `
      <div class="library-metric">
        ${icon(iconName)}
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function assetUrl(value) {
    try {
      return new URL(value, location.href).href;
    } catch {
      return value;
    }
  }

  function renderCourseCard(course) {
    const progress = Math.max(0, Math.min(100, Number(course.progress || 0)));
    return `
      <a class="course-card" href="${escapeHtml(course.url || "#/courses")}">
        <div class="course-icon">${icon(course.icon || "book-open")}</div>
        <h3>${escapeHtml(course.title)}</h3>
        <p>${escapeHtml(course.subtitle || "")}</p>
        <div class="mini-progress" aria-label="整理进度 ${progress}%">
          <span style="width:${progress}%"></span>
        </div>
        <small>进入笔记馆</small>
      </a>
    `;
  }

  function renderWorkflowStage(stage, index) {
    return `
      <div class="workflow-stage">
        <div class="workflow-node">${icon(stage.icon || "circle")}</div>
        <strong>${escapeHtml(stage.title)}</strong>
        <span>${escapeHtml(stage.description || "")}</span>
        ${index < (state.site.workflows?.stages || []).length - 1 ? '<i class="workflow-line" aria-hidden="true"></i>' : ""}
      </div>
    `;
  }

  function renderFriendTiles(limit = 3) {
    const friends = (state.site.friends || []).slice(0, limit);
    if (!friends.length) return '<div class="empty-state">暂无友链</div>';
    return friends
      .map(
        (friend) => `
          <a class="library-friend" href="${escapeHtml(friend.url)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHtml(friend.avatar || "")}" alt="${escapeHtml(friend.title)}" />
            <span>
              <strong>${escapeHtml(friend.title)}</strong>
              <small>${escapeHtml(friend.subtitle || "")}</small>
            </span>
          </a>
        `
      )
      .join("");
  }

  function renderHome() {
    const profile = state.site.profile || {};
    const courses = state.site.courses || [];
    const workflows = state.site.workflows || { stages: [], projects: [] };
    const plans = state.site.plans || [];
    const heroImage = profile.aesthetic?.hero || profile.aesthetic?.poster || "resources/uploads/vintage-library-hero.png";
    const heroBackground = assetUrl(heroImage);
    const totalNotes = (state.site.posts || []).length + (state.site.diary || []).length + courses.length;
    const compassLinks = [
      { href: "#/courses", icon: "book-open", label: "课程", note: "Notes" },
      { href: "#/workflow", icon: "microscope", label: "科研", note: "Workflow" },
      { href: "#/ideas", icon: "lock-keyhole", label: "灵感", note: "Private" },
      { href: "#/plans", icon: "calendar-check", label: "计划", note: "Plans" },
      { href: "#/friends", icon: "link", label: "友链", note: "Friends" }
    ];

    app.innerHTML = `
      <div class="library-page">
        <aside class="library-left">
          <section class="portrait-panel">
            <img class="portrait-avatar" src="${escapeHtml(profile.avatar || "")}" alt="${escapeHtml(profile.nickname || "Geoffrey")}" />
            <div>
              <p class="script-kicker">Ad meliora, semper.</p>
              <h1>${escapeHtml(profile.nickname || "Geoffrey")}</h1>
              <p>${escapeHtml(profile.bio || "")}</p>
            </div>
          </section>

          <section class="music-panel">
            <div class="vinyl-mark">${icon("music-2")}</div>
            <div class="music-copy">
              <span>正在聆听</span>
              <strong>Piano Sonata No.14</strong>
              <small>Beethoven · Moonlight</small>
            </div>
            <p class="music-note">慢板、月光与书页翻动声。</p>
            <div class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </section>

          <section class="quote-panel">
            <p>音乐是流动的建筑，建筑是凝固的音乐。</p>
            <span>约翰 · 沃尔夫冈 · 冯 · 歌德</span>
          </section>
        </aside>

        <section class="library-main">
          <section class="library-hero" style="--hero-image:url('${escapeHtml(heroBackground)}')">
            <div class="hero-copy">
              <span class="script-kicker">Bibliotheca Geoffrey</span>
              <h2>Geoffrey 的研究书房</h2>
              <p>阅读、研究、音乐与长期思考。把课程笔记、论文流程、计划和灵感收进一座有秩序的私人图书馆。</p>
              <div class="library-metrics">
                ${renderLibraryMetric("scroll-text", "笔记条目", String(totalNotes))}
                ${renderLibraryMetric("file-stack", "研究项目", String((workflows.projects || []).length))}
                ${renderLibraryMetric("book-open", "课程档案", String(courses.length))}
                ${renderLibraryMetric("lightbulb", "灵感保险柜", "本地加密")}
              </div>
            </div>
          </section>

          <section class="library-section courses-section">
            <div class="ornate-heading">
              <div>
                <h2>${icon("book-marked")}课程笔记</h2>
                <p>每门课独立归档，适合沉淀定理、证明、公式和例题。</p>
              </div>
              <a href="#/courses">查看全部</a>
            </div>
            <div class="course-grid">${courses.slice(0, 6).map(renderCourseCard).join("")}</div>
          </section>

          <section class="library-section workflow-section">
            <div class="ornate-heading">
              <div>
                <h2>${icon("workflow")}论文与科研项目工作流</h2>
                <p>从文献到归档，把科研过程做成可复用的系统。</p>
              </div>
              <a href="#/workflow">进入工作流</a>
            </div>
            <div class="workflow-ribbon">${(workflows.stages || []).map(renderWorkflowStage).join("")}</div>
            <div class="project-ledger">
              ${(workflows.projects || [])
                .slice(0, 2)
                .map(
                  (project) => `
                    <a href="${escapeHtml(project.url || "#/workflow")}">
                      <span>${escapeHtml(project.date || "")}</span>
                      <strong>${escapeHtml(project.title)}</strong>
                      <em>${escapeHtml(project.type || "")}</em>
                      <small>${escapeHtml(project.status || "")}</small>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        </section>

        <aside class="library-right">
          <section class="compass-panel" aria-label="研究书房导航">
            <div class="compass-rose" aria-hidden="true"></div>
            <div class="compass-medallion">
              <span>G</span>
              <small>Study Atlas</small>
            </div>
            ${compassLinks
              .map(
                (item, index) => `
                  <a class="compass-item compass-item-${index + 1}" href="${item.href}">
                    ${icon(item.icon)}
                    <strong>${item.label}</strong>
                    <small>${item.note}</small>
                  </a>
                `
              )
              .join("")}
          </section>

          <section class="library-section compact friends-section">
            <div class="ornate-heading">
              <div>
                <h2>${icon("link")}友链</h2>
                <p>学术路上的同伴。</p>
              </div>
              <a href="#/friends">全部</a>
            </div>
            <div class="library-friends">${renderFriendTiles(3)}</div>
          </section>

          <section class="library-section compact plan-section">
            <div class="ornate-heading">
              <div>
                <h2>${icon("calendar-check")}计划</h2>
                <p>让长期主义有节拍。</p>
              </div>
              <a href="#/plans">查看</a>
            </div>
            <div class="plan-scroll">
              ${plans
                .slice(0, 3)
                .map(
                  (plan) => `
                    <article>
                      <strong>${escapeHtml(plan.title)}</strong>
                      <span>${escapeHtml(plan.status || "")} · ${Number(plan.progress || 0)}%</span>
                    </article>
                  `
                )
                .join("")}
            </div>
          </section>
        </aside>
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

  function renderCourses() {
    const courses = state.site.courses || [];
    app.innerHTML = `
      ${pageHeading("课程笔记", "每门课都有自己的档案柜：定理、证明、例题、代码和复盘都可以慢慢归档。")}
      <section class="library-section full-width">
        <div class="course-grid large">
          ${courses.length ? courses.map(renderCourseCard).join("") : '<div class="empty-state">暂无课程笔记目录</div>'}
        </div>
      </section>
      <section class="library-section full-width">
        <div class="ornate-heading">
          <div>
            <h2>${icon("scroll-text")}最近笔记</h2>
            <p>从文章系统中自动读取最近整理的内容。</p>
          </div>
          <a href="#/blog">全部文章</a>
        </div>
        <div class="article-grid">
          ${(state.site.recentPosts || []).slice(0, 4).map(renderArticleCard).join("") || '<div class="empty-state">暂无文章</div>'}
        </div>
      </section>
    `;
  }

  function renderWorkflow() {
    const workflows = state.site.workflows || { stages: [], projects: [] };
    app.innerHTML = `
      ${pageHeading("论文与科研项目工作流", "把科研从灵感、文献、数据、模型、实证、写作到归档做成可重复的路径。")}
      <section class="library-section full-width">
        <div class="workflow-ribbon large">${(workflows.stages || []).map(renderWorkflowStage).join("")}</div>
      </section>
      <section class="library-section full-width">
        <div class="ornate-heading">
          <div>
            <h2>${icon("clipboard-list")}项目台账</h2>
            <p>近期论文、科研项目和版本状态。</p>
          </div>
          <a href="#/resources">资源库</a>
        </div>
        <div class="project-ledger expanded">
          ${(workflows.projects || [])
            .map(
              (project) => `
                <a href="${escapeHtml(project.url || "#/workflow")}">
                  <span>${escapeHtml(project.date || "")}</span>
                  <strong>${escapeHtml(project.title)}</strong>
                  <em>${escapeHtml(project.type || "")}</em>
                  <small>${escapeHtml(project.status || "")}</small>
                </a>
              `
            )
            .join("") || '<div class="empty-state">暂无科研项目</div>'}
        </div>
      </section>
    `;
  }

  function renderFriendsPage() {
    const friends = state.site.friends || [];
    app.innerHTML = `
      ${pageHeading("友链", "学术路上的同伴、工具和长期参考入口。")}
      <section class="library-section full-width">
        <div class="library-friends grid">
          ${friends.length ? renderFriendTiles(friends.length) : '<div class="empty-state">暂无友链</div>'}
        </div>
      </section>
    `;
  }

  function renderAbout() {
    const profile = state.site.profile || {};
    app.innerHTML = `
      ${pageHeading("关于", "这座书房用于长期保存阅读、研究、音乐与思考。")}
      <section class="about-scroll">
        <div class="about-seal">${escapeHtml((profile.nickname || "G").slice(0, 1))}</div>
        <h2>${escapeHtml(profile.siteTitle || "Geoffrey 的研究书房")}</h2>
        <p>${escapeHtml(profile.bio || "")}</p>
        <p>站点采用静态 GitHub Pages 部署，内容以 Markdown 和 JSON 维护。公开内容进入仓库，私密灵感只保存在浏览器本地加密库中。</p>
        <div class="button-row">
          <a class="secondary-button" href="#/courses">${icon("book-open")}课程笔记</a>
          <a class="secondary-button" href="#/workflow">${icon("workflow")}科研工作流</a>
          <a class="secondary-button" href="#/ideas">${icon("lock-keyhole")}私密灵感</a>
        </div>
      </section>
    `;
  }

  const vaultState = {
    unlocked: false,
    password: "",
    ideas: []
  };

  function vaultBytesToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }

  function vaultBase64ToBytes(value) {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }

  async function vaultKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function vaultSave() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await vaultKey(vaultState.password, salt);
    const payload = new TextEncoder().encode(JSON.stringify(vaultState.ideas));
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload));
    localStorage.setItem(
      "geoffrey-idea-vault",
      JSON.stringify({
        salt: vaultBytesToBase64(salt),
        iv: vaultBytesToBase64(iv),
        cipher: vaultBytesToBase64(cipher)
      })
    );
  }

  async function vaultLoad(password) {
    const raw = localStorage.getItem("geoffrey-idea-vault");
    if (!raw) {
      vaultState.password = password;
      vaultState.ideas = [];
      vaultState.unlocked = true;
      await vaultSave();
      return;
    }
    const record = JSON.parse(raw);
    const salt = vaultBase64ToBytes(record.salt);
    const iv = vaultBase64ToBytes(record.iv);
    const cipher = vaultBase64ToBytes(record.cipher);
    const key = await vaultKey(password, salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    vaultState.password = password;
    vaultState.ideas = JSON.parse(new TextDecoder().decode(plain));
    vaultState.unlocked = true;
  }

  function renderIdeasVault() {
    const exists = !!localStorage.getItem("geoffrey-idea-vault");
    if (!vaultState.unlocked) {
      app.innerHTML = `
        ${pageHeading("私密灵感 / Idea Vault", "科研想法不会进入 GitHub 仓库；这里只用浏览器本地加密保存。")}
        <section class="vault-page">
          <div class="lock-emblem large">${icon("lock-keyhole")}</div>
          <h2>${exists ? "解锁灵感保险柜" : "创建灵感保险柜"}</h2>
          <p>请输入密码。密码不会上传，也不会保存；如果忘记密码，已加密内容无法恢复。</p>
          <form id="vault-unlock-form" class="vault-form">
            <input class="studio-input" id="vault-password" type="password" placeholder="输入本地保险柜密码" required />
            <button class="primary-button" type="submit">${icon("key-round")}${exists ? "解锁" : "创建并进入"}</button>
          </form>
          <div class="status-line" id="vault-status"></div>
        </section>
      `;
      return;
    }

    app.innerHTML = `
      ${pageHeading("私密灵感 / Idea Vault", "本地加密草稿箱。适合存放未公开 idea、研究假说和突然出现的直觉。")}
      <section class="vault-workbench">
        <form id="vault-idea-form" class="vault-editor">
          <input class="studio-input" id="vault-title" placeholder="灵感标题" required />
          <textarea class="studio-textarea" id="vault-body" placeholder="写下研究想法、变量、识别策略、数据来源或下一步..." required></textarea>
          <div class="button-row">
            <button class="primary-button" type="submit">${icon("save")}加密保存</button>
            <button class="secondary-button" type="button" id="vault-lock-button">${icon("lock")}锁定</button>
          </div>
        </form>
        <div class="idea-list">
          ${
            vaultState.ideas.length
              ? vaultState.ideas
                  .map(
                    (idea, index) => `
                      <article class="idea-card">
                        <span>${escapeHtml(formatDate(idea.date))}</span>
                        <h3>${escapeHtml(idea.title)}</h3>
                        <p>${escapeHtml(idea.body)}</p>
                        <button class="icon-button" type="button" data-delete-idea="${index}" title="删除">${icon("trash-2")}</button>
                      </article>
                    `
                  )
                  .join("")
              : '<div class="empty-state">保险柜里还没有灵感</div>'
          }
        </div>
      </section>
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

    const vaultUnlockForm = document.getElementById("vault-unlock-form");
    if (vaultUnlockForm) {
      vaultUnlockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = document.getElementById("vault-password").value;
        const status = document.getElementById("vault-status");
        if (status) status.textContent = "正在解锁...";
        try {
          await vaultLoad(password);
          renderRoute();
        } catch {
          if (status) status.textContent = "密码不正确，或本地保险柜数据已损坏。";
        }
      });
    }

    const vaultIdeaForm = document.getElementById("vault-idea-form");
    if (vaultIdeaForm) {
      vaultIdeaForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = document.getElementById("vault-title").value.trim();
        const body = document.getElementById("vault-body").value.trim();
        if (!title || !body) return;
        vaultState.ideas.unshift({ title, body, date: today() });
        await vaultSave();
        renderRoute();
      });
    }

    app.querySelectorAll("[data-delete-idea]").forEach((button) => {
      button.addEventListener("click", async () => {
        const index = Number(button.dataset.deleteIdea);
        vaultState.ideas.splice(index, 1);
        await vaultSave();
        renderRoute();
      });
    });

    const vaultLockButton = document.getElementById("vault-lock-button");
    if (vaultLockButton) {
      vaultLockButton.addEventListener("click", () => {
        vaultState.unlocked = false;
        vaultState.password = "";
        vaultState.ideas = [];
        renderRoute();
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
    else if (route.path === "/courses") renderCourses();
    else if (route.path === "/workflow") renderWorkflow();
    else if (route.path === "/friends") renderFriendsPage();
    else if (route.path === "/ideas") renderIdeasVault();
    else if (route.path === "/about") renderAbout();
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
