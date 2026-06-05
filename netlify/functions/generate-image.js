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

    let templateInstructions = "";

    if (assetType === "Shirt") {
      templateInstructions = `
Create a FLAT 2D Roblox CLASSIC SHIRT TEMPLATE texture sheet.
It must look like a Roblox clothing upload template, not a 3D hoodie or mannequin.
Show the design laid out as separate UV clothing panels: torso front, torso back, left arm, right arm, top, bottom.
Use a clean square 1024x1024 image.
No human body, no mannequin, no 3D render, no floating clothing item.
Make it look like a usable Roblox classic shirt texture concept.
`;
    } else if (assetType === "Pants") {
      templateInstructions = `
Create a FLAT 2D Roblox CLASSIC PANTS TEMPLATE texture sheet.
It must look like a Roblox clothing upload template, not a 3D pants render.
Show the design laid out as separate UV clothing panels: left leg front, right leg front, left leg back, right leg back, side panels, waist/top areas.
Use a clean square 1024x1024 image.
No human body, no mannequin, no 3D render, no floating clothing item.
Make it look like a usable Roblox classic pants texture concept.
`;
    } else if (assetType === "T-Shirt") {
      templateInstructions = `
Create a flat Roblox T-shirt graphic design.
Centered chest graphic on a plain background.
No 3D mannequin, no full clothing model.
Make it suitable as a Roblox t-shirt decal concept.
`;
    } else {
      templateInstructions = `
Create a Roblox UGC concept sheet.
Show a clean front-facing item concept with simple marketplace-style presentation.
No copyrighted logos or real brand names.
`;
    }

    const finalPrompt = `
${templateInstructions}

User design prompt: ${prompt}

Extra rules:
- Do not add random text labels unless necessary.
- Do not use copyrighted logos.
- Do not use real brand names.
- Keep the design clean, centered, and easy to understand.
- Prioritize Roblox classic clothing template layout over realistic fashion rendering.
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
