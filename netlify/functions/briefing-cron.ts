import type { Config } from "@netlify/functions";
import { runBriefing } from "../../lib/run-briefing";

export const config: Config = {
  schedule: "30 12 * * *",
};

export default async function handler(_req: Request) {
  await runBriefing();
  return new Response("ok", { status: 200 });
}
