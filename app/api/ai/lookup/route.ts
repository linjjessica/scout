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
      Given the name of a credit card, you will return its reward structure in a specific JSON format.
      
      The format is:
      {
        "cardName": string,
        "categories": { [category: string]: number },
        "defaultRate": number
      }
      
      Valid categories for the "categories" object (use these EXACT keys, all caps):
      - TRAVEL
      - FOOD AND DRINK
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
      
      If a category isn't one of these, try to map it to the closest one. 
      Use decimal values for rates (e.g., 0.03 for 3%).
      "defaultRate" should be the base reward rate for all other purchases (e.g., 0.01 or 0.015).
      
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
