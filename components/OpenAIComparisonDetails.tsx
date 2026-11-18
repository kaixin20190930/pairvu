import {gpt6Specs,isGpt6,gpt6RequestCost} from '@/lib/models/openai-gpt6';

export function OpenAIComparisonDetails({a,b}:{a:string;b:string}) {
  if(!isGpt6(a)) return null;
  const x=gpt6Specs[a],y=isGpt6(b)?gpt6Specs[b]:null;
  const scenarios=b==='gpt-6-astra' ? [
    'New projects: evaluate GPT-6.2 Astra with representative tasks and a fixed budget. Its Standard input/output rates are 20% lower and cached reads 60% lower than GPT-6 Astra at the same context and speed setting; lower rates do not guarantee better task quality.',
    'Existing production workloads: compare behavior, tool actions, reasoning configuration and actual billed usage before migrating from GPT-6 Astra. Both models retain 1,050,000 context, 922,000 maximum input and 128,000 maximum output tokens; the newer cutoff is 18 days later, not evidence of universal improvement.',
    'Deployment and platform eligibility: verify the exact model on the platform your application uses. GPT-6 Astra lists Amazon Bedrock and Google Cloud private preview access; this does not establish that GPT-6.2 Astra has the same availability. Retaining the older model may be appropriate while eligibility or migration checks remain unresolved.',
  ] : b==='gpt-5-2' ? [
    'Long documents: evaluate GPT-6.2 Astra when the larger 1,050,000-token context is useful compared with GPT-5.2’s 400,000 (2.625×). Both have a 128,000-token maximum output, so this is not an output-limit upgrade. Account for the full-request premium above 272,000 input tokens before assuming a long-document benefit justifies the cost.',
    'Cost-sensitive existing workloads: keep GPT-5.2 in the evaluation when it already meets requirements. Its $1.75/$14 Standard input/output prices are lower than Astra’s $8/$40 short-context rates; Astra output alone costs about 2.86× per token at short context. This is not an all-request bill ratio, and no upgrade is required solely because a newer model exists.',
    'Migration and reasoning: GPT-5.2 supports reasoning effort none, while GPT-6.2 Astra rejects none. Adapt that configuration and compare actual task success, tool behavior and cost before switching. Evaluate any measured benefit your workload needs, not only long input; the documentation provides no quality guarantee for your tasks.',
  ] : [
    'Batch document processing: start an evaluation with GPT-6.2 Sol when its lower rates meet the required accuracy; Batch pricing is a separate applicable mode.',
    'Difficult professional projects: evaluate GPT-6.2 Astra with representative tasks and a fixed budget before accepting its higher cost over Sol.',
    'High-frequency agents: test Sol for recurring calls, recording correction effort and tool success. Lower price is established; equivalent task quality or speed is not.',
  ];
  return <section>
    <h2>Price, context and reasoning tradeoffs</h2>
    <table className="model-table">
      <thead><tr><th>Specification</th><th>{x.name}</th><th>{y?.name??"GPT-5.2"}</th></tr></thead>
      <tbody>{[
        ["Context","1,050,000",y?"1,050,000":"400,000"],
        ["Maximum input","922,000",y?"922,000":"Not separately stated in the cited OpenAI GPT-5.2 model documentation"],
        ["Maximum output","128,000","128,000"],
        ["Knowledge cutoff",x.cutoff,y?.cutoff??"2025-08-31"],
        ["Input / output","Text and image / text","Text and image / text"],
        ["Short-context input/output",`${x.input}/${x.output}`,y?`${y.input}/${y.output}`:"$1.75/$14"],
        ["Cached read / 1M",`${x.cached}`,y?`${y.cached}`:"USD 0.175"],
        ...(!y?[["Reasoning effort none","Rejected by GPT-6.2 Astra","Supported by GPT-5.2 (default)"]]:[]),
      ].map(([k,left,right])=><tr key={k}><th>{k}</th><td>{left}</td><td>{right}</td></tr>)}</tbody>
    </table>
    {!y&&<p>GPT-5.2 fields in this table were checked 2026-11-18 against the <a href="https://developers.openai.com/api/docs/models/gpt-5.2">official OpenAI GPT-5.2 model documentation</a>. Its maximum input is not separately stated; subtracting the maximum output from the context window would not establish a documented maximum input.</p>}
    {y&&<table className="model-table"><thead><tr><th>Same context / speed</th><th>{x.name} relative to {y.name}</th></tr></thead><tbody>{[["Input",x.input/y.input],["Output",x.output/y.output],["Cached read",x.cached/y.cached]].map(([k,multiplier])=><tr key={k}><th>{k}</th><td>{multiplier}×</td></tr>)}</tbody></table>}
    <p>{x.name} has 1,050,000 context tokens, maximum input 922,000 and maximum output 128,000; knowledge cutoff {x.cutoff}. {y?`${y.name} shares those token limits, with knowledge cutoff ${y.cutoff}. Shared limits do not establish equal quality or speed.`:'GPT-5.2 retains its documented 400,000-token context and historical profile; this comparison does not replace that model or its facts.'}</p>
    <p>Short-context Standard API prices for {x.name} are ${x.input}/M input, ${x.output}/M output and ${x.cached}/M cached reads.{y&&` ${y.name} costs $${y.input}/M input, $${y.output}/M output and $${y.cached}/M cached reads.`} {b==='gpt-6-2-sol'?'Astra is 4× Sol at the same context and speed setting for these three rates. Sol’s June 1 cutoff is 14 days later than Astra’s May 18.':b==='gpt-6-astra'?'The newer Astra input and output rates are 20% cheaper, cached reads are 60% cheaper, and its May 18 cutoff is 18 days later than April 30.':'GPT-5.2 Standard input/output remain $1.75/$14 per million tokens; compare the exact request scope before budgeting.'}</p>
    <p>For the GPT-6 models shown here, more than 272,000 input tokens triggers 2× input/cache and 1.5× output pricing for the full request. Exactly 272,000 does not. At 400,000 uncached input plus 10,000 billed output, Standard {x.name} costs ${gpt6RequestCost(a,400000,10000).toFixed(2)}{isGpt6(b)?` and ${gpt6Specs[b].name} costs $${gpt6RequestCost(b,400000,10000).toFixed(2)}`:''}, excluding tools, cache writes and taxes. The 6.2 models reject reasoning effort none; GPT-6 Astra explicitly supports low, medium, high, xhigh and max. These facts do not supply a complete effort list for 6.2.</p>
    <p>Batch is 50% and Fast is 2× applicable Standard context rates. For GPT-6.2, Ultrafast is 3× through February 28, 2027 and 6× from March 1, 2027 Pacific time; no equivalent promotion is asserted for GPT-6 Astra. Work/Codex subscription message estimates are separate from API billing and general ChatGPT web chat limits. No verified common benchmark score establishes a quality winner for this exact pair.</p>
    <h3>Three workload scenarios</h3><ul>{scenarios.map(scenario=><li key={scenario}>{scenario}</li>)}</ul>
  </section>;
}
