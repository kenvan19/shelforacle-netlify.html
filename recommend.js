// netlify/functions/recommend.js
// Proxies the browser's request to the Anthropic Messages API.
// Keeps your API key server-side (never exposed to the page).

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in Netlify env vars." }),
    };
  }

  let prompt = "";
  try {
    prompt = JSON.parse(event.body || "{}").prompt || "";
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad request body." }) };
  }
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt." }) };
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const data = await resp.json();
    return {
      statusCode: resp.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Upstream call failed: " + e.message }),
    };
  }
};
