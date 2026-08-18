import { createPairvuAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  try {
    return await createPairvuAuth().handler(request);
  } catch (error) {
    console.error("auth_route_failed", error);
    return Response.json(
      { error: "Authentication is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
