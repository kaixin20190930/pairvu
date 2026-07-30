import fs from "node:fs";
import path from "node:path";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { absoluteUrl, seoPages } from "../lib/seo/content-registry";

const root = process.cwd();
const errors: string[] = [];
const publishedPages = seoPages.filter((page) => page.status === "published");
const publishedRoutes = new Set(publishedPages.map((page) => page.route));

function addError(message: string) {
  errors.push(message);
}

function pageFileForRoute(route: string) {
  return route === "/" ? path.join(root, "app", "page.tsx") : path.join(root, "app", route.slice(1), "page.tsx");
}

function assertUnique(field: "route" | "title" | "h1" | "primaryKeyword") {
  const seen = new Map<string, string>();

  for (const page of publishedPages) {
    const value = page[field].trim().toLowerCase();
    const prior = seen.get(value);
    if (prior) {
      addError(`Duplicate ${field}: "${page[field]}" on ${prior} and ${page.route}`);
    } else {
      seen.set(value, page.route);
    }
  }
}

for (const field of ["route", "title", "h1", "primaryKeyword"] as const) {
  assertUnique(field);
}

for (const page of publishedPages) {
  const pageFile = pageFileForRoute(page.route);
  if (!fs.existsSync(pageFile)) {
    addError(`Published registry route has no page file: ${page.route} (${pageFile})`);
  }

  if (!page.indexable) {
    addError(`Published organic page is unexpectedly non-indexable: ${page.route}`);
  }

  if (page.title.length < 20 || page.title.length > 65) {
    addError(`Title length is outside 20-65 characters: ${page.route} (${page.title.length})`);
  }

  if (page.description.length < 70 || page.description.length > 180) {
    addError(`Description length is outside 70-180 characters: ${page.route} (${page.description.length})`);
  }

  for (const relatedRoute of page.relatedRoutes) {
    if (!publishedRoutes.has(relatedRoute)) {
      addError(`Related route is not published: ${page.route} -> ${relatedRoute}`);
    }
  }

  if (page.parentRoute && !publishedRoutes.has(page.parentRoute)) {
    addError(`Parent route is not published: ${page.route} -> ${page.parentRoute}`);
  }
}

const sourceFiles = walkSourceFiles([path.join(root, "app"), path.join(root, "components")]);
const incomingLinks = new Map<string, Set<string>>();

for (const sourceFile of sourceFiles) {
  const source = fs.readFileSync(sourceFile, "utf8");
  const route = routeFromPageFile(sourceFile);
  const hrefPatterns = [/\bhref=(?:"([^"]+)"|'([^']+)')/g, /\bhref:\s*(?:"([^"]+)"|'([^']+)')/g];

  for (const hrefPattern of hrefPatterns) {
    let match: RegExpExecArray | null;
    while ((match = hrefPattern.exec(source))) {
      const href = match[1] ?? match[2];
      if (!href.startsWith("/") || href.startsWith("/api/")) continue;

      const targetRoute = href.split("#", 1)[0] || "/";
      if (!publishedRoutes.has(targetRoute)) {
        addError(`Internal link points to an unregistered route: ${relative(sourceFile)} -> ${href}`);
        continue;
      }

      const links = incomingLinks.get(targetRoute) ?? new Set<string>();
      links.add(route ?? relative(sourceFile));
      incomingLinks.set(targetRoute, links);
    }
  }
}

for (const page of publishedPages) {
  if (page.route === "/") continue;
  if (!incomingLinks.get(page.route)?.size) {
    addError(`Published page has no source-level incoming link: ${page.route}`);
  }
}

const sitemapRoutes = new Set(sitemap().map((entry) => new URL(entry.url).pathname || "/"));
for (const page of publishedPages) {
  if (page.indexable && !sitemapRoutes.has(page.route)) {
    addError(`Indexable registry page is missing from sitemap: ${page.route}`);
  }
}

for (const route of sitemapRoutes) {
  if (!publishedRoutes.has(route)) {
    addError(`Sitemap contains a route outside the published registry: ${route}`);
  }
}

const robotsConfig = robots();
const robotRules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
const oaiSearchRule = robotRules.find((rule) => rule.userAgent === "OAI-SearchBot");
const gptBotRule = robotRules.find((rule) => rule.userAgent === "GPTBot");

if (!oaiSearchRule || oaiSearchRule.allow !== "/") {
  addError("robots.ts must explicitly allow OAI-SearchBot on public routes.");
}

if (!gptBotRule || gptBotRule.disallow !== "/") {
  addError("robots.ts must explicitly disallow GPTBot under the accepted crawler policy.");
}

if (robotsConfig.sitemap !== absoluteUrl("/sitemap.xml")) {
  addError("robots.ts sitemap URL does not match the canonical site URL.");
}

if (errors.length) {
  console.error(`SEO inventory failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `SEO inventory passed: ${publishedPages.length} published routes, ${sourceFiles.length} source files, ${sitemapRoutes.size} sitemap entries.`,
);

function walkSourceFiles(directories: string[]) {
  const files: string[] = [];

  for (const directory of directories) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkSourceFiles([entryPath]));
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function routeFromPageFile(filePath: string) {
  const relativePath = path.relative(path.join(root, "app"), filePath);
  if (relativePath === "page.tsx") return "/";
  if (!relativePath.endsWith(`${path.sep}page.tsx`)) return null;
  return `/${relativePath.slice(0, -`${path.sep}page.tsx`.length).split(path.sep).join("/")}`;
}

function relative(filePath: string) {
  return path.relative(root, filePath);
}
