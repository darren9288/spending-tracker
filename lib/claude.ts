import { ParseResult } from "./types";

function extractJSON(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON found in response");
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    if (c === "}") { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
  }
  throw new Error("Unbalanced JSON in response");
}

function claudeUrl(): string {
  const base = process.env.CLAUDE_PROXY_URL ?? "https://api.anthropic.com";
  return base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;
}

async function callClaude(system: string, userContent: string, maxTokens = 1024): Promise<string> {
  const res = await fetch(claudeUrl(), {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = data.content?.[0];
  if (!content || content.type !== "text") throw new Error("Unexpected response type");
  return content.text as string;
}

// ── AI expense parser ─────────────────────────────────────────────────────────

export async function parseExpenses(
  text: string,
  walletNames: string[],
  categoryNames: string[]
): Promise<ParseResult> {
  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();

  const system = `You are a personal expense parser for a Malaysian user. Extract date and entries from the user's text.
Return ONLY valid JSON:
{
  "date": "YYYY-MM-DD",
  "entries": [
    {
      "description": "string",
      "amount": number,
      "type": "expense" or "income",
      "category": "one of the known categories below",
      "wallet": "wallet name or null"
    }
  ]
}
Rules:
- date: if user writes "24/4" or "24 April" use year ${year}. No date given → today (${today}).
- amount: numeric only, no currency symbols. MYR assumed unless stated.
- type: "income" if it's salary/refund/received money, else "expense".
- category: pick the closest from known categories: ${categoryNames.join(", ") || "Food & Drinks, Transport, Other Expense"}.
- wallet: if mentioned in brackets like "(Maybank)" or "paid with CIMB". Known wallets: ${walletNames.join(", ") || "none"}. Otherwise null.
- Return ONLY the JSON.`;

  const raw = await callClaude(system, text);
  return extractJSON(raw) as ParseResult;
}

// ── AI monthly summary ────────────────────────────────────────────────────────

export async function generateMonthlySummary(contextJson: string): Promise<string> {
  const system = `You are a friendly personal finance assistant for a Malaysian user.
Given a JSON summary of the user's spending data for the current month, write a short (3-4 sentences) insight card.
Be specific about numbers. Use MYR (RM). Tone: warm, honest, actionable.
Do NOT start with "I" or "Based on". Do NOT use bullet points. Plain prose only.`;
  return callClaude(system, contextJson, 300);
}

// ── AI category suggestion ────────────────────────────────────────────────────

export async function suggestCategory(
  description: string,
  categoryNames: string[]
): Promise<string> {
  const system = `You are a categorisation assistant. Given an expense description, return ONLY the name of the best matching category from this list: ${categoryNames.join(", ")}.
Return only the category name, nothing else.`;
  const result = await callClaude(system, description, 50);
  const name = result.trim();
  return categoryNames.includes(name) ? name : categoryNames[0] ?? "Other Expense";
}
