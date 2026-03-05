import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { cardName } = await req.json();

    if (!cardName) {
      return NextResponse.json({ error: "Card name is required" }, { status: 400 });
    }

    const systemPrompt = `
      You are an expert in credit card rewards and benefits. 
      Given the name of a credit card, you will return its reward structure in a specific JSON format based on the most current 2025-2026 reward rates.
      
      The format is:
      {
        "cardName": string,
        "categories": { [category: string]: number },
        "defaultRate": number
      }
      
      Valid categories for the "categories" object (use these EXACT keys, all caps):
      - TRAVEL
      - FOOD AND DRINK
      - GROCERIES
      - STREAMING
      - SERVICE
      - SHOPS
      - HEALTHCARE
      - ENTERTAINMENT
      - UTILITIES
      - COMMUNITY
      - GAS STATION
      - TRANSPORT
      - RECREATION
      - GENERAL MERCHANDISE
      
      CRITICAL INSTRUCTIONS:
      1. Distinguish between similar card tiers. For example, "Capital One Savor" (annual fee) has 4% on dining/entertainment/streaming and 3% on groceries, whereas "Capital One SavorOne" (no annual fee) has 3% on all those categories. If the input is ambiguous, return the most common or current standard rate.
      2. If a category isn't one of these, try to map it to the closest one. 
      3. Use decimal values for rates (e.g., 0.03 for 3%).
      4. "defaultRate" should be the base reward rate for all other purchases (e.g., 0.01 or 0.015).
      5. Ensure no duplicate categories are returned.
      
      Only return the JSON object. No explanation text.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Identify the benefits for the "${cardName}" credit card.` }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
