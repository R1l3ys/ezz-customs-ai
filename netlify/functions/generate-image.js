exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { prompt, assetType } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing prompt" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY in Netlify environment variables" }),
      };
    }

    const finalPrompt = `
Create a Roblox ${assetType || "clothing"} concept image.

User prompt: ${prompt}

Requirements:
- Centered item preview
- Clean Roblox-style marketplace concept
- Dark premium background
- High detail
- No copyrighted logos
- No real brand names
- No text unless the user specifically asked for text
- Make it look suitable for Roblox clothing or UGC inspiration
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

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || "OpenAI image generation failed",
        }),
      };
    }

    const imageBase64 = data.data?.[0]?.b64_json;

    if (!imageBase64) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No image returned from OpenAI" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        image: `data:image/png;base64,${imageBase64}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
