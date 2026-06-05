const assetButtons = document.querySelectorAll(".asset-btn");
const exampleButtons = document.querySelectorAll("[data-prompt]");
const promptInput = document.querySelector("#prompt");
const generateBtn = document.querySelector("#generateBtn");
const previewBox = document.querySelector("#previewBox");
const previewTitle = document.querySelector("#previewTitle");
const assetBadge = document.querySelector("#assetBadge");

let selectedType = "Shirt";
let lastGeneratedImage = "";
let lastPrompt = "";

assetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    assetButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    selectedType = button.dataset.type;
    assetBadge.textContent = selectedType;
  });
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    previewTitle.textContent = "Add a prompt first";
    previewBox.innerHTML = `
      <div class="empty-state">
        <div class="orb"></div>
        <p>Try: black and red cyber hoodie with glowing skull logo</p>
      </div>
    `;
    return;
  }

  previewTitle.textContent = "Generating texture...";
  previewBox.innerHTML = `<div class="loading-ring" aria-label="Loading"></div>`;

  try {
    const response = await fetch("/.netlify/functions/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt,
        assetType: selectedType,
      }),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Netlify returned HTML instead of JSON. Check the function deployment.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed. Check your API key and billing.");
    }

    lastPrompt = prompt;

    if (selectedType === "Shirt" || selectedType === "Pants") {
      lastGeneratedImage = await createRobloxTemplate(data.image, selectedType, prompt);
      previewTitle.textContent = `${selectedType} official Roblox template ready`;

      previewBox.innerHTML = `
        <div class="generated-card template-card">
          <img src="${lastGeneratedImage}" alt="Generated Roblox template" style="width:100%; border-radius:12px; background:#ddd;" />
          <p>Official ${selectedType.toLowerCase()} template layout generated from: ${escapeHTML(prompt)}</p>
        </div>
      `;
    } else {
      lastGeneratedImage = data.image;
      previewTitle.textContent = `${selectedType} image ready`;

      previewBox.innerHTML = `
        <div class="generated-card">
          <img src="${data.image}" alt="Generated Roblox design" style="width:100%; border-radius:20px;" />
          <p>Generated from: ${escapeHTML(prompt)}</p>
        </div>
      `;
    }
  } catch (error) {
    // If OpenAI fails, still create the Roblox template using a local fallback pattern.
    if (selectedType === "Shirt" || selectedType === "Pants") {
      const fallbackTexture = createFallbackTexture(prompt, selectedType);
      lastGeneratedImage = await createRobloxTemplate(fallbackTexture, selectedType, prompt);
      lastPrompt = prompt;
      previewTitle.textContent = `${selectedType} official Roblox template ready`;

      previewBox.innerHTML = `
        <div class="generated-card template-card">
          <img src="${lastGeneratedImage}" alt="Generated Roblox template" style="width:100%; border-radius:12px; background:#ddd;" />
          <p>Fallback template created because AI failed: ${escapeHTML(error.message)}</p>
        </div>
      `;
      return;
    }

    previewTitle.textContent = "Generation failed";
    previewBox.innerHTML = `
      <div class="empty-state">
        <div class="orb"></div>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
});

document.querySelectorAll(".download-row button")[0]?.addEventListener("click", () => {
  if (!lastGeneratedImage) {
    alert("Generate an image first.");
    return;
  }

  const link = document.createElement("a");
  link.href = lastGeneratedImage;
  link.download = selectedType === "Pants" ? "roblox-pants-template.png" : "roblox-shirt-template.png";
  link.click();
});

document.querySelectorAll(".download-row button")[2]?.addEventListener("click", async () => {
  if (!lastPrompt) {
    alert("Generate or enter a prompt first.");
    return;
  }

  await navigator.clipboard.writeText(lastPrompt);
  alert("Prompt copied.");
});

async function createRobloxTemplate(textureSrc, type, prompt) {
  const canvas = document.createElement("canvas");
  canvas.width = 585;
  canvas.height = 559;

  const ctx = canvas.getContext("2d");
  const texture = await loadImage(textureSrc);
  const base = await loadImage(type === "Pants" ? "/assets/roblox-pants-template.png" : "/assets/roblox-shirt-template.png");

  // Start from the exact Roblox template image provided by the user.
  ctx.drawImage(base, 0, 0, 585, 559);

  const panels = type === "Pants" ? getOfficialPantsPanels() : getOfficialShirtPanels();

  // Fill only the proper clothing panels using the official sizes:
  // large square 128x128, tall rectangle 64x128, wide rectangle 128x64, small square 64x64.
  panels.forEach((panel, i) => {
    fillOfficialPanel(ctx, texture, panel, i);
  });

  // Redraw clean red panel borders so it remains visibly Roblox-template-shaped.
  drawOfficialTemplateOutlines(ctx, panels, type);

  return canvas.toDataURL("image/png");
}

function getOfficialShirtPanels() {
  return [
    // Torso
    { x: 230, y: 8, w: 128, h: 64, label: "UP" },
    { x: 165, y: 74, w: 64, h: 128, label: "R" },
    { x: 230, y: 74, w: 128, h: 128, label: "FRONT" },
    { x: 360, y: 74, w: 64, h: 128, label: "L" },
    { x: 426, y: 74, w: 128, h: 128, label: "BACK" },
    { x: 230, y: 204, w: 128, h: 64, label: "DOWN" },

    // Right arm
    { x: 18, y: 356, w: 64, h: 128, label: "L" },
    { x: 84, y: 356, w: 64, h: 128, label: "B" },
    { x: 150, y: 356, w: 64, h: 128, label: "R" },
    { x: 216, y: 356, w: 64, h: 128, label: "F" },
    { x: 216, y: 290, w: 64, h: 64, label: "U" },
    { x: 216, y: 485, w: 64, h: 64, label: "D" },

    // Left arm
    { x: 308, y: 290, w: 64, h: 64, label: "U" },
    { x: 308, y: 356, w: 64, h: 128, label: "F" },
    { x: 374, y: 356, w: 64, h: 128, label: "L" },
    { x: 440, y: 356, w: 64, h: 128, label: "B" },
    { x: 506, y: 356, w: 64, h: 128, label: "R" },
    { x: 308, y: 485, w: 64, h: 64, label: "D" },
  ];
}

function getOfficialPantsPanels() {
  return [
    // Waist/torso area on pants template
    { x: 230, y: 8, w: 128, h: 64, label: "UP" },
    { x: 165, y: 74, w: 64, h: 128, label: "R" },
    { x: 230, y: 74, w: 128, h: 128, label: "FRONT" },
    { x: 360, y: 74, w: 64, h: 128, label: "L" },
    { x: 426, y: 74, w: 128, h: 128, label: "BACK" },
    { x: 230, y: 204, w: 128, h: 64, label: "DOWN" },

    // Right leg
    { x: 18, y: 356, w: 64, h: 128, label: "L" },
    { x: 84, y: 356, w: 64, h: 128, label: "B" },
    { x: 150, y: 356, w: 64, h: 128, label: "R" },
    { x: 216, y: 356, w: 64, h: 128, label: "F" },
    { x: 216, y: 290, w: 64, h: 64, label: "U" },
    { x: 216, y: 485, w: 64, h: 64, label: "D" },

    // Left leg
    { x: 308, y: 290, w: 64, h: 64, label: "U" },
    { x: 308, y: 356, w: 64, h: 128, label: "F" },
    { x: 374, y: 356, w: 64, h: 128, label: "L" },
    { x: 440, y: 356, w: 64, h: 128, label: "B" },
    { x: 506, y: 356, w: 64, h: 128, label: "R" },
    { x: 308, y: 485, w: 64, h: 64, label: "D" },
  ];
}

function fillOfficialPanel(ctx, texture, p, i) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.w, p.h);
  ctx.clip();

  const cropSize = 330;
  const sx = Math.max(0, ((i * 113) % Math.max(1, texture.width - cropSize)));
  const sy = Math.max(0, ((i * 179) % Math.max(1, texture.height - cropSize)));

  ctx.globalAlpha = 0.92;
  ctx.drawImage(texture, sx, sy, cropSize, cropSize, p.x, p.y, p.w, p.h);

  // Add subtle seams / shading to make panel direction readable.
  const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
  grad.addColorStop(0, "rgba(255,255,255,0.20)");
  grad.addColorStop(0.52, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.20)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  ctx.restore();
}

function drawOfficialTemplateOutlines(ctx, panels, type) {
  ctx.save();

  // Panel borders
  ctx.strokeStyle = "rgba(255,0,0,0.9)";
  ctx.lineWidth = 1;
  panels.forEach((p) => {
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // Dotted maximum-height line on tall panels from Roblox template.
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  panels.filter(p => p.h === 128).forEach((p) => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 64);
    ctx.lineTo(p.x + p.w, p.y + 64);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Labels for clear orientation
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  panels.forEach((p) => {
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(p.x + 3, p.y + 3, Math.min(p.w - 6, 72), 22);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(p.label, p.x + Math.min(p.w / 2, 38), p.y + 15);
  });

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(type === "Pants" ? "ROBLOX Pants Template" : "ROBLOX Shirt Template", 444, 294);

  ctx.restore();
}

function createFallbackTexture(prompt, type) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const lower = prompt.toLowerCase();

  let bg1 = "#111827";
  let bg2 = "#ef4444";
  let accent = "#38bdf8";

  if (lower.includes("pink")) {
    bg1 = "#f9a8d4";
    bg2 = "#f472b6";
    accent = "#111827";
  } else if (lower.includes("black")) {
    bg1 = "#020617";
    bg2 = "#111827";
    accent = lower.includes("red") ? "#ef4444" : "#e5e7eb";
  } else if (lower.includes("red")) {
    bg1 = "#050505";
    bg2 = "#dc2626";
    accent = "#f97316";
  } else if (lower.includes("blue")) {
    bg1 = "#020617";
    bg2 = "#2563eb";
    accent = "#67e8f9";
  } else if (lower.includes("green")) {
    bg1 = "#052e16";
    bg2 = "#22c55e";
    accent = "#bbf7d0";
  } else if (lower.includes("white")) {
    bg1 = "#f8fafc";
    bg2 = "#cbd5e1";
    accent = "#111827";
  }

  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, bg1);
  grad.addColorStop(1, bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Fabric grain
  for (let i = 0; i < 250; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + (i % 7) * 0.006})`;
    ctx.fillRect((i * 47) % 1024, (i * 91) % 1024, 220, 2);
  }

  if (lower.includes("ripped")) {
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 12; i++) {
      const x = 100 + (i * 73) % 800;
      const y = 120 + (i * 131) % 780;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 40, y - 20, x + 90, y + 20, x + 140, y - 12);
      ctx.stroke();
    }
  }

  if (lower.includes("star")) {
    ctx.fillStyle = accent;
    for (let i = 0; i < 36; i++) {
      const x = (i * 151) % 1000 + 12;
      const y = (i * 227) % 1000 + 12;
      drawStar(ctx, x, y, 5, 22, 10);
    }
  }

  if (lower.includes("chain")) {
    ctx.strokeStyle = "rgba(240,240,240,0.75)";
    ctx.lineWidth = 12;
    for (let row = 0; row < 4; row++) {
      for (let x = -60; x < 1100; x += 42) {
        const y = 160 + row * 210 + Math.sin(x / 45) * 22;
        ctx.beginPath();
        ctx.ellipse(x, y, 18, 9, Math.PI / 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  if (lower.includes("cyber") || lower.includes("glow")) {
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    for (let i = 0; i < 8; i++) {
      ctx.strokeRect(120 + i * 36, 120 + i * 36, 780 - i * 72, 780 - i * 72);
    }
    ctx.shadowBlur = 0;
  }

  if (lower.includes("skull")) {
    ctx.fillStyle = accent;
    ctx.font = "bold 220px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☠", 512, 512);
  }

  return canvas.toDataURL("image/png");
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[match]));
}
