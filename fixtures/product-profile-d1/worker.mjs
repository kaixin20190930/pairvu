// Synthetic, ephemeral Miniflare harness. No application code, secrets, or external fetch.
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === "/b" && env.PEER) return env.PEER.fetch(request);
    try {
      const { statements } = await request.json();
      const prepared = statements.map(({ sql, params = [] }) => env.DB.prepare(sql).bind(...params));
      const results = await env.DB.batch(prepared);
      return Response.json({ success: true, worker: env.FIXTURE_WORKER, results });
    } catch (error) {
      return Response.json({ success: false, worker: env.FIXTURE_WORKER, error: error.message }, { status: 409 });
    }
  },
};
