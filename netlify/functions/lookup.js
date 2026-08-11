// netlify/functions/lookup.js
//
// This runs on Netlify's servers (not in the browser), so it's safe to keep
// the Anthropic API key here as an environment variable. Set it in:
// Netlify dashboard → Site configuration → Environment variables → ANTHROPIC_API_KEY

exports.handler = async (event) => {
  // CORS headers so the same-site frontend can call this
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Server is missing ANTHROPIC_API_KEY. Add it in Netlify → Site configuration → Environment variables, then redeploy.",
      }),
    };
  }

  let word;
  try {
    const parsed = JSON.parse(event.body || "{}");
    word = (parsed.word || "").trim();
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!word) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing 'word' in request body" }),
    };
  }

  const prompt = `You are a vocabulary assistant. For the English word "${word}", provide:
1. Hindi meaning (in Devanagari script, give 1-3 words)
2. English meaning (a clear, concise definition, 1-2 sentences)
3. Three example sentences using "${word}" naturally. In each sentence, wrap the word "${word}" (or its inflection) in <b> tags.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "hindi": "...",
  "english": "...",
  "uses": ["sentence 1", "sentence 2", "sentence 3"]
}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return {
        statusCode: anthropicRes.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Anthropic API error",
        }),
      };
    }

    const text = (data.content || [])
      .map((b) => b.text || "")
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Lookup failed" }),
    };
  }
};
