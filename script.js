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
      throw new Error("Netlify returned HTML instead of the function. Check the site/project you deployed.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed. Check your API key and billing.");
    }

    lastPrompt = prompt;

    if (selectedType === "Shirt" || selectedType === "Pants") {
      lastGeneratedImage = await createRobloxTemplate(data.image, selectedType, prompt);
      previewTitle.textContent = `${selectedType} Roblox template ready`;

      previewBox.innerHTML = `
        <div class="generated-card template-card">
          <img src="${lastGeneratedImage}" alt="Generated Roblox template" style="width:100%; border-radius:12px; background:white;" />
          <p>Roblox classic ${selectedType.toLowerCase()} template generated from: ${escapeHTML(prompt)}</p>
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
    if (selectedType === "Shirt" || selectedType === "Pants") {
      const fallbackTexture = createFallbackTexture(prompt, selectedType);
      lastGeneratedImage = await createRobloxTemplate(fallbackTexture, selectedType, prompt);
      lastPrompt = prompt;
      previewTitle.textContent = `${selectedType} Roblox template ready`;

      previewBox.innerHTML = `
        <div class="generated-card template-card">
          <img src="${lastGeneratedImage}" alt="Generated Roblox template" style="width:100%; border-radius:12px; background:white;" />
          <p>Fallback template created because the AI request failed: ${escapeHTML(error.message)}</p>
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

  // Roblox classic clothing template size.
  canvas.width = 585;
  canvas.height = 559;

  const ctx = canvas.getContext("2d");
  const texture = await loadImage(textureSrc);

  // White official-template-style background.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (type === "Shirt") {
    drawShirtTemplate(ctx, texture);
  } else {
    drawPantsTemplate(ctx, texture);
  }

  drawTemplateGuides(ctx, type);
  return canvas.toDataURL("image/png");
}

function drawShirtTemplate(ctx, texture) {
  const panels = [
    // Torso row
    { x: 231, y: 74, w: 128, h: 128, label: "TORSO FRONT" },
    { x: 231, y: 330, w: 128, h: 128, label: "TORSO BACK" },
    { x: 231, y: 202, w: 128, h: 64, label: "TORSO TOP" },
    { x: 231, y: 266, w: 128, h: 64, label: "TORSO BOTTOM" },
    { x: 167, y: 202, w: 64, h: 128, label: "TORSO LEFT" },
    { x: 359, y: 202, w: 64, h: 128, label: "TORSO RIGHT" },

    // Left arm
    { x: 39, y: 74, w: 64, h: 128, label: "L ARM FRONT" },
    { x: 103, y: 74, w: 64, h: 128, label: "L ARM SIDE" },
    { x: 39, y: 202, w: 64, h: 64, label: "L ARM TOP" },
    { x: 103, y: 202, w: 64, h: 64, label: "L ARM BOTTOM" },
    { x: 39, y: 266, w: 64, h: 128, label: "L ARM BACK" },
    { x: 103, y: 266, w: 64, h: 128, label: "L ARM SIDE" },

    // Right arm
    { x: 423, y: 74, w: 64, h: 128, label: "R ARM FRONT" },
    { x: 487, y: 74, w: 64, h: 128, label: "R ARM SIDE" },
    { x: 423, y: 202, w: 64, h: 64, label: "R ARM TOP" },
    { x: 487, y: 202, w: 64, h: 64, label: "R ARM BOTTOM" },
    { x: 423, y: 266, w: 64, h: 128, label: "R ARM BACK" },
    { x: 487, y: 266, w: 64, h: 128, label: "R ARM SIDE" },
  ];

  panels.forEach((p, i) => fillPanel(ctx, texture, p, i));
}

function drawPantsTemplate(ctx, texture) {
  const panels = [
    // Left leg group
    { x: 103, y: 74, w: 64, h: 128, label: "L LEG FRONT" },
    { x: 167, y: 74, w: 64, h: 128, label: "L LEG SIDE" },
    { x: 103, y: 202, w: 64, h: 64, label: "L LEG TOP" },
    { x: 167, y: 202, w: 64, h: 64, label: "L LEG BOTTOM" },
    { x: 103, y: 266, w: 64, h: 128, label: "L LEG BACK" },
    { x: 167, y: 266, w: 64, h: 128, label: "L LEG SIDE" },

    // Right leg group
    { x: 359, y: 74, w: 64, h: 128, label: "R LEG FRONT" },
    { x: 423, y: 74, w: 64, h: 128, label: "R LEG SIDE" },
    { x: 359, y: 202, w: 64, h: 64, label: "R LEG TOP" },
    { x: 423, y: 202, w: 64, h: 64, label: "R LEG BOTTOM" },
    { x: 359, y: 266, w: 64, h: 128, label: "R LEG BACK" },
    { x: 423, y: 266, w: 64, h: 128, label: "R LEG SIDE" },

    // Waist/hips
    { x: 231, y: 74, w: 128, h: 64, label: "WAIST FRONT" },
    { x: 231, y: 138, w: 128, h: 64, label: "WAIST BACK" },
  ];

  panels.forEach((p, i) => fillPanel(ctx, texture, p, i));
}

function fillPanel(ctx, texture, p, i) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.w, p.h);
  ctx.clip();

  // Use different texture crops so the template feels designed, not copied.
  const sx = (i * 97) % (texture.width - 260);
  const sy = (i * 151) % (texture.height - 260);
  ctx.drawImage(texture, Math.max(0, sx), Math.max(0, sy), 260, 260, p.x, p.y, p.w, p.h);

  // Add subtle shading for panel depth.
  const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
  grad.addColorStop(0, "rgba(255,255,255,0.16)");
  grad.addColorStop(0.5, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = grad;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  ctx.restore();
}

function drawTemplateGuides(ctx, type) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.font = "bold 9px Arial";

  const guidePanels = type === "Shirt" ? [
    { x: 231, y: 74, w: 128, h: 128, label: "TORSO FRONT" },
    { x: 231, y: 330, w: 128, h: 128, label: "TORSO BACK" },
    { x: 167, y: 202, w: 64, h: 128, label: "LEFT TORSO" },
    { x: 359, y: 202, w: 64, h: 128, label: "RIGHT TORSO" },
    { x: 39, y: 74, w: 128, h: 320, label: "LEFT ARM" },
    { x: 423, y: 74, w: 128, h: 320, label: "RIGHT ARM" },
  ] : [
    { x: 103, y: 74, w: 128, h: 320, label: "LEFT LEG" },
    { x: 359, y: 74, w: 128, h: 320, label: "RIGHT LEG" },
    { x: 231, y: 74, w: 128, h: 128, label: "WAIST" },
  ];

  // Draw all panel outlines from actual fill panels again for Roblox template look.
  const allPanels = type === "Shirt" ? getShirtPanelsForGuide() : getPantsPanelsForGuide();
  allPanels.forEach((p) => {
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  guidePanels.forEach((p) => {
    ctx.fillText(p.label, p.x + 4, p.y + 13);
  });

  ctx.fillStyle = "#111";
  ctx.font = "bold 14px Arial";
  ctx.fillText(type === "Shirt" ? "ROBLOX CLASSIC SHIRT TEMPLATE" : "ROBLOX CLASSIC PANTS TEMPLATE", 168, 35);

  ctx.font = "10px Arial";
  ctx.fillText("585 x 559 classic clothing template layout", 197, 52);
}

function getShirtPanelsForGuide() {
  return [
    { x: 231, y: 74, w: 128, h: 128 }, { x: 231, y: 330, w: 128, h: 128 },
    { x: 231, y: 202, w: 128, h: 64 }, { x: 231, y: 266, w: 128, h: 64 },
    { x: 167, y: 202, w: 64, h: 128 }, { x: 359, y: 202, w: 64, h: 128 },
    { x: 39, y: 74, w: 64, h: 128 }, { x: 103, y: 74, w: 64, h: 128 },
    { x: 39, y: 202, w: 64, h: 64 }, { x: 103, y: 202, w: 64, h: 64 },
    { x: 39, y: 266, w: 64, h: 128 }, { x: 103, y: 266, w: 64, h: 128 },
    { x: 423, y: 74, w: 64, h: 128 }, { x: 487, y: 74, w: 64, h: 128 },
    { x: 423, y: 202, w: 64, h: 64 }, { x: 487, y: 202, w: 64, h: 64 },
    { x: 423, y: 266, w: 64, h: 128 }, { x: 487, y: 266, w: 64, h: 128 },
  ];
}

function getPantsPanelsForGuide() {
  return [
    { x: 103, y: 74, w: 64, h: 128 }, { x: 167, y: 74, w: 64, h: 128 },
    { x: 103, y: 202, w: 64, h: 64 }, { x: 167, y: 202, w: 64, h: 64 },
    { x: 103, y: 266, w: 64, h: 128 }, { x: 167, y: 266, w: 64, h: 128 },
    { x: 359, y: 74, w: 64, h: 128 }, { x: 423, y: 74, w: 64, h: 128 },
    { x: 359, y: 202, w: 64, h: 64 }, { x: 423, y: 202, w: 64, h: 64 },
    { x: 359, y: 266, w: 64, h: 128 }, { x: 423, y: 266, w: 64, h: 128 },
    { x: 231, y: 74, w: 128, h: 64 }, { x: 231, y: 138, w: 128, h: 64 },
  ];
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

  // Streetwear grid/seams
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 1024; i += 96) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 220, 1024);
    ctx.stroke();
  }

  // Stars
  if (lower.includes("star")) {
    ctx.fillStyle = accent;
    for (let i = 0; i < 36; i++) {
      const x = (i * 151) % 1000 + 12;
      const y = (i * 227) % 1000 + 12;
      drawStar(ctx, x, y, 5, 22, 10);
    }
  }

  // Chains
  if (lower.includes("chain")) {
    ctx.strokeStyle = "rgba(240,240,240,0.75)";
    ctx.lineWidth = 12;
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      for (let x = -60; x < 1100; x += 40) {
        const y = 160 + row * 210 + Math.sin(x / 45) * 22;
        ctx.ellipse(x, y, 18, 9, Math.PI / 5, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }

  // Cyber glow
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

  // Skull-ish emblem
  if (lower.includes("skull")) {
    ctx.fillStyle = accent;
    ctx.font = "bold 220px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☠", 512, 512);
  }

  // Hoodie seams or pants seams as texture
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 8;
  if (type === "Pants") {
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(1024, 210);
    ctx.moveTo(0, 812);
    ctx.lineTo(1024, 812);
    ctx.stroke();
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
