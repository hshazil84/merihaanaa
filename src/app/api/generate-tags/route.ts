// app/api/generate-tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { title, excerpt } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a content tagger for a Maldivian editorial magazine called Merihaanaa.
Generate 5 short, relevant tags for this article. Tags should be in Dhivehi (Thaana script) where appropriate, or English for proper nouns and brand names.

Article title: ${title}
${excerpt ? `Excerpt: ${excerpt}` : ""}

Return ONLY a valid JSON array of tag objects. No explanation, no markdown, no backticks, no extra text.
Format exactly: [{"name":"tag name","slug":"tag-slug"},...]
Slugs must be lowercase English letters and hyphens only, no spaces, no special characters.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const tags = JSON.parse(cleaned);

    if (!Array.isArray(tags)) {
      throw new Error("Response is not an array");
    }

    return NextResponse.json({ tags });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Tag generation error:", message);
    return NextResponse.json({ error: "Failed to generate tags", detail: message }, { status: 500 });
  }
}
