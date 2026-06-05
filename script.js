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
    previewBox.innerHTML = `<div class="empty-state"><div class="orb"></div><p>Try: black and grey Y2K hoodie</p></div>`;
    return;
  }

  previewTitle.textContent = "Generating...";
  previewBox.innerHTML = `<div class="loading-ring" aria-label="Loading"></div>`;
  lastPrompt = prompt;

  try {
    if (selectedType === "Shirt") {
      lastGeneratedImage = createStructuredShirt(prompt);
      showTemplateResult(prompt, "shirt");
      return;
    }

    if (selectedType === "Pants") {
      lastGeneratedImage = createStructuredPants(prompt);
      showTemplateResult(prompt, "pants");
      return;
    }

    // T-Shirt / UGC still use AI image generation.
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

    lastGeneratedImage = data.image;
    previewTitle.textContent = `${selectedType} image ready`;
    previewBox.innerHTML = `
      <div class="generated-card">
        <img src="${data.image}" alt="Generated Roblox design" style="width:100%; border-radius:20px;" />
        <p>Generated from: ${escapeHTML(prompt)}</p>
      </div>
    `;
  } catch (error) {
    previewTitle.textContent = "Generation failed";
    previewBox.innerHTML = `<div class="empty-state"><div class="orb"></div><p>${escapeHTML(error.message)}</p></div>`;
  }
});

function showTemplateResult(prompt, kind) {
  const title = kind === "pants" ? "Pants clean Roblox upload template ready" : "Shirt clean Roblox upload template ready";
  previewTitle.textContent = title;

  previewBox.innerHTML = `
    <div class="generated-card template-card">
      <div style="background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 24px 24px; border-radius:10px; padding:10px;">
        <img src="${lastGeneratedImage}" alt="Clean Roblox clothing upload template" style="width:100%; max-width:585px; image-rendering:auto;" />
      </div>
      <p>Clean Roblox ${kind} upload PNG generated from: ${escapeHTML(prompt)}</p>
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

/* -----------------------------
   Roblox official panel layout
   585 x 559
   Large square: 128 x 128
   Tall rectangle: 64 x 128
   Wide rectangle: 128 x 64
   Small square: 64 x 64
------------------------------ */

function getPanels() {
  return {
    torsoUp:    { x: 230, y: 8,   w: 128, h: 64 },
    torsoRight: { x: 165, y: 74,  w: 64,  h: 128 },
    torsoFront: { x: 230, y: 74,  w: 128, h: 128 },
    torsoLeft:  { x: 360, y: 74,  w: 64,  h: 128 },
    torsoBack:  { x: 426, y: 74,  w: 128, h: 128 },
    torsoDown:  { x: 230, y: 204, w: 128, h: 64 },

    rightL: { x: 18,  y: 356, w: 64, h: 128 },
    rightB: { x: 84,  y: 356, w: 64, h: 128 },
    rightR: { x: 150, y: 356, w: 64, h: 128 },
    rightF: { x: 216, y: 356, w: 64, h: 128 },
    rightU: { x: 216, y: 290, w: 64, h: 64 },
    rightD: { x: 216, y: 485, w: 64, h: 64 },

    leftU: { x: 308, y: 290, w: 64, h: 64 },
    leftF: { x: 308, y: 356, w: 64, h: 128 },
    leftL: { x: 374, y: 356, w: 64, h: 128 },
    leftB: { x: 440, y: 356, w: 64, h: 128 },
    leftR: { x: 506, y: 356, w: 64, h: 128 },
    leftD: { x: 308, y: 485, w: 64, h: 64 },
  };
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 585;
  canvas.height = 559;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

function drawBleedRect(ctx, p, fill, bleed = 3) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(p.x - bleed, p.y - bleed, p.w + bleed * 2, p.h + bleed * 2);
  ctx.restore();
}

function panelClip(ctx, p, bleed = 1) {
  ctx.beginPath();
  ctx.rect(p.x - bleed, p.y - bleed, p.w + bleed * 2, p.h + bleed * 2);
  ctx.clip();
}

function addPanelShade(ctx, p, intensity = 0.18) {
  ctx.save();
  panelClip(ctx, p, 1);
  const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
  grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
  grad.addColorStop(0.5, "rgba(255,255,255,0.02)");
  grad.addColorStop(1, `rgba(0,0,0,${intensity + 0.08})`);
  ctx.fillStyle = grad;
  ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  ctx.restore();
}

function addFabricNoise(ctx, p, color = "rgba(255,255,255,0.05)") {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = p.y + ((i * 19) % p.h);
    ctx.beginPath();
    ctx.moveTo(p.x - 4, y);
    ctx.lineTo(p.x + p.w + 4, y + Math.sin(i) * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2, color = "rgba(255,255,255,0.25)", width = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r, fill, stroke = null) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function getPalette(prompt) {
  const lower = prompt.toLowerCase();

  let base = "#0b0d10";
  let panel = "#111418";
  let shade = "#050608";
  let accent = "#6b7280";
  let stitch = "rgba(255,255,255,0.28)";
  let graphic = "#e5e7eb";

  if (lower.includes("grey") || lower.includes("gray")) {
    accent = "#8b8f98";
    panel = "#15181d";
  }
  if (lower.includes("blue")) {
    accent = "#2563eb";
  }
  if (lower.includes("red")) {
    accent = "#991b1b";
  }
  if (lower.includes("pink")) {
    accent = "#ec4899";
  }
  if (lower.includes("white")) {
    base = "#d8d8d8";
    panel = "#f3f4f6";
    shade = "#9ca3af";
    stitch = "rgba(0,0,0,0.25)";
    graphic = "#111827";
  }

  return { base, panel, shade, accent, stitch, graphic };
}

/* -----------------------------
   Structured hoodie/shirt logic
------------------------------ */

function createStructuredShirt(prompt) {
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const colors = getPalette(prompt);
  const lower = prompt.toLowerCase();

  // Base hoodie panels. Overfilled to stop white seams.
  [
    p.torsoUp, p.torsoRight, p.torsoFront, p.torsoLeft, p.torsoBack, p.torsoDown,
    p.rightL, p.rightB, p.rightR, p.rightF, p.rightU, p.rightD,
    p.leftU, p.leftF, p.leftL, p.leftB, p.leftR, p.leftD
  ].forEach(panel => {
    drawBleedRect(ctx, panel, colors.base, 4);
    addFabricNoise(ctx, panel);
    addPanelShade(ctx, panel);
  });

  // Front hoodie body
  drawHoodieFront(ctx, p.torsoFront, colors, lower);

  // Back hoodie, simple and aligned
  drawHoodieBack(ctx, p.torsoBack, colors, lower);

  // Side torso panels stay mostly plain so wrapping doesn't look cursed
  drawSidePanel(ctx, p.torsoLeft, colors);
  drawSidePanel(ctx, p.torsoRight, colors);

  // Top and bottom torso: shoulders/hem
  drawShoulderPanel(ctx, p.torsoUp, colors);
  drawHemPanel(ctx, p.torsoDown, colors);

  // Sleeves: clean sleeve layout, not random texture
  [p.rightF, p.rightB, p.rightL, p.rightR, p.leftF, p.leftB, p.leftL, p.leftR].forEach((panel, i) => {
    drawSleevePanel(ctx, panel, colors, lower, i);
  });

  // Sleeve caps/cuffs
  [p.rightU, p.leftU].forEach(panel => drawCuffOrCap(ctx, panel, colors, "top"));
  [p.rightD, p.leftD].forEach(panel => drawCuffOrCap(ctx, panel, colors, "cuff"));

  return canvas.toDataURL("image/png");
}

function drawHoodieFront(ctx, p, colors, lower) {
  ctx.save();
  panelClip(ctx, p, 1);

  // central zipper
  line(ctx, p.x + p.w / 2, p.y + 8, p.x + p.w / 2, p.y + p.h - 8, "rgba(255,255,255,0.22)", 2);
  line(ctx, p.x + p.w / 2 + 4, p.y + 12, p.x + p.w / 2 + 4, p.y + p.h - 12, "rgba(0,0,0,0.45)", 1);

  // hood opening / neck
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x + p.w / 2, p.y + 18, 25, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // drawstrings
  line(ctx, p.x + p.w / 2 - 13, p.y + 30, p.x + p.w / 2 - 24, p.y + 74, "rgba(230,230,230,0.55)", 2);
  line(ctx, p.x + p.w / 2 + 13, p.y + 30, p.x + p.w / 2 + 24, p.y + 74, "rgba(230,230,230,0.55)", 2);

  // kangaroo pocket
  roundedRect(ctx, p.x + 26, p.y + 82, p.w - 52, 32, 8, "rgba(0,0,0,0.25)", "rgba(255,255,255,0.12)");
  line(ctx, p.x + 31, p.y + 98, p.x + p.w - 31, p.y + 98, "rgba(255,255,255,0.08)", 1);

  // subtle grey panels / Y2K blocks
  if (lower.includes("grey") || lower.includes("gray") || lower.includes("y2k")) {
    ctx.fillStyle = hexToRgba(colors.accent, 0.24);
    ctx.fillRect(p.x + 8, p.y + 6, 24, p.h - 12);
    ctx.fillRect(p.x + p.w - 32, p.y + 6, 24, p.h - 12);
  }

  // small chest graphic only on front, not smeared everywhere
  if (lower.includes("skull")) {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = colors.graphic;
    ctx.fillText("☠", p.x + p.w / 2, p.y + 63);
  } else if (lower.includes("ezz")) {
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = colors.graphic;
    ctx.fillText("EZZ", p.x + p.w / 2, p.y + 62);
  }

  ctx.restore();
}

function drawHoodieBack(ctx, p, colors, lower) {
  ctx.save();
  panelClip(ctx, p, 1);

  // broad back shading
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(p.x + 18, p.y + 10, p.w - 36, p.h - 20);
  line(ctx, p.x + 12, p.y + 20, p.x + p.w - 12, p.y + 20, "rgba(255,255,255,0.12)", 2);

  // Optional back graphic kept small and centred
  if (lower.includes("skull")) {
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexToRgba(colors.graphic, 0.9);
    ctx.fillText("☠", p.x + p.w / 2, p.y + p.h / 2);
  }

  ctx.restore();
}

function drawSidePanel(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(p.x + p.w * 0.38, p.y, p.w * 0.24, p.h);
  line(ctx, p.x + p.w - 4, p.y + 4, p.x + p.w - 4, p.y + p.h - 4, "rgba(255,255,255,0.09)", 1);
  ctx.restore();
}

function drawShoulderPanel(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = hexToRgba(colors.accent, 0.16);
  ctx.fillRect(p.x, p.y, p.w, p.h * 0.42);
  line(ctx, p.x, p.y + p.h * 0.45, p.x + p.w, p.y + p.h * 0.45, "rgba(255,255,255,0.10)", 2);
  ctx.restore();
}

function drawHemPanel(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  for (let y = p.y + 4; y < p.y + p.h; y += 9) {
    ctx.fillRect(p.x, y, p.w, 3);
  }
  ctx.restore();
}

function drawSleevePanel(ctx, p, colors, lower, i) {
  ctx.save();
  panelClip(ctx, p, 1);

  // Sleeve seam lines
  line(ctx, p.x + 5, p.y + 8, p.x + 5, p.y + p.h - 8, "rgba(255,255,255,0.10)", 1);
  line(ctx, p.x + p.w - 5, p.y + 8, p.x + p.w - 5, p.y + p.h - 8, "rgba(0,0,0,0.25)", 1);

  // Grey sleeve accents
  if (lower.includes("grey") || lower.includes("gray") || lower.includes("y2k")) {
    ctx.fillStyle = hexToRgba(colors.accent, 0.28);
    ctx.fillRect(p.x + 8, p.y + 14, p.w - 16, 18);
    ctx.fillRect(p.x + 8, p.y + p.h - 36, p.w - 16, 18);
  }

  // Flame or cyber accent only on side sleeve panels
  if (lower.includes("flame") && i % 3 === 0) {
    ctx.fillStyle = colors.graphic;
    ctx.font = "bold 18px Arial";
    ctx.fillText("♨", p.x + p.w / 2 - 8, p.y + p.h / 2);
  }

  ctx.restore();
}

function drawCuffOrCap(ctx, p, colors, type) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = type === "cuff" ? "rgba(0,0,0,0.38)" : hexToRgba(colors.accent, 0.12);
  ctx.fillRect(p.x, p.y, p.w, p.h);
  for (let x = p.x + 4; x < p.x + p.w; x += 10) {
    line(ctx, x, p.y + 4, x, p.y + p.h - 4, "rgba(255,255,255,0.07)", 1);
  }
  ctx.restore();
}

/* -----------------------------
   Structured jeans/pants logic
------------------------------ */

function createStructuredPants(prompt) {
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const colors = getPalette(prompt);
  const lower = prompt.toLowerCase();

  // Pants base. All panels overfilled to prevent white gaps.
  [
    p.torsoUp, p.torsoRight, p.torsoFront, p.torsoLeft, p.torsoBack, p.torsoDown,
    p.rightL, p.rightB, p.rightR, p.rightF, p.rightU, p.rightD,
    p.leftU, p.leftF, p.leftL, p.leftB, p.leftR, p.leftD
  ].forEach(panel => {
    drawBleedRect(ctx, panel, colors.base, 5);
    addDenimTexture(ctx, panel, colors);
    addPanelShade(ctx, panel, 0.12);
  });

  // Torso area for pants = waistband / belt only, not random rips everywhere.
  drawPantsWaist(ctx, p.torsoFront, colors, "front");
  drawPantsWaist(ctx, p.torsoBack, colors, "back");
  drawPantsSideWaist(ctx, p.torsoLeft, colors);
  drawPantsSideWaist(ctx, p.torsoRight, colors);
  drawWaistTopBottom(ctx, p.torsoUp, colors);
  drawWaistTopBottom(ctx, p.torsoDown, colors);

  // Leg front panels get jeans details
  drawLegFront(ctx, p.rightF, colors, lower, "right");
  drawLegFront(ctx, p.leftF, colors, lower, "left");

  // Leg back panels get back pockets
  drawLegBack(ctx, p.rightB, colors, lower, "right");
  drawLegBack(ctx, p.leftB, colors, lower, "left");

  // Side panels get side seam / chain
  [p.rightL, p.rightR, p.leftL, p.leftR].forEach((panel, i) => {
    drawLegSide(ctx, panel, colors, lower, i);
  });

  // Tops/bottoms of legs
  [p.rightU, p.leftU].forEach(panel => drawLegTop(ctx, panel, colors));
  [p.rightD, p.leftD].forEach(panel => drawLegCuff(ctx, panel, colors));

  return canvas.toDataURL("image/png");
}

function addDenimTexture(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let y = p.y - 4; y < p.y + p.h + 4; y += 5) {
    ctx.beginPath();
    ctx.moveTo(p.x - 5, y);
    ctx.lineTo(p.x + p.w + 5, y + Math.sin(y) * 1.4);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  for (let x = p.x - 4; x < p.x + p.w + 4; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, p.y - 4);
    ctx.lineTo(x + Math.cos(x) * 1.2, p.y + p.h + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPantsWaist(ctx, p, colors, side) {
  ctx.save();
  panelClip(ctx, p, 1);

  // waistband
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(p.x - 2, p.y + 4, p.w + 4, 22);
  line(ctx, p.x, p.y + 28, p.x + p.w, p.y + 28, "rgba(255,255,255,0.14)", 2);

  // belt loops
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = p.x + 12; x < p.x + p.w - 8; x += 28) {
    roundedRect(ctx, x, p.y + 5, 6, 24, 2, "rgba(255,255,255,0.10)");
  }

  // front zipper / button area only front
  if (side === "front") {
    line(ctx, p.x + p.w / 2, p.y + 30, p.x + p.w / 2, p.y + p.h - 12, "rgba(255,255,255,0.12)", 2);
    roundedRect(ctx, p.x + p.w / 2 - 4, p.y + 11, 8, 8, 4, "rgba(200,200,200,0.5)");
  }

  ctx.restore();
}

function drawPantsSideWaist(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(p.x - 2, p.y + 4, p.w + 4, 22);
  line(ctx, p.x + p.w - 6, p.y + 30, p.x + p.w - 6, p.y + p.h - 6, "rgba(255,255,255,0.08)", 1);
  ctx.restore();
}

function drawWaistTopBottom(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  for (let x = p.x; x < p.x + p.w; x += 14) {
    line(ctx, x, p.y + 6, x + 6, p.y + p.h - 6, "rgba(255,255,255,0.06)", 1);
  }
  ctx.restore();
}

function drawLegFront(ctx, p, colors, lower, side) {
  ctx.save();
  panelClip(ctx, p, 1);

  // front seam
  line(ctx, p.x + p.w / 2, p.y + 6, p.x + p.w / 2, p.y + p.h - 6, "rgba(255,255,255,0.09)", 1);

  // front pocket curve
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x + (side === "right" ? 14 : p.w - 14), p.y + 22, 22, side === "right" ? 0 : Math.PI, side === "right" ? Math.PI / 2 : Math.PI / 2, side !== "right");
  ctx.stroke();

  if (lower.includes("ripped") || lower.includes("emo") || lower.includes("grunge")) {
    drawRips(ctx, p, 3);
  }

  if (lower.includes("star")) {
    drawStars(ctx, p, colors.graphic);
  }

  ctx.restore();
}

function drawLegBack(ctx, p, colors, lower, side) {
  ctx.save();
  panelClip(ctx, p, 1);

  // Back pocket
  roundedRect(ctx, p.x + 12, p.y + 22, p.w - 24, 34, 5, "rgba(0,0,0,0.22)", "rgba(255,255,255,0.12)");
  line(ctx, p.x + 18, p.y + 38, p.x + p.w - 18, p.y + 38, "rgba(255,255,255,0.09)", 1);

  if (lower.includes("ripped") || lower.includes("emo")) {
    drawRips(ctx, p, 2);
  }

  ctx.restore();
}

function drawLegSide(ctx, p, colors, lower, i) {
  ctx.save();
  panelClip(ctx, p, 1);

  // side seam
  line(ctx, p.x + p.w / 2, p.y + 4, p.x + p.w / 2, p.y + p.h - 4, "rgba(255,255,255,0.12)", 1);

  if (lower.includes("chain") && i % 2 === 0) {
    drawChain(ctx, p);
  }

  ctx.restore();
}

function drawLegTop(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  line(ctx, p.x + 4, p.y + p.h / 2, p.x + p.w - 4, p.y + p.h / 2, "rgba(255,255,255,0.08)", 1);
  ctx.restore();
}

function drawLegCuff(ctx, p, colors) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  for (let y = p.y + 6; y < p.y + p.h; y += 10) {
    line(ctx, p.x + 4, y, p.x + p.w - 4, y, "rgba(255,255,255,0.07)", 1);
  }
  ctx.restore();
}

function drawRips(ctx, p, count) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.strokeStyle = "rgba(235,235,235,0.82)";
  ctx.lineWidth = 2;
  for (let n = 0; n < count; n++) {
    const y = p.y + 42 + n * 28;
    ctx.beginPath();
    ctx.moveTo(p.x + 10, y);
    ctx.bezierCurveTo(p.x + 22, y - 8, p.x + 42, y + 7, p.x + p.w - 10, y - 4);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + 12, y + 3);
    ctx.bezierCurveTo(p.x + 22, y - 4, p.x + 42, y + 7, p.x + p.w - 12, y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(235,235,235,0.82)";
    ctx.lineWidth = 1.5;
  }
  ctx.restore();
}

function drawStars(ctx, p, color) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.font = "bold 12px Arial";
  ctx.fillStyle = color;
  for (let n = 0; n < 4; n++) {
    ctx.fillText("★", p.x + 10 + (n * 15) % (p.w - 18), p.y + 24 + n * 25);
  }
  ctx.restore();
}

function drawChain(ctx, p) {
  ctx.save();
  panelClip(ctx, p, 1);
  ctx.strokeStyle = "rgba(230,230,230,0.74)";
  ctx.lineWidth = 2;
  for (let y = p.y + 16; y < p.y + p.h - 12; y += 12) {
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, y, 7, 4, Math.PI / 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* -----------------------------
   Helpers
------------------------------ */

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
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
