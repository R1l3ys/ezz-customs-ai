exports.handler = async function (event) {
  try {
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          message: "generate-image function is deployed. Use the website Generate button to POST a prompt.",
        }),
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { prompt, assetType } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing prompt" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing OPENAI_API_KEY in Netlify environment variables",
        }),
      };
    }

    const finalPrompt = `
Create a seamless flat 2D clothing fabric texture for Roblox classic ${assetType || "clothing"}.

User prompt: ${prompt}

Important:
- Output ONLY the fabric/design texture.
- Do NOT draw a Roblox template.
- Do NOT include template labels like FRONT, BACK, L, R, UP, DOWN.
- Do NOT create a 3D render, mannequin, hoodie, jeans model, or floating clothing item.
- Make a square texture/pattern that can be placed inside official Roblox clothing template panels.
- No copyrighted logos or real brand names.
- High contrast, clean Roblox clothing style, usable for shirt or pants panels.
`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: finalPrompt,
        size: "1024x1024",
        quality: "low",
      }),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "OpenAI returned a non-JSON response. Check your API key, billing, and function logs.",
          preview: text.slice(0, 160),
        }),
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data.error?.message || "OpenAI image generation failed",
        }),
      };
    }

    const imageBase64 = data.data?.[0]?.b64_json;

    if (!imageBase64) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No image returned from OpenAI" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${imageBase64}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
