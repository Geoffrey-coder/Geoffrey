const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.resolve(__dirname, "..");
const contentDir = path.join(rootDir, "content");
const dataDir = path.join(rootDir, "data");

function readJson(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeSlash(value) {
  return value.split(path.sep).join("/");
}

function slugFromFile(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => parseScalar(item))
      .filter((item) => item !== "");
  }
  return trimmed;
}

function parseFrontMatter(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const lines = raw.split(/\r?\n/);
  const closeIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closeIndex === -1) return { data: {}, body: raw };

  const data = {};
  let activeKey = null;

  for (const line of lines.slice(1, closeIndex)) {
    if (!line.trim()) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeKey) {
      if (!Array.isArray(data[activeKey])) data[activeKey] = [];
      data[activeKey].push(parseScalar(listMatch[1]));
      continue;
    }

    const pairMatch = line.match(/^([^:#]+):\s*(.*)$/);
    if (!pairMatch) continue;

    const key = pairMatch[1].trim();
    const value = pairMatch[2].trim();
    activeKey = key;
    data[key] = value === "" ? "" : parseScalar(value);
  }

  return {
    data,
    body: lines.slice(closeIndex + 1).join("\n").trimStart()
  };
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.match(/\[([^\]]+)]/)?.[1] || " ")
    .replace(/[#>*_`~\-|[\]()`$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstHeading(body) {
  const heading = body.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : "";
}

function excerpt(body, limit = 150) {
  const text = stripMarkdown(body);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

function toArray(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) return listMarkdownFiles(fullPath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) return [fullPath];
      return [];
    })
    .sort();
}

function readCollection(folder, type) {
  const baseDir = path.join(contentDir, folder);
  return listMarkdownFiles(baseDir).map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, body } = parseFrontMatter(raw);
    const stat = fs.statSync(filePath);
    const slug = String(data.slug || slugFromFile(filePath));
    const date = String(data.date || stat.mtime.toISOString().slice(0, 10));
    const title = String(data.title || firstHeading(body) || slug);
    const category = String(data.category || (type === "diary" ? "日记" : "随笔"));
    const relativePath = normalizeSlash(path.relative(rootDir, filePath));

    return {
      type,
      slug,
      title,
      date,
      category,
      tags: toArray(data.tags),
      pdf: String(data.pdf || ""),
      summary: String(data.summary || excerpt(body)),
      path: relativePath,
      url: type === "diary" ? `#/diary/${slug}` : `#/post/${slug}`,
      body,
      raw,
      wordCount: stripMarkdown(body).length
    };
  });
}

function byNewest(a, b) {
  const dateOrder = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateOrder !== 0) return dateOrder;
  return a.title.localeCompare(b.title, "zh-CN");
}

function attachNeighbors(items) {
  const sorted = [...items].sort(byNewest);
  return sorted.map((item, index) => ({
    ...item,
    previous: sorted[index + 1]
      ? {
          slug: sorted[index + 1].slug,
          title: sorted[index + 1].title,
          url: sorted[index + 1].url
        }
      : null,
    next: sorted[index - 1]
      ? {
          slug: sorted[index - 1].slug,
          title: sorted[index - 1].title,
          url: sorted[index - 1].url
        }
      : null
  }));
}

function countBy(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const values = getter(item);
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function hashContent(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function build() {
  ensureDir(dataDir);

  const profile = readJson("profile.json", {});
  const friends = readJson("friends.json", []);
  const resources = readJson("resources.json", []);
  const plans = readJson("plans.json", []);
  const courses = readJson("courses.json", []);
  const workflows = readJson("workflows.json", { stages: [], projects: [] });
  const research = readJson("research.json", { directions: [], publicWorks: [] });
  const posts = attachNeighbors(readCollection("posts", "post"));
  const diary = attachNeighbors(readCollection("diary", "diary"));

  const site = {
    generatedAt: new Date().toISOString(),
    profile,
    friends,
    resources,
    plans,
    courses,
    workflows,
    research,
    posts,
    diary,
    recentPosts: posts.slice(0, 8),
    categories: countBy(posts, (item) => [item.category]),
    tags: countBy(posts, (item) => item.tags),
    diaryCategories: countBy(diary, (item) => [item.category]),
    contentHash: ""
  };

  site.contentHash = hashContent({
    posts: posts.map(({ slug, date, title, body }) => ({ slug, date, title, body })),
    diary: diary.map(({ slug, date, title, body }) => ({ slug, date, title, body })),
    profile,
    friends,
    resources,
    plans,
    courses,
    workflows,
    research
  });

  const outputPath = path.join(dataDir, "site.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(site, null, 2)}\n`, "utf8");
  console.log(`Generated ${normalizeSlash(path.relative(rootDir, outputPath))}`);
  console.log(`Posts: ${posts.length}, diary: ${diary.length}, resources: ${resources.length}`);
}

build();
