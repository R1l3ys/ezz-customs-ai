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
