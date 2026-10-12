import {readFile,realpath} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {parseClassificationJson,prepareClassification} from "../lib/value-metrics/classification.ts";
export async function main(args) {
  const output=(status)=>console.log(JSON.stringify({status,preparationOnly:true,valueEvidence:false,qualityEvidence:false}));
  if(args[0]==="--")args=args.slice(1);
  if(args.length===1&&args[0]==="--help"){console.log("Usage: pnpm value-metrics:prepare-classification -- --input FILE --inventory FILE\nExplicit local files only; no database or import. Exit0 VALID_PREPARATION,1 INVALID_INPUT,2 BLOCKED missing/unreadable input,64 INVALID_USAGE.");return 0;}
  if(!args.length){output("BLOCKED");return 2;}
  if(args.length!==4||args[0]!=="--input"||args[2]!=="--inventory"||!args[1]||!args[3]||args[1].startsWith("--")||args[3].startsWith("--")){output("INVALID_USAGE");return 64;}
  let input,inventory;try{[input,inventory]=await Promise.all([readFile(resolve(args[1])),readFile(resolve(args[3]))]);}catch{output("BLOCKED");return 2;}
  try{if(input.length>8388608||inventory.length>8388608)throw new Error();const hash=(b)=>createHash("sha256").update(b).digest("hex");console.log(JSON.stringify(await prepareClassification(parseClassificationJson(input.toString("utf8")),parseClassificationJson(inventory.toString("utf8")),hash(input),hash(inventory)),null,2));return 0;}catch{output("INVALID_INPUT");return 1;}
}
if(process.argv[1]&&await realpath(fileURLToPath(import.meta.url))===await realpath(resolve(process.argv[1])))process.exitCode=await main(process.argv.slice(2));
