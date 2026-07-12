import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { aiLogs } from "@/db/schema";
import {
  categorize,
  suggestTags,
  moderate,
  rewrite,
  summarize,
  assistant,
} from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { action, text } = await req.json();
    const input = String(text ?? "");

    let output: unknown;
    switch (action) {
      case "categorize":
        output = { ...categorize(input), tags: suggestTags(input) };
        break;
      case "tags":
        output = { tags: suggestTags(input) };
        break;
      case "moderate":
        output = moderate(input);
        break;
      case "rewrite":
        output = { text: await rewrite(input) };
        break;
      case "summarize":
        output = { summary: await summarize(input) };
        break;
      case "assistant":
        output = { reply: await assistant(input) };
        break;
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    // log (best-effort)
    db.insert(aiLogs)
      .values({
        userId: session?.userId ?? null,
        action,
        input: input.slice(0, 2000),
        output,
      })
      .catch(() => {});

    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
