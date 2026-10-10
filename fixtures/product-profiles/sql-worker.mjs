// Entirely synthetic local SQL transport. No production resources.
export default {
  async fetch(request,env) {
    if(new URL(request.url).pathname==="/b"&&env.PEER)return env.PEER.fetch(request);
    try {
      const {statements}=await request.json();
      const results=await env.DB.batch(statements.map(s=>env.DB.prepare(s.sql).bind(...s.params)));
      return Response.json({success:true,worker:env.WORKER_NAME,results});
    } catch(error) {return Response.json({success:false,worker:env.WORKER_NAME,error:error.message});}
  }
};
