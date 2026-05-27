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
Generate 4-5 short, relevant tags for this article. Tags should be in Dhivehi (Thaana script) where appropriate, or English for proper nouns/brand names.

Article title: ${title}
${excerpt ? `Excerpt: ${excerpt}` : ""}

Return ONLY a valid JSON array of tag objects, no explanation, no markdown, no backticks. Format:
[{"name":"tag name","slug":"tag-slug"},...]

Slugs must be lowercase English, hyphens only, no spaces.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    const tags = JSON.parse(text.trim());

    return NextResponse.json({ tags });
  } catch (err) {
    console.error("Tag generation error:", err);
    return NextResponse.json({ error: "Failed to generate tags" }, { status: 500 });
  }
}
