import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "experimental-edge";

const goneRoots = ["/categories", "/use-cases", "/guides"];

function gonePage() {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Page retired | Pairvu</title></head><body style="font-family:system-ui;max-width:720px;margin:12vh auto;padding:24px"><p>410 · Page retired</p><h1>Pairvu is now an AI model comparison site</h1><p>This product-image page has been permanently removed.</p><nav><a href="/">Home</a> · <a href="/compare">Compare</a> · <a href="/models/qwen3-8b">Models</a> · <a href="/benchmarks/cursorbench">Benchmarks</a> · <a href="/leaderboard">Leaderboard</a> · <a href="/llm-pricing">Pricing</a></nav></body></html>`,
    {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";

  if (path === "/examples" || path === "/ai-product-photography") {
    return NextResponse.redirect(new URL("/", request.url), 301);
  }
  if (path === "/checks") {
    return NextResponse.redirect(new URL("/leaderboard", request.url), 301);
  }
  if (
    path.startsWith("/examples/") ||
    path.startsWith("/checks/") ||
    goneRoots.some((root) => path === root || path.startsWith(`${root}/`)) ||
    path === "/how-pairvu-works" ||
    path === "/pricing"
  ) {
    return gonePage();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
