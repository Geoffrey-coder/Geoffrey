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

  const VAULT_STORAGE_KEY = "geoffrey-research-archive";
  const LEGACY_VAULT_STORAGE_KEY = "geoffrey-idea-vault";
  const VAULT_REMOTE_PATH = "data/archive/research-workbench.json";
  const archiveSections = [
    { id: "literature", label: "文献收集", icon: "book-open" },
    { id: "code", label: "代码工作流", icon: "square-terminal" },
    { id: "notes", label: "灵感手记", icon: "sparkles" },
    { id: "latex", label: "LaTeX 论文工程", icon: "file-text" },
    { id: "final", label: "投稿终版", icon: "send" }
  ];

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
      : path.startsWith("/workflow") || path.startsWith("/research") || path.startsWith("/resources")
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

  function renderResearchDirectionCard(direction) {
    const archives = direction.archives || [];
    return `
      <a class="research-direction-card" href="#/research/${encodeURIComponent(direction.id)}">
        <div class="course-icon">${icon(direction.icon || "folder-kanban")}</div>
        <span>${escapeHtml(direction.subtitle || "")}</span>
        <h3>${escapeHtml(direction.title)}</h3>
        <p>${escapeHtml(direction.description || "")}</p>
        <small>${archives.length} 个研究线索</small>
      </a>
    `;
  }

  function renderPublicWorkCard(work) {
    return `
      <article class="public-work-card">
        <div class="plan-meta">
          <span>${escapeHtml(work.type || "Research")}</span>
          <span>${escapeHtml(work.year || "")}</span>
        </div>
        <h3>${escapeHtml(work.title)}</h3>
        <p>${escapeHtml(work.summary || "")}</p>
        <div class="card-tags">
          <span class="tag">${escapeHtml(work.direction || "研究")}</span>
          <span class="tag">${escapeHtml(work.status || "整理中")}</span>
        </div>
        <div class="button-row">
          ${(work.links || [])
            .map((link) => `<a class="secondary-button compact-button" href="${escapeHtml(link.url)}">${icon("external-link")}${escapeHtml(link.label)}</a>`)
            .join("")}
        </div>
      </article>
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

  function renderRoomHotspot(item) {
    return `
      <a
        class="room-hotspot room-hotspot-${escapeHtml(item.key)} ${item.kind ? `is-${escapeHtml(item.kind)}` : ""}"
        href="${escapeHtml(item.href)}"
        style="${escapeHtml(item.style)}"
        data-room-target="${escapeHtml(item.key)}"
        data-room-kind="${escapeHtml(item.kind || "panel")}"
      >
        <span class="room-object-glow" aria-hidden="true"></span>
        <span class="room-drawer-face" aria-hidden="true"></span>
        <span class="room-plaque">
          ${icon(item.icon)}
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.subtitle || "")}</small>
        </span>
      </a>
    `;
  }

  function renderHome() {
    const profile = state.site.profile || {};
    const courses = state.site.courses || [];
    const workflows = state.site.workflows || { stages: [], projects: [] };
    const plans = state.site.plans || [];
    const roomImage = assetUrl(profile.aesthetic?.room || "resources/uploads/classical-room-scene.png");
    const totalNotes = (state.site.posts || []).length + (state.site.diary || []).length + courses.length;
    const roomHotspots = [
      {
        key: "about",
        href: "#/about",
        icon: "user-round",
        title: "关于 / 归档",
        subtitle: "人物肖像",
        kind: "portrait",
        style: "--x:22%;--y:29%;--w:14%;--h:20%;--z:1;"
      },
      {
        key: "workflow",
        href: "#/workflow",
        icon: "microscope",
        title: "研究与论文",
        subtitle: "中央书柜",
        kind: "cabinet",
        style: "--x:45%;--y:28%;--w:25%;--h:26%;--z:3;"
      },
      {
        key: "resources",
        href: "#/resources",
        icon: "archive",
        title: "资源抽屉",
        subtitle: "PDF / 数据 / 文件",
        kind: "drawer",
        style: "--x:49%;--y:54%;--w:29%;--h:17%;--z:4;"
      },
      {
        key: "courses",
        href: "#/courses",
        icon: "book-open",
        title: "课程笔记",
        subtitle: `${courses.length} 门课程`,
        kind: "desk",
        style: "--x:24%;--y:69%;--w:28%;--h:20%;--z:6;"
      },
      {
        key: "friends",
        href: "#/friends",
        icon: "music-2",
        title: "钢琴与友链",
        subtitle: "同伴 / 音乐",
        kind: "piano",
        style: "--x:82%;--y:48%;--w:25%;--h:28%;--z:5;"
      },
      {
        key: "plans",
        href: "#/plans",
        icon: "calendar-check",
        title: "计划",
        subtitle: `${plans.length} 项安排`,
        kind: "table",
        style: "--x:67%;--y:78%;--w:21%;--h:18%;--z:7;"
      },
      {
        key: "ideas",
        href: "#/ideas",
        icon: "folder-open",
        title: "研究档案",
        subtitle: "个人口令",
        kind: "drawer",
        style: "--x:88%;--y:78%;--w:14%;--h:20%;--z:8;"
      }
    ];

    app.innerHTML = `
      <section class="room-experience" style="--room-image:url('${escapeHtml(roomImage)}')">
        <div class="room-scene" id="room-scene">
          <div class="room-bg" aria-hidden="true"></div>
          <div class="room-vignette" aria-hidden="true"></div>
          <div class="room-light room-light-window" aria-hidden="true"></div>
          <div class="room-light room-light-lamp" aria-hidden="true"></div>
          <div class="room-dust" aria-hidden="true"></div>

          <header class="room-title-plaque">
            <span class="script-kicker">Bibliotheca Geoffrey</span>
            <h1>${escapeHtml(profile.siteTitle || "Geoffrey 的研究书房")}</h1>
            <p>阅读 · 研究 · 音乐 · 长期思考</p>
          </header>

          <div class="room-brand-card">
            <img src="${escapeHtml(profile.avatar || "")}" alt="${escapeHtml(profile.nickname || "Geoffrey")}" />
            <div>
              <strong>${escapeHtml(profile.nickname || "Geoffrey")}</strong>
              <span>Ad meliora, semper.</span>
            </div>
          </div>

          <div class="room-hotspot-layer">
            ${roomHotspots.map(renderRoomHotspot).join("")}
          </div>

          <div class="room-status-card">
            <div>${renderLibraryMetric("scroll-text", "笔记", String(totalNotes))}</div>
            <div>${renderLibraryMetric("file-stack", "项目", String((workflows.projects || []).length))}</div>
            <div>${renderLibraryMetric("book-open", "课程", String(courses.length))}</div>
          </div>

          <aside class="room-music-card">
            <div class="vinyl-mark">${icon("music-2")}</div>
            <div>
              <span>正在聆听</span>
              <strong>Piano Sonata No.14</strong>
              <small>Beethoven · Moonlight</small>
            </div>
            <div class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </aside>

          <blockquote class="room-quote">
            <p>我从未止步于抵达答案的旅程。</p>
            <cite>Per aspera ad astra.</cite>
          </blockquote>
        </div>
      </section>
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
    const research = state.site.research || { directions: [], publicWorks: [] };
    app.innerHTML = `
      ${pageHeading("研究工作与论文", "公开成果、研究方向与可复用流程。适合访客浏览，也方便你长期整理。")}
      <section class="research-showcase">
        <div class="research-hero-card">
          <span class="script-kicker">Research Gallery</span>
          <h2>从方向到论文，把研究陈列成清晰的路径。</h2>
          <p>这里放已经可以公开的研究工作、论文状态、方向概览和相关入口；未完成草稿仍留在个人工作台里。</p>
          <div class="button-row">
            <a class="primary-button" href="#/ideas">${icon("folder-open")}进入研究档案</a>
            <a class="secondary-button" href="#/resources">${icon("archive")}资源库</a>
          </div>
        </div>
        <div class="workflow-ribbon large">${(workflows.stages || []).map(renderWorkflowStage).join("")}</div>
      </section>

      <section class="library-section full-width">
        <div class="ornate-heading">
          <div>
            <h2>${icon("folder-kanban")}研究方向</h2>
            <p>按长期方向组织公开线索，点击后查看该方向下的项目链路。</p>
          </div>
          <a href="#/ideas">个人工作台</a>
        </div>
        <div class="research-direction-grid">
          ${(research.directions || []).map(renderResearchDirectionCard).join("") || '<div class="empty-state">暂无研究方向</div>'}
        </div>
      </section>

      <section class="library-section full-width">
        <div class="ornate-heading">
          <div>
            <h2>${icon("scroll-text")}公开研究与论文</h2>
            <p>已经完成、正在整理或准备公开展示的成果。</p>
          </div>
          <a href="#/resources">资源库</a>
        </div>
        <div class="public-work-grid">
          ${(research.publicWorks || []).map(renderPublicWorkCard).join("") || '<div class="empty-state">暂无公开研究记录</div>'}
        </div>
      </section>
    `;
  }

  function renderResearchDirection(slug) {
    const research = state.site.research || { directions: [] };
    const direction = (research.directions || []).find((item) => item.id === slug);
    if (!direction) {
      renderNotFound();
      return;
    }
    app.innerHTML = `
      ${pageHeading(direction.title, direction.subtitle || "研究方向")}
      <section class="library-section full-width research-direction-detail">
        <div class="research-direction-intro">
          <div class="course-icon">${icon(direction.icon || "folder-kanban")}</div>
          <div>
            <h2>${escapeHtml(direction.title)}</h2>
            <p>${escapeHtml(direction.description || "")}</p>
          </div>
          <a class="secondary-button" href="#/workflow">${icon("arrow-left")}返回总览</a>
        </div>
        <div class="archive-project-grid public-archive-grid">
          ${(direction.archives || [])
            .map(
              (archive) => `
                <article class="archive-project-card">
                  <span>${escapeHtml(archive.status || "")}</span>
                  <h3>${escapeHtml(archive.title)}</h3>
                  <p>${escapeHtml(archive.summary || "")}</p>
                  <div class="archive-section-grid">
                    ${(archive.workflow || [])
                      .map((step) => `<div class="archive-section-pill">${icon("chevron-right")}${escapeHtml(step)}</div>`)
                      .join("")}
                  </div>
                </article>
              `
            )
            .join("") || '<div class="empty-state">暂无公开项目链路</div>'}
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
        <p>站点采用静态 GitHub Pages 部署，内容以 Markdown 和 JSON 维护。公开内容进入仓库，个人工作台只在口令进入后使用。</p>
        <div class="button-row">
          <a class="secondary-button" href="#/courses">${icon("book-open")}课程笔记</a>
          <a class="secondary-button" href="#/workflow">${icon("workflow")}研究与论文</a>
          <a class="secondary-button" href="#/ideas">${icon("folder-open")}研究档案</a>
        </div>
      </section>
    `;
  }

  const vaultState = {
    unlocked: false,
    password: "",
    archive: null,
    activeDirectionId: "derivatives",
    activeProjectId: "commercial-hedging"
  };

  function defaultArchive() {
    return {
      version: 2,
      updatedAt: today(),
      directions: [
        {
          id: "derivatives",
          title: "衍生品方向",
          subtitle: "期货、期权、风险管理与套期保值",
          projects: [
            {
              id: "commercial-hedging",
              title: "商业套保",
              status: "准备中",
              summary: "企业风险管理、套保有效性、会计处理、数据与识别策略的长期研究线索。",
              entries: []
            }
          ]
        }
      ]
    };
  }

  function normalizeArchive(value) {
    const base = defaultArchive();
    const archive = value && typeof value === "object" ? value : base;
    const directions = Array.isArray(archive.directions) && archive.directions.length ? archive.directions : base.directions;
    return {
      version: 2,
      updatedAt: archive.updatedAt || today(),
      directions: directions.map((direction) => ({
        id: safeSlug(direction.id || direction.title) || `direction-${Date.now()}`,
        title: direction.title || "未命名方向",
        subtitle: direction.subtitle || "",
        projects: Array.isArray(direction.projects)
          ? direction.projects.map((project) => ({
              id: safeSlug(project.id || project.title) || `project-${Date.now()}`,
              title: project.title || "未命名项目",
              status: project.status || "整理中",
              summary: project.summary || "",
              entries: Array.isArray(project.entries)
                ? project.entries.map((entry) => ({
                    id: entry.id || `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    section: archiveSections.some((section) => section.id === entry.section) ? entry.section : "notes",
                    title: entry.title || "未命名条目",
                    body: entry.body || "",
                    date: entry.date || today()
                  }))
                : []
            }))
          : []
      }))
    };
  }

  function archiveFromLegacyIdeas(ideas) {
    const archive = defaultArchive();
    archive.directions[0].projects[0].entries = (ideas || []).map((idea, index) => ({
      id: `legacy-${index}-${Date.now()}`,
      section: "notes",
      title: idea.title || "旧手记",
      body: idea.body || "",
      date: idea.date || today()
    }));
    return archive;
  }

  function ensureArchiveSelection() {
    vaultState.archive = normalizeArchive(vaultState.archive);
    const directions = vaultState.archive.directions;
    if (!directions.some((direction) => direction.id === vaultState.activeDirectionId)) {
      vaultState.activeDirectionId = directions[0]?.id || "";
    }
    const direction = activeArchiveDirection();
    if (direction && !direction.projects.some((project) => project.id === vaultState.activeProjectId)) {
      vaultState.activeProjectId = direction.projects[0]?.id || "";
    }
  }

  function activeArchiveDirection() {
    return (vaultState.archive?.directions || []).find((direction) => direction.id === vaultState.activeDirectionId);
  }

  function activeArchiveProject() {
    const direction = activeArchiveDirection();
    return (direction?.projects || []).find((project) => project.id === vaultState.activeProjectId);
  }

  function vaultBytesToBase64(bytes) {
    return bytesToBase64(bytes);
  }

  function vaultBase64ToBytes(value) {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }

  function base64ToUtf8(value) {
    const binary = atob(String(value || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
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
      { name: "PBKDF2", salt, iterations: 160000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function vaultSave() {
    vaultState.archive = normalizeArchive(vaultState.archive);
    vaultState.archive.updatedAt = new Date().toISOString();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await vaultKey(vaultState.password, salt);
    const payload = new TextEncoder().encode(JSON.stringify({ version: 2, archive: vaultState.archive }));
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload));
    localStorage.setItem(
      VAULT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        salt: vaultBytesToBase64(salt),
        iv: vaultBytesToBase64(iv),
        cipher: vaultBytesToBase64(cipher)
      })
    );
    localStorage.removeItem(LEGACY_VAULT_STORAGE_KEY);
  }

  async function vaultLoad(password) {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem(LEGACY_VAULT_STORAGE_KEY);
    if (!raw) {
      vaultState.password = password;
      vaultState.archive = defaultArchive();
      vaultState.unlocked = true;
      ensureArchiveSelection();
      await vaultSave();
      return;
    }
    const record = JSON.parse(raw);
    const salt = vaultBase64ToBytes(record.salt);
    const iv = vaultBase64ToBytes(record.iv);
    const cipher = vaultBase64ToBytes(record.cipher);
    const key = await vaultKey(password, salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    const parsed = JSON.parse(new TextDecoder().decode(plain));
    vaultState.password = password;
    vaultState.archive = Array.isArray(parsed) ? archiveFromLegacyIdeas(parsed) : normalizeArchive(parsed.archive || parsed);
    vaultState.unlocked = true;
    ensureArchiveSelection();
    await vaultSave();
  }

  async function uploadArchiveToGithub() {
    await vaultSave();
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) throw new Error("本地档案为空");
    await putContent(VAULT_REMOTE_PATH, utf8ToBase64(raw), `Save ${VAULT_REMOTE_PATH}`);
  }

  async function downloadArchiveFromGithub() {
    const session = studioSession();
    const data = await githubRequest(`/contents/${encodeURIComponentPath(VAULT_REMOTE_PATH)}?ref=${encodeURIComponent(session.branch)}`);
    localStorage.setItem(VAULT_STORAGE_KEY, base64ToUtf8(data.content));
    localStorage.removeItem(LEGACY_VAULT_STORAGE_KEY);
    if (vaultState.unlocked && vaultState.password) await vaultLoad(vaultState.password);
  }

  function renderArchiveDirectionButton(direction) {
    const active = direction.id === vaultState.activeDirectionId;
    return `
      <button class="archive-nav-button ${active ? "is-active" : ""}" type="button" data-archive-direction="${escapeHtml(direction.id)}">
        <strong>${escapeHtml(direction.title)}</strong>
        <span>${escapeHtml(direction.subtitle || `${(direction.projects || []).length} 个项目`)}</span>
      </button>
    `;
  }

  function renderArchiveProjectCard(project) {
    const active = project.id === vaultState.activeProjectId;
    const count = (project.entries || []).length;
    return `
      <button class="archive-project-card ${active ? "is-active" : ""}" type="button" data-archive-project="${escapeHtml(project.id)}">
        <span>${escapeHtml(project.status || "整理中")}</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary || "")}</p>
        <small>${count} 条记录</small>
      </button>
    `;
  }

  function renderArchiveEntry(entry) {
    return `
      <article class="archive-entry-card">
        <span>${escapeHtml(formatDate(entry.date))}</span>
        <h4>${escapeHtml(entry.title)}</h4>
        <p>${escapeHtml(entry.body)}</p>
        <button class="icon-button" type="button" data-delete-entry="${escapeHtml(entry.id)}" title="删除">${icon("trash-2")}</button>
      </article>
    `;
  }

  function renderArchiveSection(section, project) {
    const entries = (project?.entries || []).filter((entry) => entry.section === section.id);
    return `
      <article class="archive-section-card">
        <div class="archive-section-head">
          ${icon(section.icon)}
          <strong>${escapeHtml(section.label)}</strong>
          <span>${entries.length}</span>
        </div>
        <div class="archive-entry-list">
          ${entries.length ? entries.map(renderArchiveEntry).join("") : '<p class="muted-line">暂无记录</p>'}
        </div>
      </article>
    `;
  }

  function renderIdeasVault() {
    const exists = !!localStorage.getItem(VAULT_STORAGE_KEY) || !!localStorage.getItem(LEGACY_VAULT_STORAGE_KEY);
    if (!vaultState.unlocked) {
      app.innerHTML = `
        ${pageHeading("研究档案", "个人工作台。输入口令后继续整理方向、项目和手记。")}
        <section class="vault-page archive-gate">
          <div class="lock-emblem large">${icon("folder-open")}</div>
          <h2>${exists ? "进入档案桌" : "建立档案桌"}</h2>
          <p>口令只在本次浏览器会话中使用。若需要从头开始，可以重设本地档案。</p>
          <form id="vault-unlock-form" class="vault-form">
            <input class="studio-input" id="vault-password" type="password" placeholder="个人口令" autocomplete="current-password" required />
            <button class="primary-button" type="submit">${icon("key-round")}${exists ? "进入" : "建立并进入"}</button>
          </form>
          <div class="button-row archive-gate-actions">
            <button class="secondary-button" type="button" id="archive-sync-download">${icon("cloud-download")}从 GitHub 取回</button>
            ${exists ? `<button class="secondary-button" type="button" id="vault-reset-button">${icon("rotate-ccw")}重设本地档案</button>` : ""}
          </div>
          <div class="status-line" id="vault-status"></div>
        </section>
      `;
      return;
    }

    ensureArchiveSelection();
    const direction = activeArchiveDirection();
    const project = activeArchiveProject();
    app.innerHTML = `
      ${pageHeading("研究档案", "方向、项目、文献、代码、手记和终版材料的整理台。")}
      <section class="archive-layout">
        <aside class="archive-sidebar">
          <div class="ornate-heading compact-heading">
            <div>
              <h2>${icon("compass")}研究方向</h2>
              <p>按长期问题组织。</p>
            </div>
          </div>
          <div class="archive-nav-list">
            ${(vaultState.archive.directions || []).map(renderArchiveDirectionButton).join("")}
          </div>
          <form id="archive-direction-form" class="archive-mini-form">
            <input class="studio-input" id="archive-direction-title" placeholder="新方向，如：能源期货" required />
            <input class="studio-input" id="archive-direction-subtitle" placeholder="简短说明" />
            <button class="secondary-button" type="submit">${icon("plus")}新增方向</button>
          </form>
          <div class="sync-panel">
            <strong>${icon("cloud")}GitHub 同步</strong>
            <p>使用写作台里的 GitHub Token 读写档案文件。</p>
            <div class="button-row">
              <button class="secondary-button compact-button" type="button" id="archive-sync-upload">${icon("cloud-upload")}保存到 GitHub</button>
              <button class="secondary-button compact-button" type="button" id="archive-sync-download">${icon("cloud-download")}取回</button>
            </div>
            <div class="status-line" id="archive-sync-status"></div>
          </div>
        </aside>

        <section class="archive-main">
          <div class="archive-main-head">
            <div>
              <span class="script-kicker">Research Desk</span>
              <h2>${escapeHtml(direction?.title || "研究方向")}</h2>
              <p>${escapeHtml(direction?.subtitle || "")}</p>
            </div>
            <button class="secondary-button" type="button" id="vault-lock-button">${icon("log-out")}收起</button>
          </div>

          <div class="archive-project-grid">
            ${(direction?.projects || []).map(renderArchiveProjectCard).join("") || '<div class="empty-state">这个方向还没有项目</div>'}
          </div>

          <form id="archive-project-form" class="archive-inline-form">
            <input class="studio-input" id="archive-project-title" placeholder="新项目，如：商业套保" required />
            <input class="studio-input" id="archive-project-summary" placeholder="项目说明" />
            <button class="secondary-button" type="submit">${icon("folder-plus")}新增项目</button>
          </form>

          ${
            project
              ? `
                <div class="archive-workbench">
                  <div class="archive-project-head">
                    <div>
                      <span>${escapeHtml(project.status || "整理中")}</span>
                      <h3>${escapeHtml(project.title)}</h3>
                      <p>${escapeHtml(project.summary || "")}</p>
                    </div>
                  </div>
                  <form id="archive-entry-form" class="archive-entry-form">
                    <select class="studio-select" id="archive-entry-section">
                      ${archiveSections.map((section) => `<option value="${section.id}">${escapeHtml(section.label)}</option>`).join("")}
                    </select>
                    <input class="studio-input" id="archive-entry-title" placeholder="记录标题" required />
                    <textarea class="studio-textarea" id="archive-entry-body" placeholder="记录文献、代码路径、模型想法、LaTeX 任务或投稿备忘..." required></textarea>
                    <button class="primary-button" type="submit">${icon("save")}保存记录</button>
                  </form>
                  <div class="archive-section-grid">
                    ${archiveSections.map((section) => renderArchiveSection(section, project)).join("")}
                  </div>
                </div>
              `
              : ""
          }
        </section>
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

    app.querySelectorAll("[data-room-target]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) return;
        event.preventDefault();
        const href = link.getAttribute("href");
        const kind = link.dataset.roomKind || "panel";
        const durations = {
          desk: 860,
          drawer: 820,
          cabinet: 840,
          piano: 700,
          table: 760,
          portrait: 650
        };
        const scene = document.getElementById("room-scene");
        scene?.classList.add("is-transitioning");
        link.classList.add("is-opening");
        window.setTimeout(() => {
          location.hash = href.replace(/^#/, "");
        }, durations[kind] || 700);
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
        if (status) status.textContent = "正在进入...";
        try {
          await vaultLoad(password);
          renderRoute();
        } catch {
          if (status) status.textContent = "口令不匹配，或档案数据不可用。";
        }
      });
    }

    const vaultResetButton = document.getElementById("vault-reset-button");
    if (vaultResetButton) {
      vaultResetButton.addEventListener("click", () => {
        const status = document.getElementById("vault-status");
        if (!confirm("确定重设本地档案吗？旧内容不会保留。")) return;
        localStorage.removeItem(VAULT_STORAGE_KEY);
        localStorage.removeItem(LEGACY_VAULT_STORAGE_KEY);
        vaultState.unlocked = false;
        vaultState.password = "";
        vaultState.archive = null;
        if (status) status.textContent = "已重设。请用新的口令建立档案桌。";
        renderRoute();
      });
    }

    app.querySelectorAll("[data-archive-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        vaultState.activeDirectionId = button.dataset.archiveDirection;
        const direction = activeArchiveDirection();
        vaultState.activeProjectId = direction?.projects?.[0]?.id || "";
        renderRoute();
      });
    });

    app.querySelectorAll("[data-archive-project]").forEach((button) => {
      button.addEventListener("click", () => {
        vaultState.activeProjectId = button.dataset.archiveProject;
        renderRoute();
      });
    });

    const archiveDirectionForm = document.getElementById("archive-direction-form");
    if (archiveDirectionForm) {
      archiveDirectionForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = document.getElementById("archive-direction-title").value.trim();
        const subtitle = document.getElementById("archive-direction-subtitle").value.trim();
        if (!title) return;
        const id = safeSlug(title) || `direction-${Date.now()}`;
        vaultState.archive.directions.unshift({ id, title, subtitle, projects: [] });
        vaultState.activeDirectionId = id;
        vaultState.activeProjectId = "";
        await vaultSave();
        renderRoute();
      });
    }

    const archiveProjectForm = document.getElementById("archive-project-form");
    if (archiveProjectForm) {
      archiveProjectForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const direction = activeArchiveDirection();
        const title = document.getElementById("archive-project-title").value.trim();
        const summary = document.getElementById("archive-project-summary").value.trim();
        if (!direction || !title) return;
        const id = safeSlug(title) || `project-${Date.now()}`;
        direction.projects.unshift({ id, title, status: "整理中", summary, entries: [] });
        vaultState.activeProjectId = id;
        await vaultSave();
        renderRoute();
      });
    }

    const archiveEntryForm = document.getElementById("archive-entry-form");
    if (archiveEntryForm) {
      archiveEntryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const project = activeArchiveProject();
        if (!project) return;
        const section = document.getElementById("archive-entry-section").value;
        const title = document.getElementById("archive-entry-title").value.trim();
        const body = document.getElementById("archive-entry-body").value.trim();
        if (!title || !body) return;
        project.entries.unshift({
          id: `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          section,
          title,
          body,
          date: today()
        });
        await vaultSave();
        renderRoute();
      });
    }

    app.querySelectorAll("[data-delete-entry]").forEach((button) => {
      button.addEventListener("click", async () => {
        const project = activeArchiveProject();
        if (!project) return;
        project.entries = (project.entries || []).filter((entry) => entry.id !== button.dataset.deleteEntry);
        await vaultSave();
        renderRoute();
      });
    });

    const archiveSyncUpload = document.getElementById("archive-sync-upload");
    if (archiveSyncUpload) {
      archiveSyncUpload.addEventListener("click", async () => {
        const status = document.getElementById("archive-sync-status");
        if (!studioSession().token) {
          if (status) status.textContent = "先进入写作台填写 GitHub Token。";
          return;
        }
        if (status) status.textContent = "正在保存到 GitHub...";
        try {
          await uploadArchiveToGithub();
          if (status) status.textContent = "已保存到 GitHub。";
        } catch (error) {
          if (status) status.textContent = `同步失败：${error.message}`;
        }
      });
    }

    app.querySelectorAll("#archive-sync-download").forEach((button) => {
      button.addEventListener("click", async () => {
        const status = document.getElementById("archive-sync-status") || document.getElementById("vault-status");
        if (!studioSession().token) {
          if (status) status.textContent = "先进入写作台填写 GitHub Token。";
          return;
        }
        if (status) status.textContent = "正在从 GitHub 取回...";
        try {
          await downloadArchiveFromGithub();
          if (status) status.textContent = "已取回。请输入口令继续。";
          renderRoute();
        } catch (error) {
          if (status) status.textContent = `取回失败：${error.message}`;
        }
      });
    });

    const vaultLockButton = document.getElementById("vault-lock-button");
    if (vaultLockButton) {
      vaultLockButton.addEventListener("click", () => {
        vaultState.unlocked = false;
        vaultState.password = "";
        vaultState.archive = null;
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
    app.classList.toggle("is-room-home", route.path === "/");
    app.classList.toggle("is-room-page", route.path !== "/");
    document.body.classList.toggle("is-room-home", route.path === "/");
    document.body.classList.toggle("is-room-page", route.path !== "/");

    if (route.path === "/") renderHome();
    else if (route.path === "/courses") renderCourses();
    else if (route.path === "/workflow") renderWorkflow();
    else if (route.path.startsWith("/research/")) renderResearchDirection(decodeURIComponent(route.path.slice("/research/".length)));
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
