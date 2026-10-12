"use client";
export default function ValueMetricsError({reset}:{reset:()=>void}){return <section role="alert"><h1>Value metrics unavailable</h1><p>No complete metrics could be loaded. Please try again.</p><button onClick={reset}>Retry</button></section>;}
