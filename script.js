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
    previewBox.innerHTML = `<div class="empty-state"><div class="orb"></div><p>Try: black and red cyber hoodie with glowing skull logo</p></div>`;
    return;
  }

  previewTitle.textContent = "Generating texture...";
  previewBox.innerHTML = `<div class="loading-ring" aria-label="Loading"></div>`;

  try {
    const response = await fetch("/.netlify/functions/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ prompt, assetType: selectedType }),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Netlify returned HTML instead of JSON. The function failed or timed out.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed.");
    }

    lastPrompt = prompt;

    if (selectedType === "Shirt" || selectedType === "Pants") {
      lastGeneratedImage = await createCleanRobloxUploadTemplate(data.image, selectedType, prompt);
      showTemplateResult(prompt);
    } else {
      lastGeneratedImage = data.image;
      previewTitle.textContent = `${selectedType} image ready`;
      previewBox.innerHTML = `<div class="generated-card"><img src="${data.image}" alt="Generated Roblox design" style="width:100%; border-radius:20px;" /><p>Generated from: ${escapeHTML(prompt)}</p></div>`;
    }
  } catch (error) {
    if (selectedType === "Shirt" || selectedType === "Pants") {
      const fallback = createFallbackTexture(prompt, selectedType);
      lastGeneratedImage = await createCleanRobloxUploadTemplate(fallback, selectedType, prompt);
      showTemplateResult(prompt, error.message);
      return;
    }

    previewTitle.textContent = "Generation failed";
    previewBox.innerHTML = `<div class="empty-state"><div class="orb"></div><p>${escapeHTML(error.message)}</p></div>`;
  }
});

function showTemplateResult(prompt, warning = "") {
  previewTitle.textContent = `${selectedType} clean Roblox upload template ready`;
  previewBox.innerHTML = `
    <div class="generated-card template-card">
      <div style="background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 24px 24px; border-radius:10px; padding:10px;">
        <img src="${lastGeneratedImage}" alt="Clean Roblox clothing upload template" style="width:100%; max-width:585px; image-rendering:auto;" />
      </div>
      <p>${warning ? "Fallback used: " + escapeHTML(warning) + "<br>" : ""}Clean Roblox ${selectedType.toLowerCase()} upload PNG generated from: ${escapeHTML(prompt)}</p>
    </div>
  `;
}

document.querySelectorAll(".download-row button")[0]?.addEventListener("click", () => {
  if (!lastGeneratedImage) {
    alert("Generate an image first.");
    return;
  }
  const link = document.createElement("a");
  link.href = lastGeneratedImage;
  link.download = selectedType === "Pants" ? "roblox-pants-clean-upload.png" : "roblox-shirt-clean-upload.png";
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

async function createCleanRobloxUploadTemplate(textureSrc, type, prompt) {
  const canvas = document.createElement("canvas");
  canvas.width = 585;
  canvas.height = 559;
  const ctx = canvas.getContext("2d");

  // IMPORTANT: transparent background. No Roblox guide labels, no arrows, no logo, no coloured base.
  ctx.clearRect(0, 0, 585, 559);

  const texture = await loadImage(textureSrc);
  const panels = getOfficialPanels();

  panels.forEach((panel, i) => {
    fillPanel(ctx, texture, panel, i, prompt, type);
  });

  return canvas.toDataURL("image/png");
}

function getOfficialPanels() {
  return [
    // TORSO
    { x: 230, y: 8, w: 128, h: 64, label: "UP" },
    { x: 165, y: 74, w: 64, h: 128, label: "R" },
    { x: 230, y: 74, w: 128, h: 128, label: "FRONT" },
    { x: 360, y: 74, w: 64, h: 128, label: "L" },
    { x: 426, y: 74, w: 128, h: 128, label: "BACK" },
    { x: 230, y: 204, w: 128, h: 64, label: "DOWN" },

    // RIGHT ARM / RIGHT LEG
    { x: 18, y: 356, w: 64, h: 128, label: "L" },
    { x: 84, y: 356, w: 64, h: 128, label: "B" },
    { x: 150, y: 356, w: 64, h: 128, label: "R" },
    { x: 216, y: 356, w: 64, h: 128, label: "F" },
    { x: 216, y: 290, w: 64, h: 64, label: "U" },
    { x: 216, y: 485, w: 64, h: 64, label: "D" },

    // LEFT ARM / LEFT LEG
    { x: 308, y: 290, w: 64, h: 64, label: "U" },
    { x: 308, y: 356, w: 64, h: 128, label: "F" },
    { x: 374, y: 356, w: 64, h: 128, label: "L" },
    { x: 440, y: 356, w: 64, h: 128, label: "B" },
    { x: 506, y: 356, w: 64, h: 128, label: "R" },
    { x: 308, y: 485, w: 64, h: 64, label: "D" },
  ];
}

function fillPanel(ctx, texture, p, i, prompt, type) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.w, p.h);
  ctx.clip();

  const crop = 360;
  let sx = (i * 131) % Math.max(1, texture.width - crop);
  let sy = (i * 197) % Math.max(1, texture.height - crop);

  if (p.label === "FRONT") {
    sx = Math.max(0, texture.width / 2 - crop / 2);
    sy = Math.max(0, texture.height / 2 - crop / 2);
  }

  ctx.drawImage(texture, sx, sy, crop, crop, p.x, p.y, p.w, p.h);

  // Soft seam/shading, no text labels.
  const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
  grad.addColorStop(0, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = grad;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  const lower = prompt.toLowerCase();

  if (type === "Pants" && (lower.includes("ripped") || lower.includes("emo"))) {
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    for (let n = 0; n < 3; n++) {
      const y = p.y + 28 + n * 30;
      ctx.beginPath();
      ctx.moveTo(p.x + 6, y);
      ctx.bezierCurveTo(p.x + 22, y - 7, p.x + 42, y + 6, p.x + p.w - 6, y - 5);
      ctx.stroke();
    }
  }

  if (type === "Shirt" && p.label === "FRONT" && lower.includes("skull")) {
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("☠", p.x + p.w / 2, p.y + p.h / 2);
  }

  ctx.restore();
}

function createFallbackTexture(prompt, type) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const lower = prompt.toLowerCase();

  let bg1 = "#111827", bg2 = "#ef4444", accent = "#e5e7eb";
  if (lower.includes("pink")) { bg1 = "#f9a8d4"; bg2 = "#f472b6"; accent = "#111827"; }
  if (lower.includes("black")) { bg1 = "#020617"; bg2 = "#111827"; accent = lower.includes("red") ? "#ef4444" : "#ffffff"; }
  if (lower.includes("blue")) { bg1 = "#020617"; bg2 = "#2563eb"; accent = "#67e8f9"; }

  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, bg1);
  grad.addColorStop(1, bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + (i % 6) * 0.01})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((i * 47) % 1024, (i * 83) % 1024);
    ctx.lineTo(((i * 47) % 1024) + 180, ((i * 83) % 1024) + 12);
    ctx.stroke();
  }

  if (lower.includes("ripped")) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 20; i++) {
      const x = 80 + (i * 83) % 850;
      const y = 100 + (i * 127) % 800;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 35, y - 14, x + 80, y + 12, x + 130, y - 8);
      ctx.stroke();
    }
  }

  if (lower.includes("star")) {
    ctx.font = "bold 56px Arial";
    ctx.fillStyle = accent;
    for (let i = 0; i < 30; i++) {
      ctx.fillText("★", (i * 151) % 980 + 20, (i * 227) % 980 + 30);
    }
  }

  return canvas.toDataURL("image/png");
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
