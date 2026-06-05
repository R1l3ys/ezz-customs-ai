
const assetButtons = document.querySelectorAll(".asset-btn, .type");
const exampleButtons = document.querySelectorAll("[data-prompt]");
const promptInput = document.querySelector("#prompt");
const generateBtn = document.querySelector("#generateBtn, #generate");
const previewBox = document.querySelector("#previewBox");
const previewTitle = document.querySelector("#previewTitle, #title");
const assetBadge = document.querySelector("#assetBadge, #badge");
const canvasEl = document.querySelector("#canvas");

let selectedType = "Shirt";
let lastGeneratedImage = "";
let lastPrompt = "";

assetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    assetButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    selectedType = normalizeType(button.dataset.type || button.textContent);
    if (assetBadge) assetBadge.textContent = selectedType;
  });
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

generateBtn?.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showError("Add a prompt first. Try: black grey y2k hoodie with skull and chains");
    return;
  }

  lastPrompt = prompt;
  setTitle("Generating clothing...");

  try {
    if (selectedType === "Shirt") {
      lastGeneratedImage = createSmartShirt(prompt);
      showResult(prompt, "shirt");
      return;
    }

    if (selectedType === "Pants") {
      lastGeneratedImage = createSmartPants(prompt);
      showResult(prompt, "pants");
      return;
    }

    // Optional AI fallback for T-Shirt / UGC on the old Netlify site.
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
      throw new Error("AI function failed or is not connected.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed.");
    }

    lastGeneratedImage = data.image;
    showImageResult(prompt, selectedType, data.image);
  } catch (error) {
    showError(error.message);
  }
});

document.querySelectorAll(".download-row button, .actions button").forEach((btn) => {
  const text = btn.textContent.toLowerCase();
  if (text.includes("download")) {
    btn.addEventListener("click", downloadPNG);
  }
  if (text.includes("clear")) {
    btn.addEventListener("click", () => {
      if (canvasEl) canvasEl.getContext("2d").clearRect(0, 0, 585, 559);
    });
  }
  if (text.includes("copy")) {
    btn.addEventListener("click", async () => {
      if (!lastPrompt) return alert("Generate or enter a prompt first.");
      await navigator.clipboard.writeText(lastPrompt);
      alert("Prompt copied.");
    });
  }
});

function normalizeType(value) {
  const t = String(value || "").toLowerCase();
  if (t.includes("pant") || t.includes("jean")) return "Pants";
  if (t.includes("t-shirt") || t.includes("tee")) return "T-Shirt";
  if (t.includes("ugc")) return "UGC Item";
  return "Shirt";
}

function setTitle(text) {
  if (previewTitle) previewTitle.textContent = text;
}

function showError(message) {
  setTitle("Generation failed");
  if (previewBox) {
    previewBox.innerHTML = `
      <div class="empty-state">
        <div class="orb"></div>
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  } else {
    alert(message);
  }
}

function showResult(prompt, kind) {
  setTitle(`${kind === "pants" ? "Pants" : "Shirt"} insane logic template ready`);

  if (canvasEl) {
    const c = canvasEl.getContext("2d");
    const img = new Image();
    img.onload = () => {
      c.clearRect(0, 0, 585, 559);
      c.drawImage(img, 0, 0);
    };
    img.src = lastGeneratedImage;
    return;
  }

  if (previewBox) {
    previewBox.innerHTML = `
      <div class="generated-card template-card">
        <div style="background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 24px 24px; border-radius:10px; padding:10px;">
          <img src="${lastGeneratedImage}" alt="Roblox clothing upload template" style="width:100%; max-width:585px; image-rendering:auto;" />
        </div>
        <p>Generated with EzzAI insane logic from: ${escapeHTML(prompt)}</p>
      </div>
    `;
  }
}

function showImageResult(prompt, type, image) {
  setTitle(`${type} image ready`);
  if (previewBox) {
    previewBox.innerHTML = `
      <div class="generated-card">
        <img src="${image}" alt="Generated design" style="width:100%; border-radius:20px;" />
        <p>Generated from: ${escapeHTML(prompt)}</p>
      </div>
    `;
  }
}

function downloadPNG() {
  let href = lastGeneratedImage;

  if (!href && canvasEl) {
    href = canvasEl.toDataURL("image/png");
  }

  if (!href) {
    alert("Generate an image first.");
    return;
  }

  const link = document.createElement("a");
  link.href = href;
  link.download = selectedType === "Pants" ? "ezzai-insane-pants.png" : "ezzai-insane-shirt.png";
  link.click();
}

/* ---------------------------------------
   PROMPT BRAIN
---------------------------------------- */

function parsePrompt(prompt) {
  const p = prompt.toLowerCase();
  const words = p.split(/[^a-z0-9]+/).filter(Boolean);

  const has = (...terms) => terms.some(term => p.includes(term));

  const style = {
    hoodie: has("hoodie", "zip", "zipper", "drawstring", "drawstrings"),
    shirt: has("shirt", "top", "sweater", "jumper") && !has("hoodie"),
    tee: has("tee", "tshirt", "t-shirt"),
    jeans: has("jeans", "denim"),
    cargo: has("cargo", "pockets", "utility"),
    joggers: has("jogger", "joggers", "sweatpants"),
    ripped: has("ripped", "rip", "rips", "distressed", "torn"),
    chains: has("chain", "chains", "silver chain"),
    stars: has("star", "stars"),
    skull: has("skull", "skeleton", "bones"),
    cross: has("cross", "crosses"),
    heart: has("heart", "hearts"),
    flame: has("flame", "flames", "fire"),
    lightning: has("lightning", "bolt", "electric"),
    cyber: has("cyber", "neon", "glow", "tech"),
    y2k: has("y2k", "2000s"),
    emo: has("emo", "dark", "sad"),
    grunge: has("grunge", "dirty", "punk"),
    goth: has("goth", "gothic"),
    skater: has("skater", "skate"),
    luxury: has("luxury", "premium", "designer"),
    camo: has("camo", "camouflage"),
    checker: has("checker", "checkered", "checkerboard"),
    stripes: has("stripe", "stripes", "striped"),
    money: has("money", "cash", "dollar"),
    galaxy: has("galaxy", "space", "starscape"),
    angel: has("angel", "wings"),
    devil: has("devil", "horns"),
    spider: has("spider", "web"),
    blood: has("blood", "bloody"),
    graffiti: has("graffiti", "tag", "spray"),
    minimal: has("minimal", "plain", "simple", "clean"),
    oversized: has("oversized", "baggy", "loose"),
  };

  const palette = getSmartPalette(p);
  const detailLevel = style.minimal ? 0.35 : (style.y2k || style.emo || style.grunge || style.cyber ? 0.8 : 0.55);

  return { raw: p, words, style, palette, detailLevel };
}

function getSmartPalette(p) {
  const palettes = {
    black: ["#06070a", "#111318", "#1f232c", "#e5e7eb"],
    grey: ["#0b0d10", "#262a31", "#777d89", "#e5e7eb"],
    gray: ["#0b0d10", "#262a31", "#777d89", "#e5e7eb"],
    white: ["#e5e7eb", "#f8fafc", "#a3a3a3", "#111827"],
    red: ["#120506", "#1f0a0c", "#dc2626", "#f8fafc"],
    blue: ["#050a18", "#0f172a", "#2563eb", "#dbeafe"],
    pink: ["#210617", "#3b0822", "#ec4899", "#fff1f2"],
    purple: ["#12051f", "#211032", "#a855f7", "#f5f3ff"],
    green: ["#03140b", "#052e16", "#22c55e", "#dcfce7"],
    orange: ["#1c0b05", "#431407", "#f97316", "#fff7ed"],
    yellow: ["#1f1700", "#422006", "#eab308", "#fefce8"],
    brown: ["#1c1008", "#3b2415", "#92400e", "#fef3c7"],
  };

  const found = Object.keys(palettes).filter(c => p.includes(c));

  if (found.length >= 2) {
    const a = palettes[found[0]];
    const b = palettes[found[1]];
    return {
      base: a[0],
      secondary: a[1],
      accent: b[2],
      highlight: b[3],
      alt: a[2],
      name: found.join("-"),
    };
  }

  if (found.length === 1) {
    const c = palettes[found[0]];
    return { base: c[0], secondary: c[1], accent: c[2], highlight: c[3], alt: c[2], name: found[0] };
  }

  return { base: "#06070a", secondary: "#111318", accent: "#7c3aed", highlight: "#e5e7eb", alt: "#38bdf8", name: "dark" };
}

/* ---------------------------------------
   ROBLOX PANELS
---------------------------------------- */

function getPanels() {
  return {
    torsoUp:    { x: 230, y: 8,   w: 128, h: 64, group: "torso", face: "up" },
    torsoRight: { x: 165, y: 74,  w: 64,  h: 128, group: "torso", face: "right" },
    torsoFront: { x: 230, y: 74,  w: 128, h: 128, group: "torso", face: "front" },
    torsoLeft:  { x: 360, y: 74,  w: 64,  h: 128, group: "torso", face: "left" },
    torsoBack:  { x: 426, y: 74,  w: 128, h: 128, group: "torso", face: "back" },
    torsoDown:  { x: 230, y: 204, w: 128, h: 64, group: "torso", face: "down" },

    rightL: { x: 18,  y: 356, w: 64, h: 128, group: "right", face: "left" },
    rightB: { x: 84,  y: 356, w: 64, h: 128, group: "right", face: "back" },
    rightR: { x: 150, y: 356, w: 64, h: 128, group: "right", face: "right" },
    rightF: { x: 216, y: 356, w: 64, h: 128, group: "right", face: "front" },
    rightU: { x: 216, y: 290, w: 64, h: 64, group: "right", face: "up" },
    rightD: { x: 216, y: 485, w: 64, h: 64, group: "right", face: "down" },

    leftU: { x: 308, y: 290, w: 64, h: 64, group: "left", face: "up" },
    leftF: { x: 308, y: 356, w: 64, h: 128, group: "left", face: "front" },
    leftL: { x: 374, y: 356, w: 64, h: 128, group: "left", face: "left" },
    leftB: { x: 440, y: 356, w: 64, h: 128, group: "left", face: "back" },
    leftR: { x: 506, y: 356, w: 64, h: 128, group: "left", face: "right" },
    leftD: { x: 308, y: 485, w: 64, h: 64, group: "left", face: "down" },
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

/* ---------------------------------------
   SHIRTS / HOODIES
---------------------------------------- */

function createSmartShirt(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const all = Object.values(p);

  // Base fabric
  all.forEach((panel, i) => {
    fillPanel(ctx, panel, brain.palette.base, 5);
    applyFabric(ctx, panel, brain, i);
    applyGlobalPattern(ctx, panel, brain, i);
    applyShade(ctx, panel, 0.16);
  });

  const isHoodie = brain.style.hoodie || !brain.style.shirt;

  if (isHoodie) {
    drawHoodie(ctx, p, brain);
  } else {
    drawPlainShirt(ctx, p, brain);
  }

  drawSleeves(ctx, p, brain, isHoodie);
  drawShirtExtras(ctx, p, brain);

  return canvas.toDataURL("image/png");
}

function drawHoodie(ctx, p, brain) {
  const c = brain.palette;

  // Front
  withClip(ctx, p.torsoFront, () => {
    // Side colour blocking
    if (brain.style.y2k || brain.style.cyber || c.name.includes("-")) {
      ctx.fillStyle = rgba(c.accent, 0.28);
      ctx.fillRect(p.torsoFront.x + 6, p.torsoFront.y + 6, 22, p.torsoFront.h - 12);
      ctx.fillRect(p.torsoFront.x + p.torsoFront.w - 28, p.torsoFront.y + 6, 22, p.torsoFront.h - 12);
    }

    // Zipper
    line(ctx, p.torsoFront.x + 64, p.torsoFront.y + 10, p.torsoFront.x + 64, p.torsoFront.y + 120, rgba(c.highlight, 0.28), 2);
    line(ctx, p.torsoFront.x + 68, p.torsoFront.y + 17, p.torsoFront.x + 68, p.torsoFront.y + 116, "rgba(0,0,0,0.45)", 1);

    // Hood collar
    ctx.strokeStyle = rgba(c.highlight, 0.24);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.torsoFront.x + 64, p.torsoFront.y + 20, 27, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();

    // Drawstrings
    line(ctx, p.torsoFront.x + 50, p.torsoFront.y + 31, p.torsoFront.x + 38, p.torsoFront.y + 76, rgba(c.highlight, 0.62), 2);
    line(ctx, p.torsoFront.x + 78, p.torsoFront.y + 31, p.torsoFront.x + 90, p.torsoFront.y + 76, rgba(c.highlight, 0.62), 2);

    // Pocket
    roundedRect(ctx, p.torsoFront.x + 24, p.torsoFront.y + 83, 80, 32, 8, "rgba(0,0,0,0.28)", rgba(c.highlight, 0.12));
  });

  // Back
  withClip(ctx, p.torsoBack, () => {
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(p.torsoBack.x + 14, p.torsoBack.y + 12, p.torsoBack.w - 28, p.torsoBack.h - 24);
    line(ctx, p.torsoBack.x + 12, p.torsoBack.y + 23, p.torsoBack.x + p.torsoBack.w - 12, p.torsoBack.y + 23, rgba(c.highlight, 0.12), 2);
  });

  // Sides
  [p.torsoLeft, p.torsoRight].forEach(side => {
    withClip(ctx, side, () => {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(side.x + side.w * 0.36, side.y, side.w * 0.28, side.h);
      line(ctx, side.x + side.w - 5, side.y + 6, side.x + side.w - 5, side.y + side.h - 6, rgba(c.highlight, 0.08));
    });
  });

  // Top and hem
  withClip(ctx, p.torsoUp, () => {
    ctx.fillStyle = rgba(c.accent, 0.14);
    ctx.fillRect(p.torsoUp.x, p.torsoUp.y, p.torsoUp.w, p.torsoUp.h * 0.45);
  });

  withClip(ctx, p.torsoDown, () => {
    ribbed(ctx, p.torsoDown, "rgba(0,0,0,0.42)", rgba(c.highlight, 0.06));
  });
}

function drawPlainShirt(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    // Neck
    ctx.strokeStyle = rgba(c.highlight, 0.18);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.torsoFront.x + 64, p.torsoFront.y + 13, 26, 0, Math.PI);
    ctx.stroke();

    // Shirt chest panel / subtle fold
    line(ctx, p.torsoFront.x + 12, p.torsoFront.y + 35, p.torsoFront.x + 116, p.torsoFront.y + 35, rgba(c.highlight, 0.08));
    line(ctx, p.torsoFront.x + 32, p.torsoFront.y + 16, p.torsoFront.x + 20, p.torsoFront.y + 120, "rgba(0,0,0,0.16)");
    line(ctx, p.torsoFront.x + 96, p.torsoFront.y + 16, p.torsoFront.x + 108, p.torsoFront.y + 120, "rgba(0,0,0,0.16)");

    if (brain.style.oversized) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(p.torsoFront.x + 6, p.torsoFront.y + 20, p.torsoFront.w - 12, p.torsoFront.h - 28);
    }
  });

  withClip(ctx, p.torsoBack, () => {
    line(ctx, p.torsoBack.x + 10, p.torsoBack.y + 22, p.torsoBack.x + p.torsoBack.w - 10, p.torsoBack.y + 22, rgba(c.highlight, 0.1), 2);
  });
}

function drawSleeves(ctx, p, brain, isHoodie) {
  const c = brain.palette;
  const sleeves = [p.rightF, p.rightB, p.rightL, p.rightR, p.leftF, p.leftB, p.leftL, p.leftR];

  sleeves.forEach((s, i) => {
    withClip(ctx, s, () => {
      line(ctx, s.x + 5, s.y + 6, s.x + 5, s.y + s.h - 6, rgba(c.highlight, 0.08));
      line(ctx, s.x + s.w - 5, s.y + 6, s.x + s.w - 5, s.y + s.h - 6, "rgba(0,0,0,0.2)");

      if (brain.style.y2k || brain.style.cyber || brain.raw.includes("grey") || brain.raw.includes("gray")) {
        ctx.fillStyle = rgba(c.accent, 0.25);
        ctx.fillRect(s.x + 7, s.y + 14, s.w - 14, 17);
        ctx.fillRect(s.x + 7, s.y + s.h - 36, s.w - 14, 17);
      }

      if (brain.style.flame && i % 4 === 0) drawFlames(ctx, s, c.highlight);
      if (brain.style.lightning && i % 3 === 0) drawLightning(ctx, s, c.accent);
      if (brain.style.stripes) drawStripes(ctx, s, c.accent, true);
    });
  });

  [p.rightU, p.leftU].forEach(panel => {
    withClip(ctx, panel, () => {
      ctx.fillStyle = rgba(c.accent, 0.12);
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    });
  });

  [p.rightD, p.leftD].forEach(panel => {
    withClip(ctx, panel, () => ribbed(ctx, panel, "rgba(0,0,0,0.40)", rgba(c.highlight, 0.07)));
  });
}

function drawShirtExtras(ctx, p, brain) {
  const c = brain.palette;

  // Front graphic
  withClip(ctx, p.torsoFront, () => {
    const centerX = p.torsoFront.x + 64;
    const centerY = p.torsoFront.y + 62;

    if (brain.style.skull) drawTextIcon(ctx, "☠", centerX, centerY, 34, c.highlight);
    if (brain.style.cross) drawTextIcon(ctx, "✝", centerX, centerY, 30, c.highlight);
    if (brain.style.heart) drawTextIcon(ctx, "♡", centerX, centerY, 32, c.highlight);
    if (brain.style.angel) drawTextIcon(ctx, "꒰ঌ ໒꒱", centerX, centerY, 18, c.highlight);
    if (brain.style.devil) drawTextIcon(ctx, "♆", centerX, centerY, 30, c.highlight);
    if (brain.style.money) drawTextIcon(ctx, "$", centerX, centerY, 34, c.highlight);
    if (brain.style.graffiti || brain.raw.includes("ezz")) drawGraffitiText(ctx, "EZZ", centerX, centerY, c.highlight);
  });

  // Back graphic can be bigger but only on back, not sleeves
  withClip(ctx, p.torsoBack, () => {
    const centerX = p.torsoBack.x + 64;
    const centerY = p.torsoBack.y + 64;
    if (brain.style.skull && !brain.style.minimal) drawTextIcon(ctx, "☠", centerX, centerY, 40, rgba(c.highlight, 0.7));
    if (brain.style.spider) drawTextIcon(ctx, "🕸", centerX, centerY, 35, rgba(c.highlight, 0.6));
  });

  // Overall graphics
  Object.values(p).forEach((panel, i) => {
    if (brain.style.stars && i % 2 === 0) drawSmallStars(ctx, panel, c.highlight);
    if (brain.style.checker && i % 3 === 0) drawChecker(ctx, panel, c.highlight);
  });
}

/* ---------------------------------------
   PANTS / JEANS
---------------------------------------- */

function createSmartPants(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();

  Object.values(p).forEach((panel, i) => {
    fillPanel(ctx, panel, brain.palette.base, 6);
    applyDenim(ctx, panel, brain, i);
    applyGlobalPattern(ctx, panel, brain, i);
    applyShade(ctx, panel, 0.12);
  });

  drawWaistband(ctx, p, brain);
  drawLegs(ctx, p, brain);
  drawPantsExtras(ctx, p, brain);

  return canvas.toDataURL("image/png");
}

function drawWaistband(ctx, p, brain) {
  const c = brain.palette;

  // Pants torso should only be waistband / hips, not full jean texture chaos
  [p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight].forEach((w, i) => {
    withClip(ctx, w, () => {
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(w.x - 2, w.y + 4, w.w + 4, 22);
      line(ctx, w.x, w.y + 28, w.x + w.w, w.y + 28, rgba(c.highlight, 0.14), 2);

      // belt loops
      for (let x = w.x + 10; x < w.x + w.w - 6; x += 28) {
        roundedRect(ctx, x, w.y + 6, 6, 22, 2, rgba(c.highlight, 0.10));
      }

      // zipper and button only on front
      if (i === 0) {
        line(ctx, w.x + w.w / 2, w.y + 30, w.x + w.w / 2, w.y + w.h - 8, rgba(c.highlight, 0.12), 2);
        roundedRect(ctx, w.x + w.w / 2 - 4, w.y + 11, 8, 8, 4, rgba(c.highlight, 0.45));
      }
    });
  });

  [p.torsoUp, p.torsoDown].forEach(w => {
    withClip(ctx, w, () => ribbed(ctx, w, "rgba(0,0,0,0.30)", rgba(c.highlight, 0.05)));
  });
}

function drawLegs(ctx, p, brain) {
  const c = brain.palette;

  const fronts = [p.rightF, p.leftF];
  const backs = [p.rightB, p.leftB];
  const sides = [p.rightL, p.rightR, p.leftL, p.leftR];

  fronts.forEach((leg, i) => {
    withClip(ctx, leg, () => {
      // inseam and outer seam
      line(ctx, leg.x + leg.w / 2, leg.y + 4, leg.x + leg.w / 2, leg.y + leg.h - 4, rgba(c.highlight, 0.09));
      line(ctx, leg.x + 5, leg.y + 4, leg.x + 5, leg.y + leg.h - 4, "rgba(0,0,0,0.22)");

      // front pocket curve
      ctx.strokeStyle = rgba(c.highlight, 0.18);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(leg.x + 16, leg.y + 24, 22, 0, Math.PI / 2);
      ctx.stroke();

      if (brain.style.ripped || brain.style.emo || brain.style.grunge) drawRips(ctx, leg, brain.style.minimal ? 1 : 3);
      if (brain.style.cargo) drawCargoPocket(ctx, leg, c);
    });
  });

  backs.forEach((leg) => {
    withClip(ctx, leg, () => {
      roundedRect(ctx, leg.x + 10, leg.y + 24, leg.w - 20, 34, 5, "rgba(0,0,0,0.24)", rgba(c.highlight, 0.12));
      line(ctx, leg.x + 16, leg.y + 40, leg.x + leg.w - 16, leg.y + 40, rgba(c.highlight, 0.10));
      if (brain.style.ripped && !brain.style.minimal) drawRips(ctx, leg, 2);
    });
  });

  sides.forEach((leg, i) => {
    withClip(ctx, leg, () => {
      line(ctx, leg.x + leg.w / 2, leg.y + 4, leg.x + leg.w / 2, leg.y + leg.h - 4, rgba(c.highlight, 0.12));
      if (brain.style.chains && i % 2 === 0) drawChain(ctx, leg, c.highlight);
      if (brain.style.cargo) drawCargoPocket(ctx, leg, c);
    });
  });

  [p.rightU, p.leftU].forEach(panel => {
    withClip(ctx, panel, () => {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    });
  });

  [p.rightD, p.leftD].forEach(panel => {
    withClip(ctx, panel, () => ribbed(ctx, panel, "rgba(0,0,0,0.42)", rgba(c.highlight, 0.06)));
  });
}

function drawPantsExtras(ctx, p, brain) {
  const c = brain.palette;
  Object.values(p).forEach((panel, i) => {
    if (panel.group === "torso") return; // keep pants torso clean except waistband

    if (brain.style.stars && i % 2 === 0) drawSmallStars(ctx, panel, c.highlight);
    if (brain.style.cross && i % 3 === 0) drawRepeatingSymbol(ctx, panel, "✝", c.highlight);
    if (brain.style.heart && i % 3 === 0) drawRepeatingSymbol(ctx, panel, "♡", c.highlight);
    if (brain.style.checker && i % 2 === 0) drawChecker(ctx, panel, c.highlight);
    if (brain.style.stripes) drawStripes(ctx, panel, c.accent, false);
  });
}

/* ---------------------------------------
   PATTERN ENGINE
---------------------------------------- */

function fillPanel(ctx, p, color, bleed = 4) {
  ctx.fillStyle = color;
  ctx.fillRect(p.x - bleed, p.y - bleed, p.w + bleed * 2, p.h + bleed * 2);
}

function withClip(ctx, p, callback, bleed = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x - bleed, p.y - bleed, p.w + bleed * 2, p.h + bleed * 2);
  ctx.clip();
  callback();
  ctx.restore();
}

function applyFabric(ctx, p, brain, index) {
  withClip(ctx, p, () => {
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;

    for (let y = p.y - 4; y < p.y + p.h + 4; y += 7) {
      ctx.beginPath();
      ctx.moveTo(p.x - 5, y);
      ctx.lineTo(p.x + p.w + 5, y + Math.sin((y + index) * 0.2) * 1.4);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    for (let x = p.x - 4; x < p.x + p.w + 4; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, p.y - 4);
      ctx.lineTo(x + Math.cos(x) * 1.5, p.y + p.h + 4);
      ctx.stroke();
    }
  });
}

function applyDenim(ctx, p, brain, index) {
  withClip(ctx, p, () => {
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;

    for (let y = p.y - 4; y < p.y + p.h + 4; y += 5) {
      ctx.beginPath();
      ctx.moveTo(p.x - 4, y);
      ctx.lineTo(p.x + p.w + 4, y + Math.sin((y + index) * 0.23) * 1.2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    for (let x = p.x - 4; x < p.x + p.w + 4; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, p.y - 4);
      ctx.lineTo(x + Math.sin(x) * 1.4, p.y + p.h + 4);
      ctx.stroke();
    }
  });
}

function applyShade(ctx, p, intensity = 0.15) {
  withClip(ctx, p, () => {
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
    grad.addColorStop(0.5, "rgba(255,255,255,0.015)");
    grad.addColorStop(1, `rgba(0,0,0,${intensity + 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  });
}

function applyGlobalPattern(ctx, p, brain, i) {
  if (brain.style.camo) drawCamo(ctx, p, brain.palette);
  if (brain.style.galaxy) drawGalaxy(ctx, p, brain.palette);
  if (brain.style.blood) drawBlood(ctx, p);
  if (brain.style.spider) drawWeb(ctx, p, brain.palette.highlight);
  if (brain.style.cyber) drawCyberLines(ctx, p, brain.palette.accent);
}

function drawCamo(ctx, p, c) {
  withClip(ctx, p, () => {
    const colors = [rgba(c.secondary, 0.55), rgba(c.accent, 0.25), "rgba(0,0,0,0.25)"];
    for (let n = 0; n < 8; n++) {
      ctx.fillStyle = colors[n % colors.length];
      ctx.beginPath();
      const x = p.x + ((n * 23) % p.w);
      const y = p.y + ((n * 31) % p.h);
      ctx.ellipse(x, y, 18 + (n % 3) * 8, 9 + (n % 2) * 8, n, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawGalaxy(ctx, p, c) {
  withClip(ctx, p, () => {
    ctx.fillStyle = rgba(c.accent, 0.16);
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w * 0.45, p.h * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba(c.highlight, 0.8);
    for (let n = 0; n < 12; n++) {
      ctx.fillRect(p.x + (n * 17) % p.w, p.y + (n * 29) % p.h, 1.5, 1.5);
    }
  });
}

function drawBlood(ctx, p) {
  withClip(ctx, p, () => {
    ctx.fillStyle = "rgba(185,28,28,0.55)";
    for (let n = 0; n < 5; n++) {
      const x = p.x + 8 + (n * 13) % Math.max(10, p.w - 16);
      const y = p.y + 8 + (n * 25) % Math.max(10, p.h - 16);
      ctx.beginPath();
      ctx.arc(x, y, 4 + n % 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 1, y, 2, 14 + n * 3);
    }
  });
}

function drawWeb(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.strokeStyle = rgba(color, 0.22);
    ctx.lineWidth = 1;
    const cx = p.x + p.w - 8;
    const cy = p.y + 8;
    for (let a = 0; a < Math.PI; a += Math.PI / 5) {
      line(ctx, cx, cy, cx - Math.cos(a) * p.w, cy + Math.sin(a) * p.h, rgba(color, 0.22), 1);
    }
    for (let r = 12; r < Math.max(p.w, p.h); r += 12) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI / 2, Math.PI);
      ctx.stroke();
    }
  });
}

function drawCyberLines(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.strokeStyle = rgba(color, 0.35);
    ctx.lineWidth = 1.5;
    for (let n = 0; n < 4; n++) {
      const y = p.y + 12 + n * 27;
      line(ctx, p.x + 6, y, p.x + p.w - 6, y + ((n % 2) ? 8 : -4), rgba(color, 0.28), 1.5);
    }
  });
}

/* ---------------------------------------
   GRAPHIC HELPERS
---------------------------------------- */

function drawRips(ctx, p, count = 3) {
  withClip(ctx, p, () => {
    for (let n = 0; n < count; n++) {
      const y = p.y + 38 + n * 28;
      ctx.strokeStyle = "rgba(245,245,245,0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 8, y);
      ctx.bezierCurveTo(p.x + 20, y - 8, p.x + 42, y + 8, p.x + p.w - 8, y - 4);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.58)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x + 12, y + 4);
      ctx.bezierCurveTo(p.x + 24, y - 2, p.x + 42, y + 8, p.x + p.w - 12, y + 1);
      ctx.stroke();
    }
  });
}

function drawCargoPocket(ctx, p, c) {
  roundedRect(ctx, p.x + 10, p.y + 62, p.w - 20, 34, 4, "rgba(0,0,0,0.24)", rgba(c.highlight, 0.14));
  line(ctx, p.x + 13, p.y + 74, p.x + p.w - 13, p.y + 74, rgba(c.highlight, 0.08));
}

function drawChain(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.strokeStyle = rgba(color, 0.75);
    ctx.lineWidth = 2;
    for (let y = p.y + 14; y < p.y + p.h - 8; y += 12) {
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, y, 7, 4, Math.PI / 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawSmallStars(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = rgba(color, 0.85);
    for (let i = 0; i < 4; i++) {
      ctx.fillText("★", p.x + 8 + (i * 17) % Math.max(18, p.w - 18), p.y + 24 + i * 25);
    }
  });
}

function drawChecker(ctx, p, color) {
  withClip(ctx, p, () => {
    const size = 10;
    for (let y = p.y - 4; y < p.y + p.h + 4; y += size) {
      for (let x = p.x - 4; x < p.x + p.w + 4; x += size) {
        if (((x + y) / size) % 2 < 1) {
          ctx.fillStyle = rgba(color, 0.18);
          ctx.fillRect(x, y, size, size);
        }
      }
    }
  });
}

function drawStripes(ctx, p, color, horizontal = false) {
  withClip(ctx, p, () => {
    ctx.fillStyle = rgba(color, 0.24);
    if (horizontal) {
      for (let y = p.y + 10; y < p.y + p.h; y += 24) ctx.fillRect(p.x - 2, y, p.w + 4, 7);
    } else {
      for (let x = p.x + 8; x < p.x + p.w; x += 22) ctx.fillRect(x, p.y - 2, 7, p.h + 4);
    }
  });
}

function drawRepeatingSymbol(ctx, p, symbol, color) {
  withClip(ctx, p, () => {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = rgba(color, 0.55);
    for (let i = 0; i < 3; i++) ctx.fillText(symbol, p.x + 12 + i * 17, p.y + 32 + i * 28);
  });
}

function drawFlames(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.fillStyle = rgba(color, 0.75);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const x = p.x + 16 + i * 14;
      const y = p.y + p.h - 18;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 8, y - 18, x + 2, y - 34);
      ctx.quadraticCurveTo(x + 12, y - 16, x, y);
      ctx.fill();
    }
  });
}

function drawLightning(ctx, p, color) {
  withClip(ctx, p, () => {
    ctx.fillStyle = rgba(color, 0.72);
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2 + 4, p.y + 16);
    ctx.lineTo(p.x + p.w / 2 - 9, p.y + 62);
    ctx.lineTo(p.x + p.w / 2 + 5, p.y + 62);
    ctx.lineTo(p.x + p.w / 2 - 5, p.y + 112);
    ctx.lineTo(p.x + p.w / 2 + 17, p.y + 52);
    ctx.lineTo(p.x + p.w / 2 + 4, p.y + 52);
    ctx.closePath();
    ctx.fill();
  });
}

function drawTextIcon(ctx, icon, x, y, size, color) {
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(icon, x, y);
}

function drawGraffitiText(ctx, text, x, y, color) {
  ctx.font = "900 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.08);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function ribbed(ctx, p, fill, lineColor) {
  ctx.fillStyle = fill;
  ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  for (let x = p.x + 4; x < p.x + p.w; x += 10) {
    line(ctx, x, p.y + 3, x, p.y + p.h - 3, lineColor, 1);
  }
}

function line(ctx, x1, y1, x2, y2, color = "rgba(255,255,255,0.2)", width = 1) {
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

function rgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (Number.isNaN(bigint)) return `rgba(255,255,255,${alpha})`;
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

// If this is the local canvas version, show a starter preview.
if (canvasEl && promptInput) {
  promptInput.value ||= "black grey y2k hoodie with skull and chains";
  selectedType = "Shirt";
  lastGeneratedImage = createSmartShirt(promptInput.value);
  const img = new Image();
  img.onload = () => {
    canvasEl.getContext("2d").clearRect(0, 0, 585, 559);
    canvasEl.getContext("2d").drawImage(img, 0, 0);
  };
  img.src = lastGeneratedImage;
}


/* =======================================
   EZZAI MULTI-TOP EXPANSION OVERRIDE
   Supports shirts, hoodies, jackets,
   tank tops, baby tees, crop tops,
   and feminine / girl clothing.
======================================= */

function parsePrompt(prompt) {
  const p = String(prompt || '').toLowerCase();
  const words = p.split(/[^a-z0-9]+/).filter(Boolean);
  const has = (...terms) => terms.some(term => p.includes(term));

  const style = {
    hoodie: has('hoodie', 'hoodie zip', 'zip hoodie', 'pullover hoodie', 'drawstring', 'drawstrings'),
    jacket: has('jacket', 'zip up', 'zip-up', 'bomber', 'varsity', 'puffer', 'windbreaker', 'track jacket'),
    shirt: has('shirt', 'top', 'sweater', 'jumper') && !has('hoodie', 'jacket', 'tank', 'crop top', 'baby tee'),
    tee: has('tee', 'tshirt', 't-shirt'),
    longsleeve: has('long sleeve', 'longsleeve'),
    tank: has('tank', 'tank top', 'vest top', 'sleeveless', 'cami', 'camisole', 'halter'),
    crop: has('crop', 'cropped', 'crop top'),
    babytee: has('baby tee', 'babyt', 'babyt', 'baby tee'),
    girl: has('girl', 'girls', 'female', 'woman', 'women', 'girly', 'feminine', 'cute', 'soft girl', 'coquette', 'princess', 'dolly'),
    coquette: has('coquette', 'lace', 'bow', 'bows', 'ribbon', 'ribbons', 'princess'),
    jeans: has('jeans', 'denim'),
    cargo: has('cargo', 'pockets', 'utility'),
    joggers: has('jogger', 'joggers', 'sweatpants'),
    ripped: has('ripped', 'rip', 'rips', 'distressed', 'torn'),
    chains: has('chain', 'chains', 'silver chain'),
    stars: has('star', 'stars'),
    skull: has('skull', 'skeleton', 'bones'),
    cross: has('cross', 'crosses'),
    heart: has('heart', 'hearts'),
    flame: has('flame', 'flames', 'fire'),
    lightning: has('lightning', 'bolt', 'electric'),
    cyber: has('cyber', 'neon', 'glow', 'tech'),
    y2k: has('y2k', '2000s'),
    emo: has('emo', 'dark', 'sad'),
    grunge: has('grunge', 'dirty', 'punk'),
    goth: has('goth', 'gothic'),
    skater: has('skater', 'skate'),
    luxury: has('luxury', 'premium', 'designer'),
    camo: has('camo', 'camouflage'),
    checker: has('checker', 'checkered', 'checkerboard'),
    stripes: has('stripe', 'stripes', 'striped'),
    money: has('money', 'cash', 'dollar'),
    galaxy: has('galaxy', 'space', 'starscape'),
    angel: has('angel', 'wings'),
    devil: has('devil', 'horns'),
    spider: has('spider', 'web'),
    blood: has('blood', 'bloody'),
    graffiti: has('graffiti', 'tag', 'spray'),
    minimal: has('minimal', 'plain', 'simple', 'clean', 'basic'),
    oversized: has('oversized', 'baggy', 'loose'),
    blackwhite: (has('black and white', 'black & white', 'monochrome') || (has('black') && has('white'))),
  };

  const palette = getSmartPalette(p);
  const detailLevel = style.minimal ? 0.35 : (style.y2k || style.emo || style.grunge || style.cyber || style.girl ? 0.85 : 0.6);
  return { raw: p, words, style, palette, detailLevel };
}

function getTopVariant(brain) {
  if (brain.style.jacket) return 'jacket';
  if (brain.style.hoodie) return 'hoodie';
  if (brain.style.tank) return 'tank';
  if (brain.style.crop && brain.style.girl) return 'girlcrop';
  if (brain.style.crop) return 'crop';
  if (brain.style.babytee || (brain.style.girl && brain.style.tee)) return 'babytee';
  if (brain.style.girl) return 'girltop';
  if (brain.style.longsleeve) return 'longsleeve';
  if (brain.style.tee) return 'tee';
  return 'shirt';
}

function createSmartShirt(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const variant = getTopVariant(brain);

  if (variant === 'hoodie') {
    // full template fill for hoodie
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawHoodie(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, variant);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL('image/png');
  }

  if (variant === 'jacket') {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawJacket(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, variant);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL('image/png');
  }

  if (variant === 'tank') {
    drawTankTop(ctx, p, brain);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL('image/png');
  }

  if (variant === 'crop' || variant === 'girlcrop' || variant === 'babytee' || variant === 'girltop') {
    drawGirlTop(ctx, p, brain, variant);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL('image/png');
  }

  // tee / shirt / longsleeve
  Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  drawPlainShirt(ctx, p, brain);
  drawSleeves(ctx, p, brain, variant === 'longsleeve', variant);
  drawShirtExtras(ctx, p, brain, variant);
  return canvas.toDataURL('image/png');
}

function renderFullPanelMaterial(ctx, panel, brain, denim = false, index = 0) {
  fillPanel(ctx, panel, brain.palette.base, 5);
  if (denim) applyDenim(ctx, panel, brain, index); else applyFabric(ctx, panel, brain, index);
  applyGlobalPattern(ctx, panel, brain, index);
  applyShade(ctx, panel, denim ? 0.12 : 0.16);
}

function renderPartialPanelMaterial(ctx, panel, brain, opts = {}) {
  const { fromY = 0, toY = 1, denim = false, index = 0 } = opts;
  const y = panel.y + panel.h * fromY;
  const h = panel.h * (toY - fromY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x - 2, y - 2, panel.w + 4, h + 4);
  ctx.clip();
  fillPanel(ctx, panel, brain.palette.base, 5);
  if (denim) applyDenim(ctx, panel, brain, index); else applyFabric(ctx, panel, brain, index);
  applyGlobalPattern(ctx, panel, brain, index);
  applyShade(ctx, panel, denim ? 0.12 : 0.16);
  ctx.restore();
}

function clearPanel(ctx, panel) {
  ctx.clearRect(panel.x - 6, panel.y - 6, panel.w + 12, panel.h + 12);
}

function drawJacket(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    // Open center zip / placket
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(p.torsoFront.x + 58, p.torsoFront.y + 2, 12, p.torsoFront.h + 2);
    line(ctx, p.torsoFront.x + 64, p.torsoFront.y + 6, p.torsoFront.x + 64, p.torsoFront.y + 122, rgba(c.highlight, 0.32), 2);

    // Lapels/collar
    ctx.fillStyle = rgba(c.highlight, 0.07);
    ctx.beginPath();
    ctx.moveTo(p.torsoFront.x + 18, p.torsoFront.y + 12);
    ctx.lineTo(p.torsoFront.x + 50, p.torsoFront.y + 12);
    ctx.lineTo(p.torsoFront.x + 38, p.torsoFront.y + 42);
    ctx.lineTo(p.torsoFront.x + 20, p.torsoFront.y + 32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.torsoFront.x + 110, p.torsoFront.y + 12);
    ctx.lineTo(p.torsoFront.x + 78, p.torsoFront.y + 12);
    ctx.lineTo(p.torsoFront.x + 90, p.torsoFront.y + 42);
    ctx.lineTo(p.torsoFront.x + 108, p.torsoFront.y + 32);
    ctx.closePath();
    ctx.fill();

    // Pockets
    roundedRect(ctx, p.torsoFront.x + 14, p.torsoFront.y + 84, 28, 22, 4, 'rgba(0,0,0,0.25)', rgba(c.highlight, 0.10));
    roundedRect(ctx, p.torsoFront.x + 86, p.torsoFront.y + 84, 28, 22, 4, 'rgba(0,0,0,0.25)', rgba(c.highlight, 0.10));

    if (brain.style.varsity || brain.style.luxury || brain.style.y2k) {
      ctx.fillStyle = rgba(c.accent, 0.28);
      ctx.fillRect(p.torsoFront.x + 7, p.torsoFront.y + 7, 18, p.torsoFront.h - 14);
      ctx.fillRect(p.torsoFront.x + p.torsoFront.w - 25, p.torsoFront.y + 7, 18, p.torsoFront.h - 14);
    }
  });

  withClip(ctx, p.torsoBack, () => {
    line(ctx, p.torsoBack.x + 10, p.torsoBack.y + 18, p.torsoBack.x + p.torsoBack.w - 10, p.torsoBack.y + 18, rgba(c.highlight, 0.1), 2);
    line(ctx, p.torsoBack.x + 10, p.torsoBack.y + 42, p.torsoBack.x + p.torsoBack.w - 10, p.torsoBack.y + 42, rgba(c.highlight, 0.08), 1);
  });

  [p.torsoUp, p.torsoDown].forEach(panel => {
    withClip(ctx, panel, () => {
      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      if (panel === p.torsoDown) ribbed(ctx, panel, 'rgba(0,0,0,0.38)', rgba(c.highlight, 0.06));
    });
  });
}

function drawTankTop(ctx, p, brain) {
  const c = brain.palette;
  // Fill torso only
  [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoDown].forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));

  // Clear arms for sleeveless look
  [p.rightL, p.rightB, p.rightR, p.rightF, p.rightU, p.rightD, p.leftL, p.leftB, p.leftR, p.leftF, p.leftU, p.leftD].forEach(panel => clearPanel(ctx, panel));

  withClip(ctx, p.torsoFront, () => {
    // neck cut
    ctx.clearRect(p.torsoFront.x + 36, p.torsoFront.y + 2, 56, 20);
    ctx.fillStyle = brain.style.girl || brain.style.coquette ? rgba(c.highlight, 0.08) : rgba(c.highlight, 0.03);
    ctx.fillRect(p.torsoFront.x + 10, p.torsoFront.y + 6, 18, 26);
    ctx.fillRect(p.torsoFront.x + 100, p.torsoFront.y + 6, 18, 26);
    ctx.clearRect(p.torsoFront.x + 0, p.torsoFront.y + 0, 10, 38);
    ctx.clearRect(p.torsoFront.x + 118, p.torsoFront.y + 0, 10, 38);
    line(ctx, p.torsoFront.x + 30, p.torsoFront.y + 28, p.torsoFront.x + 98, p.torsoFront.y + 28, rgba(c.highlight, 0.12), 2);
  });

  withClip(ctx, p.torsoBack, () => {
    ctx.clearRect(p.torsoBack.x + 34, p.torsoBack.y + 2, 60, 18);
    ctx.clearRect(p.torsoBack.x + 0, p.torsoBack.y + 0, 10, 38);
    ctx.clearRect(p.torsoBack.x + 118, p.torsoBack.y + 0, 10, 38);
    line(ctx, p.torsoBack.x + 30, p.torsoBack.y + 26, p.torsoBack.x + 98, p.torsoBack.y + 26, rgba(c.highlight, 0.12), 2);
  });

  if (brain.style.coquette || brain.style.girl || brain.style.heart) {
    withClip(ctx, p.torsoFront, () => {
      drawTextIcon(ctx, '♡', p.torsoFront.x + 64, p.torsoFront.y + 58, 24, c.highlight);
    });
  }
}

function drawGirlTop(ctx, p, brain, variant) {
  const c = brain.palette;
  const shortSleeve = variant === 'babytee' || variant === 'girltop' || variant === 'crop' || variant === 'girlcrop' || variant === 'tee' || variant === 'shirt';

  // torso fill
  [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoDown].forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));

  // sleeves: short sleeves only upper half for baby tees / crop tops / girly tops
  const armPanels = [p.rightL, p.rightB, p.rightR, p.rightF, p.leftL, p.leftB, p.leftR, p.leftF];
  armPanels.forEach((panel, i) => {
    if (shortSleeve) renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 0.38, denim: false, index: i });
    else renderFullPanelMaterial(ctx, panel, brain, false, i);
  });

  // top/bottom arm caps
  [p.rightU, p.leftU].forEach((panel, i) => renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 1, index: i }));
  // no sleeve cuffs on short sleeves

  // Crop effect
  if (variant === 'crop' || variant === 'girlcrop') {
    [p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight].forEach(panel => {
      ctx.clearRect(panel.x - 2, panel.y + panel.h * 0.72, panel.w + 4, panel.h * 0.32);
    });
    ctx.clearRect(p.torsoDown.x - 2, p.torsoDown.y - 2, p.torsoDown.w + 4, p.torsoDown.h + 4);
    withClip(ctx, p.torsoFront, () => line(ctx, p.torsoFront.x + 10, p.torsoFront.y + 94, p.torsoFront.x + 118, p.torsoFront.y + 94, rgba(c.highlight, 0.18), 2));
  }

  // neckline and feminine details
  withClip(ctx, p.torsoFront, () => {
    ctx.clearRect(p.torsoFront.x + 40, p.torsoFront.y + 0, 48, 14);
    line(ctx, p.torsoFront.x + 28, p.torsoFront.y + 16, p.torsoFront.x + 100, p.torsoFront.y + 16, rgba(c.highlight, 0.12), 2);
    if (brain.style.coquette || brain.style.girl) {
      drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 44, c.highlight, c.accent);
      line(ctx, p.torsoFront.x + 18, p.torsoFront.y + 24, p.torsoFront.x + 110, p.torsoFront.y + 24, rgba(c.highlight, 0.10), 1);
      line(ctx, p.torsoFront.x + 18, p.torsoFront.y + 28, p.torsoFront.x + 110, p.torsoFront.y + 28, rgba(c.highlight, 0.07), 1);
    }
  });

  withClip(ctx, p.torsoBack, () => {
    ctx.clearRect(p.torsoBack.x + 42, p.torsoBack.y + 0, 44, 12);
  });
}

function drawSleeves(ctx, p, brain, fullSleeve = false, variant = 'hoodie') {
  const c = brain.palette;
  const sleeves = [p.rightF, p.rightB, p.rightL, p.rightR, p.leftF, p.leftB, p.leftL, p.leftR];

  sleeves.forEach((s, i) => {
    withClip(ctx, s, () => {
      line(ctx, s.x + 5, s.y + 6, s.x + 5, s.y + s.h - 6, rgba(c.highlight, 0.08));
      line(ctx, s.x + s.w - 5, s.y + 6, s.x + s.w - 5, s.y + s.h - 6, 'rgba(0,0,0,0.2)');

      if (brain.style.y2k || brain.style.cyber || brain.raw.includes('grey') || brain.raw.includes('gray')) {
        ctx.fillStyle = rgba(c.accent, 0.22);
        ctx.fillRect(s.x + 7, s.y + 14, s.w - 14, 14);
        if (fullSleeve) ctx.fillRect(s.x + 7, s.y + s.h - 34, s.w - 14, 14);
      }

      if (brain.style.flame && i % 4 === 0) drawFlames(ctx, s, c.highlight);
      if (brain.style.lightning && i % 3 === 0) drawLightning(ctx, s, c.accent);
      if (brain.style.stripes) drawStripes(ctx, s, c.accent, true);
    });
  });

  [p.rightU, p.leftU].forEach(panel => {
    withClip(ctx, panel, () => {
      ctx.fillStyle = rgba(c.accent, 0.12);
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    });
  });

  if (fullSleeve) {
    [p.rightD, p.leftD].forEach(panel => {
      withClip(ctx, panel, () => ribbed(ctx, panel, 'rgba(0,0,0,0.40)', rgba(c.highlight, 0.07)));
    });
  }
}

function drawShirtExtras(ctx, p, brain, variant = 'shirt') {
  const c = brain.palette;
  const frontCenterX = p.torsoFront.x + 64;
  const frontCenterY = variant === 'crop' || variant === 'girlcrop' ? p.torsoFront.y + 46 : p.torsoFront.y + 62;

  withClip(ctx, p.torsoFront, () => {
    if (brain.style.skull) drawTextIcon(ctx, '☠', frontCenterX, frontCenterY, variant === 'tank' ? 26 : 34, c.highlight);
    if (brain.style.cross) drawTextIcon(ctx, '✝', frontCenterX, frontCenterY, 30, c.highlight);
    if (brain.style.heart) drawTextIcon(ctx, '♡', frontCenterX, frontCenterY, 32, c.highlight);
    if (brain.style.angel) drawTextIcon(ctx, '꒰ঌ ໒꒱', frontCenterX, frontCenterY, 18, c.highlight);
    if (brain.style.devil) drawTextIcon(ctx, '♆', frontCenterX, frontCenterY, 30, c.highlight);
    if (brain.style.money) drawTextIcon(ctx, '$', frontCenterX, frontCenterY, 34, c.highlight);
    if (brain.style.graffiti || brain.raw.includes('ezz')) drawGraffitiText(ctx, 'EZZ', frontCenterX, frontCenterY, c.highlight);
    if (brain.style.coquette) drawBow(ctx, frontCenterX, frontCenterY + 16, c.highlight, c.accent);
  });

  withClip(ctx, p.torsoBack, () => {
    const centerX = p.torsoBack.x + 64;
    const centerY = p.torsoBack.y + 64;
    if (brain.style.skull && !brain.style.minimal) drawTextIcon(ctx, '☠', centerX, centerY, 40, rgba(c.highlight, 0.7));
    if (brain.style.spider) drawTextIcon(ctx, '🕸', centerX, centerY, 35, rgba(c.highlight, 0.6));
  });

  Object.values(p).forEach((panel, i) => {
    if (variant === 'tank' && panel.group !== 'torso') return;
    if ((variant === 'crop' || variant === 'girlcrop') && panel === p.torsoDown) return;
    if (brain.style.stars && i % 2 === 0) drawSmallStars(ctx, panel, c.highlight);
    if (brain.style.checker && i % 3 === 0) drawChecker(ctx, panel, c.highlight);
  });
}

function drawBow(ctx, x, y, color, accent) {
  ctx.save();
  ctx.fillStyle = rgba(accent || color, 0.6);
  ctx.beginPath();
  ctx.ellipse(x - 10, y, 10, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 10, y, 10, 7, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* =======================================
   EZZAI V3 MORE CLOTHING TYPES
   Adds bikini, corset, dress top, jersey,
   school uniform, tactical, suit, shorts,
   skirt, leggings, plaid and quick chips.
======================================= */

function v3HasPrompt(brain, ...terms) {
  return terms.some(term => brain.raw.includes(term));
}

const oldParsePromptV3 = parsePrompt;
parsePrompt = function(prompt) {
  const brain = oldParsePromptV3(prompt);
  const p = brain.raw;
  const has = (...terms) => terms.some(term => p.includes(term));

  brain.style.bikini = has("bikini", "swimwear", "swimsuit", "beach top", "swim top");
  brain.style.corset = has("corset", "lace up", "lace-up", "bodice");
  brain.style.dress = has("dress", "gown", "princess dress", "party dress");
  brain.style.jersey = has("jersey", "football shirt", "soccer shirt", "sports top", "basketball");
  brain.style.uniform = has("uniform", "school uniform", "academy", "preppy");
  brain.style.tactical = has("tactical", "combat", "army", "military");
  brain.style.suit = has("suit", "blazer", "formal", "tie");
  brain.style.shorts = has("shorts", "short", "jorts");
  brain.style.skirt = has("skirt", "mini skirt", "pleated skirt");
  brain.style.leggings = has("leggings", "yoga pants", "tights");
  brain.style.plaid = has("plaid", "tartan");
  brain.style.flower = has("flower", "flowers", "floral");
  brain.style.butterfly = has("butterfly", "butterflies");
  brain.style.bow = has("bow", "bows", "ribbon", "ribbons");

  return brain;
};

const oldGetTopVariantV3 = getTopVariant;
getTopVariant = function(brain) {
  if (brain.style.bikini) return "bikini";
  if (brain.style.corset) return "corset";
  if (brain.style.dress) return "dress";
  if (brain.style.jersey) return "jersey";
  if (brain.style.uniform) return "uniform";
  if (brain.style.tactical) return "tactical";
  if (brain.style.suit) return "suit";
  return oldGetTopVariantV3(brain);
};

createSmartShirt = function(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const variant = getTopVariant(brain);

  if (variant === "bikini") {
    drawV3Bikini(ctx, p, brain);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "corset") {
    drawV3Corset(ctx, p, brain);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "dress") {
    drawV3DressTop(ctx, p, brain);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "jersey") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV3Jersey(ctx, p, brain);
    drawSleeves(ctx, p, brain, false, variant);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "uniform") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV3SchoolUniform(ctx, p, brain);
    drawSleeves(ctx, p, brain, false, variant);
    drawShirtExtras(ctx, p, brain, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "tactical") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV3Tactical(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, variant);
    return canvas.toDataURL("image/png");
  }

  if (variant === "suit") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV3Suit(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, variant);
    return canvas.toDataURL("image/png");
  }

  // Fall back to previous multi-design logic.
  const oldVariant = oldGetTopVariantV3(brain);

  if (oldVariant === "hoodie") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawHoodie(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, oldVariant);
    drawShirtExtras(ctx, p, brain, oldVariant);
    return canvas.toDataURL("image/png");
  }

  if (oldVariant === "jacket") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawJacket(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, oldVariant);
    drawShirtExtras(ctx, p, brain, oldVariant);
    return canvas.toDataURL("image/png");
  }

  if (oldVariant === "tank") {
    drawTankTop(ctx, p, brain);
    drawShirtExtras(ctx, p, brain, oldVariant);
    return canvas.toDataURL("image/png");
  }

  if (oldVariant === "crop" || oldVariant === "girlcrop" || oldVariant === "babytee" || oldVariant === "girltop") {
    drawGirlTop(ctx, p, brain, oldVariant);
    drawShirtExtras(ctx, p, brain, oldVariant);
    return canvas.toDataURL("image/png");
  }

  Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  drawPlainShirt(ctx, p, brain);
  drawSleeves(ctx, p, brain, oldVariant === "longsleeve", oldVariant);
  drawShirtExtras(ctx, p, brain, oldVariant);
  return canvas.toDataURL("image/png");
};

function v3ClearMany(ctx, panels) {
  panels.forEach(panel => clearPanel(ctx, panel));
}

function drawV3Bikini(ctx, p, brain) {
  const c = brain.palette;
  const torso = [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight];
  torso.forEach((panel, i) => renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0.05, toY: 0.70, index: i }));

  v3ClearMany(ctx, [p.torsoDown, p.rightL, p.rightB, p.rightR, p.rightF, p.rightU, p.rightD, p.leftL, p.leftB, p.leftR, p.leftF, p.leftU, p.leftD]);

  withClip(ctx, p.torsoFront, () => {
    ctx.clearRect(p.torsoFront.x + 4, p.torsoFront.y + 74, p.torsoFront.w - 8, 54);
    ctx.fillStyle = c.base;
    ctx.beginPath(); ctx.ellipse(p.torsoFront.x + 42, p.torsoFront.y + 55, 25, 20, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.torsoFront.x + 86, p.torsoFront.y + 55, 25, 20, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(c.highlight, 0.55); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.torsoFront.x + 42, p.torsoFront.y + 55, 25, 20, -0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.torsoFront.x + 86, p.torsoFront.y + 55, 25, 20, 0.25, 0, Math.PI * 2); ctx.stroke();
    line(ctx, p.torsoFront.x + 42, p.torsoFront.y + 36, p.torsoFront.x + 30, p.torsoFront.y + 8, rgba(c.highlight, 0.48), 2);
    line(ctx, p.torsoFront.x + 86, p.torsoFront.y + 36, p.torsoFront.x + 98, p.torsoFront.y + 8, rgba(c.highlight, 0.48), 2);
    if (brain.style.bow || brain.style.coquette || brain.style.girl) drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 56, c.highlight, c.accent);
  });

  withClip(ctx, p.torsoBack, () => {
    ctx.clearRect(p.torsoBack.x + 8, p.torsoBack.y + 72, p.torsoBack.w - 16, 56);
    line(ctx, p.torsoBack.x + 18, p.torsoBack.y + 49, p.torsoBack.x + 110, p.torsoBack.y + 49, rgba(c.highlight, 0.45), 3);
  });
}

function drawV3Corset(ctx, p, brain) {
  const c = brain.palette;
  [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoDown].forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  if (!brain.style.longsleeve) v3ClearMany(ctx, [p.rightL,p.rightB,p.rightR,p.rightF,p.rightU,p.rightD,p.leftL,p.leftB,p.leftR,p.leftF,p.leftU,p.leftD]);

  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.moveTo(p.torsoFront.x + 22, p.torsoFront.y + 8);
    ctx.lineTo(p.torsoFront.x + 106, p.torsoFront.y + 8);
    ctx.lineTo(p.torsoFront.x + 92, p.torsoFront.y + 118);
    ctx.lineTo(p.torsoFront.x + 36, p.torsoFront.y + 118);
    ctx.closePath(); ctx.fill();

    line(ctx, p.torsoFront.x + 64, p.torsoFront.y + 12, p.torsoFront.x + 64, p.torsoFront.y + 116, rgba(c.highlight,0.28), 2);
    for (let y = p.torsoFront.y + 22; y < p.torsoFront.y + 108; y += 16) {
      line(ctx, p.torsoFront.x + 50, y, p.torsoFront.x + 78, y + 10, rgba(c.highlight, 0.55), 1.5);
      line(ctx, p.torsoFront.x + 78, y, p.torsoFront.x + 50, y + 10, rgba(c.highlight, 0.55), 1.5);
    }
    if (brain.style.bow || brain.style.coquette || brain.style.girl) drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 18, c.highlight, c.accent);
  });
}

function drawV3DressTop(ctx, p, brain) {
  const c = brain.palette;
  [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoDown].forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  [p.rightL,p.rightB,p.rightR,p.rightF,p.leftL,p.leftB,p.leftR,p.leftF].forEach((panel, i) => renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 0.33, index: i }));

  withClip(ctx, p.torsoFront, () => {
    ctx.clearRect(p.torsoFront.x + 36, p.torsoFront.y, 56, 14);
    line(ctx, p.torsoFront.x + 28, p.torsoFront.y + 20, p.torsoFront.x + 100, p.torsoFront.y + 20, rgba(c.highlight, 0.22), 2);
    ctx.fillStyle = rgba(c.accent, 0.20);
    ctx.beginPath();
    ctx.moveTo(p.torsoFront.x + 30, p.torsoFront.y + 68);
    ctx.lineTo(p.torsoFront.x + 98, p.torsoFront.y + 68);
    ctx.lineTo(p.torsoFront.x + 120, p.torsoFront.y + 126);
    ctx.lineTo(p.torsoFront.x + 8, p.torsoFront.y + 126);
    ctx.closePath(); ctx.fill();
    if (brain.style.bow || brain.style.coquette || brain.style.girl) drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 44, c.highlight, c.accent);
  });
}

function drawV3Jersey(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.strokeStyle = rgba(c.highlight,0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 42, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 35); ctx.lineTo(p.torsoFront.x + 86, p.torsoFront.y + 8); ctx.stroke();
    ctx.font = "bold 46px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = rgba(c.highlight, 0.86);
    ctx.fillText("7", p.torsoFront.x + 64, p.torsoFront.y + 72);
    drawStripes(ctx, p.torsoFront, c.accent, true);
  });
  withClip(ctx, p.torsoBack, () => {
    ctx.font = "bold 42px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = rgba(c.highlight, 0.72);
    ctx.fillText("7", p.torsoBack.x + 64, p.torsoBack.y + 70);
  });
}

function drawV3SchoolUniform(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = rgba(c.highlight, 0.82);
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 34, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 42); ctx.lineTo(p.torsoFront.x + 46, p.torsoFront.y + 48); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 94, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 42); ctx.lineTo(p.torsoFront.x + 82, p.torsoFront.y + 48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(c.accent, 0.85);
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 60, p.torsoFront.y + 42); ctx.lineTo(p.torsoFront.x + 68, p.torsoFront.y + 42); ctx.lineTo(p.torsoFront.x + 76, p.torsoFront.y + 108); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 120); ctx.lineTo(p.torsoFront.x + 52, p.torsoFront.y + 108); ctx.closePath(); ctx.fill();
  });
}

function drawV3Tactical(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    roundedRect(ctx, p.torsoFront.x + 14, p.torsoFront.y + 22, 42, 42, 5, "rgba(0,0,0,0.35)", rgba(c.highlight, 0.12));
    roundedRect(ctx, p.torsoFront.x + 72, p.torsoFront.y + 22, 42, 42, 5, "rgba(0,0,0,0.35)", rgba(c.highlight, 0.12));
    roundedRect(ctx, p.torsoFront.x + 20, p.torsoFront.y + 76, 88, 34, 5, "rgba(0,0,0,0.28)", rgba(c.highlight, 0.10));
    for (let y = p.torsoFront.y + 28; y < p.torsoFront.y + 105; y += 18) line(ctx, p.torsoFront.x + 18, y, p.torsoFront.x + 110, y, rgba(c.highlight,0.10), 1);
  });
}

function drawV3Suit(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = rgba(c.highlight, 0.82); ctx.fillRect(p.torsoFront.x + 48, p.torsoFront.y + 8, 32, p.torsoFront.h - 14);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 5, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 58, p.torsoFront.y + 55); ctx.lineTo(p.torsoFront.x + 40, p.torsoFront.y + 124); ctx.lineTo(p.torsoFront.x + 5, p.torsoFront.y + 124); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 123, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 70, p.torsoFront.y + 55); ctx.lineTo(p.torsoFront.x + 88, p.torsoFront.y + 124); ctx.lineTo(p.torsoFront.x + 123, p.torsoFront.y + 124); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(c.accent, 0.9);
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 60, p.torsoFront.y + 32); ctx.lineTo(p.torsoFront.x + 68, p.torsoFront.y + 32); ctx.lineTo(p.torsoFront.x + 74, p.torsoFront.y + 104); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 118); ctx.lineTo(p.torsoFront.x + 54, p.torsoFront.y + 104); ctx.closePath(); ctx.fill();
  });
}

const oldCreateSmartPantsV3 = createSmartPants;
createSmartPants = function(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();

  if (brain.style.skirt) {
    drawV3Skirt(ctx, p, brain);
    return canvas.toDataURL("image/png");
  }

  if (brain.style.shorts) {
    drawV3Shorts(ctx, p, brain);
    return canvas.toDataURL("image/png");
  }

  if (brain.style.leggings) {
    drawV3Leggings(ctx, p, brain);
    return canvas.toDataURL("image/png");
  }

  return oldCreateSmartPantsV3(prompt);
};

function drawV3Shorts(ctx, p, brain) {
  Object.values(p).forEach((panel, i) => {
    if (panel.group === "torso") renderFullPanelMaterial(ctx, panel, brain, true, i);
    else renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 0.55, denim: true, index: i });
  });
  drawWaistband(ctx, p, brain);
  [p.rightF, p.leftF, p.rightB, p.leftB].forEach(leg => {
    withClip(ctx, leg, () => {
      line(ctx, leg.x + 3, leg.y + leg.h * 0.53, leg.x + leg.w - 3, leg.y + leg.h * 0.53, rgba(brain.palette.highlight, 0.35), 2);
      if (brain.style.ripped) drawRips(ctx, leg, 1);
    });
  });
}

function drawV3Skirt(ctx, p, brain) {
  const c = brain.palette;
  Object.values(p).forEach(panel => clearPanel(ctx, panel));
  [p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoUp, p.torsoDown].forEach((panel,i) => renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: panel.face === "down" ? 1 : 0.42, index: i }));
  [p.rightF, p.rightB, p.rightL, p.rightR, p.leftF, p.leftB, p.leftL, p.leftR].forEach((panel,i) => {
    renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 0.62, index: i });
    withClip(ctx, panel, () => {
      if (brain.style.plaid) drawV3Plaid(ctx, panel, c);
      for (let x = panel.x + 6; x < panel.x + panel.w; x += 14) line(ctx, x, panel.y + 2, x + 5, panel.y + panel.h * 0.60, rgba(c.highlight, 0.10), 1);
      line(ctx, panel.x + 2, panel.y + panel.h * 0.60, panel.x + panel.w - 2, panel.y + panel.h * 0.60, rgba(c.highlight,0.24),2);
    });
  });
  drawWaistband(ctx, p, brain);
}

function drawV3Leggings(ctx, p, brain) {
  Object.values(p).forEach((panel, i) => {
    renderFullPanelMaterial(ctx, panel, brain, false, i);
    if (panel.group !== "torso") {
      withClip(ctx, panel, () => {
        line(ctx, panel.x + panel.w / 2, panel.y + 4, panel.x + panel.w / 2, panel.y + panel.h - 4, rgba(brain.palette.highlight, 0.07), 1);
        if (brain.style.stripes) drawStripes(ctx, panel, brain.palette.accent, false);
      });
    }
  });
  drawWaistband(ctx, p, brain);
}

function drawV3Plaid(ctx, p, c) {
  withClip(ctx, p, () => {
    for (let x = p.x + 4; x < p.x + p.w; x += 18) line(ctx, x, p.y, x, p.y + p.h, rgba(c.highlight,0.16), 2);
    for (let y = p.y + 4; y < p.y + p.h; y += 18) line(ctx, p.x, y, p.x + p.w, y, rgba(c.highlight,0.16), 2);
    for (let x = p.x + 12; x < p.x + p.w; x += 18) line(ctx, x, p.y, x, p.y + p.h, rgba(c.accent,0.18), 1);
    for (let y = p.y + 12; y < p.y + p.h; y += 18) line(ctx, p.x, y, p.x + p.w, y, rgba(c.accent,0.18), 1);
  });
}

function setupV3PromptButtons() {
  const chipWrap = document.querySelector(".chips");
  if (!chipWrap || chipWrap.dataset.v3 === "1") return;
  chipWrap.dataset.v3 = "1";

  const prompts = [
    "pink coquette bikini with bows",
    "black lace up corset goth top",
    "blue football jersey number 7",
    "white tank top angel wings",
    "black tactical vest cargo",
    "pink crop top girl stars",
    "red plaid mini skirt",
    "black ripped shorts chains",
    "green camo jacket",
    "formal black suit red tie"
  ];

  prompts.forEach(text => {
    const btn = document.createElement("button");
    btn.textContent = text.split(" ").slice(0, 3).join(" ");
    btn.dataset.prompt = text;
    btn.addEventListener("click", () => {
      promptInput.value = text;
      promptInput.focus();
    });
    chipWrap.appendChild(btn);
  });
}

setupV3PromptButtons();

/* =======================================
   EZZAI V4 MEGA CLOTHING LIBRARY
   Huge keyword brain: colours, designs,
   clothing items, aesthetics and routing.
======================================= */

const EZZAI_V4_COLORS = {
  black: ["#050608", "#101216", "#20242c", "#f3f4f6"],
  grey: ["#0b0d10", "#252932", "#8b8f99", "#f3f4f6"],
  gray: ["#0b0d10", "#252932", "#8b8f99", "#f3f4f6"],
  white: ["#e5e7eb", "#f8fafc", "#9ca3af", "#111827"],
  red: ["#160506", "#2a0a0c", "#dc2626", "#fff1f2"],
  crimson: ["#160507", "#310711", "#b91c1c", "#fff1f2"],
  burgundy: ["#14070a", "#3f0b18", "#7f1d1d", "#fff1f2"],
  maroon: ["#130606", "#2f0b0b", "#7f1d1d", "#fff1f2"],
  blue: ["#050a18", "#0f172a", "#2563eb", "#dbeafe"],
  navy: ["#020617", "#0a1026", "#1e3a8a", "#dbeafe"],
  sky: ["#031525", "#082f49", "#38bdf8", "#e0f2fe"],
  cyan: ["#042f2e", "#083344", "#06b6d4", "#cffafe"],
  teal: ["#042f2e", "#134e4a", "#14b8a6", "#ccfbf1"],
  green: ["#03140b", "#052e16", "#22c55e", "#dcfce7"],
  lime: ["#0f1f05", "#1a2e05", "#84cc16", "#ecfccb"],
  olive: ["#111707", "#2a2f0a", "#6b7d24", "#fefce8"],
  mint: ["#052e24", "#064e3b", "#6ee7b7", "#ecfdf5"],
  purple: ["#12051f", "#211032", "#a855f7", "#f5f3ff"],
  violet: ["#160521", "#2e1065", "#8b5cf6", "#f5f3ff"],
  lavender: ["#17112c", "#312e81", "#c4b5fd", "#faf5ff"],
  pink: ["#210617", "#3b0822", "#ec4899", "#fff1f2"],
  hotpink: ["#26051a", "#500724", "#f472b6", "#fff1f2"],
  rose: ["#22070e", "#4c0519", "#fb7185", "#fff1f2"],
  orange: ["#1c0b05", "#431407", "#f97316", "#fff7ed"],
  peach: ["#2d1207", "#7c2d12", "#fdba74", "#fff7ed"],
  yellow: ["#1f1700", "#422006", "#eab308", "#fefce8"],
  gold: ["#1f1700", "#451a03", "#f59e0b", "#fef3c7"],
  brown: ["#1c1008", "#3b2415", "#92400e", "#fef3c7"],
  tan: ["#1c1008", "#5c3b1a", "#d6b27c", "#fef3c7"],
  beige: ["#241b12", "#5c4a32", "#d6c4a0", "#fffbeb"],
  cream: ["#211b13", "#6b5d45", "#f5ead0", "#111827"],
  silver: ["#090b0e", "#272b31", "#c0c0c0", "#ffffff"],
  chrome: ["#030303", "#202020", "#d9d9d9", "#ffffff"],
  rainbow: ["#0b0d10", "#171a20", "#ec4899", "#fef3c7"]
};

const EZZAI_V4_TOPS = {
  hoodie: ["hoodie", "pullover", "zip hoodie", "zip-up hoodie", "drawstring hoodie"],
  jacket: ["jacket", "bomber", "varsity", "puffer", "windbreaker", "track jacket", "denim jacket", "leather jacket"],
  shirt: ["shirt", "button shirt", "button up", "overshirt", "flannel"],
  tee: ["tee", "t-shirt", "tshirt", "graphic tee"],
  longsleeve: ["long sleeve", "longsleeve", "thermal"],
  sweater: ["sweater", "jumper", "knit", "knitted", "cardigan"],
  tank: ["tank", "tank top", "vest top", "sleeveless", "cami", "camisole", "halter"],
  crop: ["crop", "cropped", "crop top"],
  babytee: ["baby tee", "babytee", "baby t"],
  blouse: ["blouse", "ruffle blouse", "frilly top"],
  polo: ["polo", "polo shirt"],
  bikini: ["bikini", "swimwear", "swimsuit", "beach top", "swim top"],
  corset: ["corset", "lace up", "lace-up", "bodice"],
  dress: ["dress", "gown", "princess dress", "party dress", "sundress"],
  jersey: ["jersey", "football shirt", "soccer shirt", "basketball jersey", "sports top"],
  uniform: ["uniform", "school uniform", "academy", "preppy"],
  tactical: ["tactical", "combat", "army", "military", "plate carrier", "utility vest"],
  suit: ["suit", "blazer", "formal", "tie", "waistcoat", "tuxedo"],
  robe: ["robe", "kimono", "cloak", "cape", "poncho"],
  overalls: ["overalls", "dungarees", "suspenders"]
};

const EZZAI_V4_BOTTOMS = {
  jeans: ["jeans", "denim", "skinny jeans", "baggy jeans", "flare jeans"],
  cargo: ["cargo", "utility pants", "cargo pants"],
  joggers: ["jogger", "joggers", "sweatpants", "tracksuit", "track pants"],
  shorts: ["shorts", "short", "jorts", "denim shorts"],
  skirt: ["skirt", "mini skirt", "pleated skirt", "maxi skirt"],
  leggings: ["leggings", "yoga pants", "tights"],
  trousers: ["trousers", "pants", "chinos", "slacks"],
  overalls: ["overalls", "dungarees", "suspenders"],
  formal: ["formal pants", "suit pants", "dress pants"],
  swim: ["swim shorts", "trunks", "board shorts"]
};

const EZZAI_V4_PATTERNS = {
  stripes: ["stripe", "stripes", "striped"],
  checker: ["checker", "checkered", "checkerboard"],
  plaid: ["plaid", "tartan", "flannel"],
  camo: ["camo", "camouflage"],
  galaxy: ["galaxy", "space", "starscape"],
  floral: ["flower", "flowers", "floral"],
  butterfly: ["butterfly", "butterflies"],
  animal: ["animal print", "leopard", "zebra", "snake print", "cow print", "tiger print"],
  money: ["money", "cash", "dollar"],
  graffiti: ["graffiti", "tag", "spray"],
  spider: ["spider", "web", "spiderweb"],
  blood: ["blood", "bloody"],
  flames: ["flame", "flames", "fire"],
  lightning: ["lightning", "bolt", "electric"],
  stars: ["star", "stars"],
  hearts: ["heart", "hearts"],
  skull: ["skull", "skeleton", "bones"],
  cross: ["cross", "crosses"],
  chains: ["chain", "chains"],
  bows: ["bow", "bows", "ribbon", "ribbons"],
  lace: ["lace", "lacy"],
  pearls: ["pearl", "pearls"],
  diamonds: ["diamond", "diamonds", "gem"],
  metal: ["metal", "metallic", "chrome", "silver"]
};

const EZZAI_V4_AESTHETICS = [
  "y2k", "emo", "grunge", "goth", "gothic", "punk", "skater", "cyber", "neon",
  "streetwear", "luxury", "designer", "minimal", "plain", "basic", "clean",
  "oversized", "baggy", "cute", "girly", "girl", "feminine", "coquette",
  "soft girl", "egirl", "e-girl", "fairycore", "baddie", "preppy", "vintage",
  "retro", "alt", "dark", "kawaii", "pastel", "sporty", "racing", "motocross",
  "techwear", "tactical", "military", "formal", "royal", "princess"
];

function ezzV4Includes(raw, arr) {
  return arr.some(x => raw.includes(x));
}

function ezzV4DetectKey(raw, table) {
  for (const [key, values] of Object.entries(table)) {
    if (ezzV4Includes(raw, values)) return key;
  }
  return null;
}

function ezzV4GetPalette(raw) {
  const found = Object.keys(EZZAI_V4_COLORS).filter(c => raw.includes(c));
  if (raw.includes("black and white") || raw.includes("black & white") || (raw.includes("black") && raw.includes("white"))) {
    found.unshift("black", "white");
  }
  if (found.length >= 2) {
    const a = EZZAI_V4_COLORS[found[0]];
    const b = EZZAI_V4_COLORS[found[1]];
    return { base: a[0], secondary: a[1], accent: b[2], highlight: b[3], alt: a[2], name: found.slice(0, 2).join("-") };
  }
  if (found.length === 1) {
    const c = EZZAI_V4_COLORS[found[0]];
    return { base: c[0], secondary: c[1], accent: c[2], highlight: c[3], alt: c[2], name: found[0] };
  }
  return { base: "#06070a", secondary: "#111318", accent: "#7c3aed", highlight: "#e5e7eb", alt: "#38bdf8", name: "dark" };
}

const oldParsePromptV4 = parsePrompt;
parsePrompt = function(prompt) {
  const brain = oldParsePromptV4(prompt);
  const raw = brain.raw;
  const top = ezzV4DetectKey(raw, EZZAI_V4_TOPS);
  const bottom = ezzV4DetectKey(raw, EZZAI_V4_BOTTOMS);
  brain.v4 = {
    top,
    bottom,
    patterns: Object.keys(EZZAI_V4_PATTERNS).filter(k => ezzV4Includes(raw, EZZAI_V4_PATTERNS[k])),
    aesthetics: EZZAI_V4_AESTHETICS.filter(k => raw.includes(k)),
    colorWords: Object.keys(EZZAI_V4_COLORS).filter(k => raw.includes(k))
  };
  brain.palette = ezzV4GetPalette(raw);

  // Map v4 discoveries into existing style flags
  if (top) brain.style[top] = true;
  if (bottom) brain.style[bottom] = true;
  brain.v4.patterns.forEach(k => brain.style[k] = true);
  if (brain.v4.aesthetics.includes("coquette")) brain.style.coquette = true;
  if (brain.v4.aesthetics.includes("girl") || brain.v4.aesthetics.includes("girly") || brain.v4.aesthetics.includes("feminine")) brain.style.girl = true;
  if (brain.v4.aesthetics.includes("minimal") || brain.v4.aesthetics.includes("plain") || brain.v4.aesthetics.includes("basic")) brain.style.minimal = true;
  return brain;
};

const oldGetTopVariantV4 = getTopVariant;
getTopVariant = function(brain) {
  if (brain.v4?.top) return brain.v4.top;
  return oldGetTopVariantV4(brain);
};

const oldCreateSmartShirtV4 = createSmartShirt;
createSmartShirt = function(prompt) {
  const brain = parsePrompt(prompt);
  const top = getTopVariant(brain);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();

  const handled = ["blouse", "polo", "sweater", "robe", "overalls"];
  if (!handled.includes(top)) return oldCreateSmartShirtV4(prompt);

  if (top === "blouse") {
    drawV4Blouse(ctx, p, brain);
  } else if (top === "polo") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV4Polo(ctx, p, brain);
    drawSleeves(ctx, p, brain, false, top);
  } else if (top === "sweater") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV4Sweater(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, top);
  } else if (top === "robe") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV4Robe(ctx, p, brain);
    drawSleeves(ctx, p, brain, true, top);
  } else if (top === "overalls") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
    drawV4OverallsTop(ctx, p, brain);
    drawSleeves(ctx, p, brain, false, top);
  }

  drawShirtExtras(ctx, p, brain, top);
  return canvas.toDataURL("image/png");
};

function drawV4Blouse(ctx, p, brain) {
  const c = brain.palette;
  [p.torsoUp, p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoDown].forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  [p.rightL,p.rightB,p.rightR,p.rightF,p.leftL,p.leftB,p.leftR,p.leftF].forEach((panel, i) => renderPartialPanelMaterial(ctx, panel, brain, { fromY: 0, toY: 0.55, index: i }));

  withClip(ctx, p.torsoFront, () => {
    ctx.clearRect(p.torsoFront.x + 38, p.torsoFront.y, 52, 14);
    line(ctx, p.torsoFront.x + 26, p.torsoFront.y + 19, p.torsoFront.x + 102, p.torsoFront.y + 19, rgba(c.highlight, 0.22), 2);
    for (let y = p.torsoFront.y + 34; y < p.torsoFront.y + 106; y += 18) {
      line(ctx, p.torsoFront.x + 18, y, p.torsoFront.x + 110, y, rgba(c.highlight, 0.08), 1);
    }
    if (brain.style.bows || brain.style.coquette || brain.style.bow) drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 38, c.highlight, c.accent);
  });
}

function drawV4Polo(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = rgba(c.highlight, 0.75);
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 38, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 35); ctx.lineTo(p.torsoFront.x + 50, p.torsoFront.y + 42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 90, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 35); ctx.lineTo(p.torsoFront.x + 78, p.torsoFront.y + 42); ctx.closePath(); ctx.fill();
    for (let y = 45; y < 75; y += 10) roundedRect(ctx, p.torsoFront.x + 60, p.torsoFront.y + y, 8, 8, 4, rgba(c.highlight,0.55));
  });
}

function drawV4Sweater(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    // knitted rib lines
    for (let x = p.torsoFront.x + 8; x < p.torsoFront.x + p.torsoFront.w; x += 12) {
      line(ctx, x, p.torsoFront.y + 8, x, p.torsoFront.y + p.torsoFront.h - 8, rgba(c.highlight, 0.05), 1);
    }
    ctx.strokeStyle = rgba(c.highlight, 0.18); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.torsoFront.x + 64, p.torsoFront.y + 17, 28, 0, Math.PI); ctx.stroke();
  });
  withClip(ctx, p.torsoDown, () => ribbed(ctx, p.torsoDown, "rgba(0,0,0,0.30)", rgba(c.highlight,0.06)));
}

function drawV4Robe(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 18, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 72, p.torsoFront.y + 64); ctx.lineTo(p.torsoFront.x + 36, p.torsoFront.y + 124); ctx.lineTo(p.torsoFront.x + 8, p.torsoFront.y + 124); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 110, p.torsoFront.y + 8); ctx.lineTo(p.torsoFront.x + 56, p.torsoFront.y + 64); ctx.lineTo(p.torsoFront.x + 92, p.torsoFront.y + 124); ctx.lineTo(p.torsoFront.x + 120, p.torsoFront.y + 124); ctx.closePath(); ctx.fill();
    line(ctx, p.torsoFront.x + 18, p.torsoFront.y + 82, p.torsoFront.x + 110, p.torsoFront.y + 82, rgba(c.highlight,0.28), 3);
  });
}

function drawV4OverallsTop(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    ctx.fillStyle = rgba(c.accent, 0.42);
    roundedRect(ctx, p.torsoFront.x + 28, p.torsoFront.y + 48, 72, 70, 5, rgba(c.accent,0.36), rgba(c.highlight,0.12));
    line(ctx, p.torsoFront.x + 36, p.torsoFront.y + 8, p.torsoFront.x + 46, p.torsoFront.y + 54, rgba(c.highlight,0.35), 4);
    line(ctx, p.torsoFront.x + 92, p.torsoFront.y + 8, p.torsoFront.x + 82, p.torsoFront.y + 54, rgba(c.highlight,0.35), 4);
    roundedRect(ctx, p.torsoFront.x + 48, p.torsoFront.y + 68, 32, 22, 4, "rgba(0,0,0,0.22)", rgba(c.highlight,0.10));
  });
}

const oldCreateSmartPantsV4 = createSmartPants;
createSmartPants = function(prompt) {
  const brain = parsePrompt(prompt);
  const bottom = brain.v4?.bottom;
  const { canvas, ctx } = createCanvas();
  const p = getPanels();

  if (bottom === "trousers" || bottom === "formal") {
    Object.values(p).forEach((panel, i) => renderFullPanelMaterial(ctx, panel, brain, false, i));
  }

  return oldCreateSmartPantsV4(prompt);
};

function setupV4PromptButtons() {
  const chipWrap = document.querySelector(".chips");
  if (!chipWrap || chipWrap.dataset.v4 === "1") return;
  chipWrap.dataset.v4 = "1";

  const prompts = [
    "black and white striped polo shirt",
    "cream coquette blouse with bows",
    "brown knitted sweater vintage",
    "black kimono robe with silver stars",
    "blue denim overalls with pockets",
    "pink floral crop top girl",
    "chrome cyber jacket lightning",
    "purple galaxy hoodie stars",
    "leopard print tank top",
    "white formal blazer suit tie",
    "olive camo cargo pants",
    "black leather jacket skull"
  ];

  prompts.forEach(text => {
    const btn = document.createElement("button");
    btn.textContent = text.split(" ").slice(0, 3).join(" ");
    btn.dataset.prompt = text;
    btn.addEventListener("click", () => {
      promptInput.value = text;
      promptInput.focus();
    });
    chipWrap.appendChild(btn);
  });
}

setupV4PromptButtons();


/* =======================================
   EZZAI V5 COLOR + DESIGN FIX
   Fixes dark black base issue and makes
   colors/designs much cleaner and brighter.
======================================= */

const EZZ_LIGHT_COLOR_WORDS = [
  "white","cream","beige","tan","peach","pink","lavender","yellow","mint","sky","cyan","silver"
];

function getSmartPalette(p) {
  const palettes = {
    black:   { base:"#16181d", secondary:"#0d1015", accent:"#e5e7eb", highlight:"#ffffff", alt:"#6b7280" },
    grey:    { base:"#6b7280", secondary:"#4b5563", accent:"#e5e7eb", highlight:"#ffffff", alt:"#9ca3af" },
    gray:    { base:"#6b7280", secondary:"#4b5563", accent:"#e5e7eb", highlight:"#ffffff", alt:"#9ca3af" },
    white:   { base:"#f3f4f6", secondary:"#e5e7eb", accent:"#9ca3af", highlight:"#ffffff", alt:"#d1d5db" },
    red:     { base:"#dc2626", secondary:"#991b1b", accent:"#fee2e2", highlight:"#ffffff", alt:"#f87171" },
    crimson: { base:"#be123c", secondary:"#881337", accent:"#ffe4e6", highlight:"#ffffff", alt:"#fb7185" },
    burgundy:{ base:"#7f1d1d", secondary:"#4c0519", accent:"#fecdd3", highlight:"#ffffff", alt:"#9f1239" },
    maroon:  { base:"#7f1d1d", secondary:"#450a0a", accent:"#fecaca", highlight:"#ffffff", alt:"#b91c1c" },
    blue:    { base:"#2563eb", secondary:"#1d4ed8", accent:"#dbeafe", highlight:"#ffffff", alt:"#60a5fa" },
    navy:    { base:"#1e3a8a", secondary:"#172554", accent:"#dbeafe", highlight:"#ffffff", alt:"#60a5fa" },
    sky:     { base:"#38bdf8", secondary:"#0284c7", accent:"#e0f2fe", highlight:"#ffffff", alt:"#7dd3fc" },
    cyan:    { base:"#22d3ee", secondary:"#0891b2", accent:"#cffafe", highlight:"#ffffff", alt:"#67e8f9" },
    teal:    { base:"#14b8a6", secondary:"#0f766e", accent:"#ccfbf1", highlight:"#ffffff", alt:"#5eead4" },
    green:   { base:"#22c55e", secondary:"#15803d", accent:"#dcfce7", highlight:"#ffffff", alt:"#86efac" },
    lime:    { base:"#84cc16", secondary:"#4d7c0f", accent:"#ecfccb", highlight:"#ffffff", alt:"#bef264" },
    olive:   { base:"#6b7d24", secondary:"#4d5c19", accent:"#fef9c3", highlight:"#ffffff", alt:"#a3b18a" },
    mint:    { base:"#6ee7b7", secondary:"#34d399", accent:"#ecfdf5", highlight:"#ffffff", alt:"#a7f3d0" },
    purple:  { base:"#8b5cf6", secondary:"#6d28d9", accent:"#ede9fe", highlight:"#ffffff", alt:"#c4b5fd" },
    violet:  { base:"#8b5cf6", secondary:"#5b21b6", accent:"#f5f3ff", highlight:"#ffffff", alt:"#c4b5fd" },
    lavender:{ base:"#c4b5fd", secondary:"#a78bfa", accent:"#faf5ff", highlight:"#ffffff", alt:"#ddd6fe" },
    pink:    { base:"#f472b6", secondary:"#ec4899", accent:"#fdf2f8", highlight:"#ffffff", alt:"#f9a8d4" },
    hotpink: { base:"#ec4899", secondary:"#be185d", accent:"#fdf2f8", highlight:"#ffffff", alt:"#f9a8d4" },
    rose:    { base:"#fb7185", secondary:"#e11d48", accent:"#fff1f2", highlight:"#ffffff", alt:"#fda4af" },
    orange:  { base:"#f97316", secondary:"#ea580c", accent:"#ffedd5", highlight:"#ffffff", alt:"#fdba74" },
    peach:   { base:"#fdba74", secondary:"#fb923c", accent:"#fff7ed", highlight:"#ffffff", alt:"#fed7aa" },
    yellow:  { base:"#facc15", secondary:"#eab308", accent:"#fefce8", highlight:"#ffffff", alt:"#fde68a" },
    gold:    { base:"#f59e0b", secondary:"#d97706", accent:"#fffbeb", highlight:"#ffffff", alt:"#fcd34d" },
    brown:   { base:"#92400e", secondary:"#78350f", accent:"#fef3c7", highlight:"#ffffff", alt:"#d6b27c" },
    tan:     { base:"#d6b27c", secondary:"#b08968", accent:"#fffbeb", highlight:"#ffffff", alt:"#e7c9a9" },
    beige:   { base:"#e8d8c3", secondary:"#d6c4a0", accent:"#fffbeb", highlight:"#ffffff", alt:"#f3e6d3" },
    cream:   { base:"#f5ead0", secondary:"#e8dcc2", accent:"#fffbeb", highlight:"#ffffff", alt:"#faf2df" },
    silver:  { base:"#d1d5db", secondary:"#9ca3af", accent:"#f8fafc", highlight:"#ffffff", alt:"#e5e7eb" },
    chrome:  { base:"#cbd5e1", secondary:"#94a3b8", accent:"#f8fafc", highlight:"#ffffff", alt:"#e2e8f0" },
    rainbow: { base:"#f472b6", secondary:"#60a5fa", accent:"#facc15", highlight:"#ffffff", alt:"#34d399" }
  };

  const found = Object.keys(palettes).filter(c => p.includes(c));
  if (p.includes("black and white") || p.includes("black & white")) {
    return { ...palettes.black, accent: palettes.white.base, highlight: "#ffffff", alt: palettes.white.secondary, name: "black-white" };
  }
  if (found.length >= 2) {
    const a = palettes[found[0]];
    const b = palettes[found[1]];
    return { base:a.base, secondary:a.secondary, accent:b.base, highlight:b.accent || b.highlight, alt:a.alt, name:found[0] + '-' + found[1] };
  }
  if (found.length === 1) return { ...palettes[found[0]], name:found[0] };
  return { base:"#8b5cf6", secondary:"#6d28d9", accent:"#f472b6", highlight:"#ffffff", alt:"#c4b5fd", name:"default-vibrant" };
}

function isLightPalette(brain) {
  const raw = (brain?.raw || "").toLowerCase();
  return EZZ_LIGHT_COLOR_WORDS.some(w => raw.includes(w)) || raw.includes('pastel') || raw.includes('cute') || raw.includes('coquette');
}

function applyFabric(ctx, p, brain, index) {
  const light = isLightPalette(brain);
  withClip(ctx, p, () => {
    ctx.strokeStyle = light ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let y = p.y - 4; y < p.y + p.h + 4; y += 9) {
      ctx.beginPath();
      ctx.moveTo(p.x - 5, y);
      ctx.lineTo(p.x + p.w + 5, y + Math.sin((y + index) * 0.16) * 1.0);
      ctx.stroke();
    }
    ctx.strokeStyle = light ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.10)";
    for (let x = p.x - 4; x < p.x + p.w + 4; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, p.y - 4);
      ctx.lineTo(x + Math.cos(x) * 1.0, p.y + p.h + 4);
      ctx.stroke();
    }
  });
}

function applyDenim(ctx, p, brain, index) {
  const light = isLightPalette(brain);
  withClip(ctx, p, () => {
    ctx.strokeStyle = light ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;
    for (let y = p.y - 4; y < p.y + p.h + 4; y += 6) {
      ctx.beginPath();
      ctx.moveTo(p.x - 4, y);
      ctx.lineTo(p.x + p.w + 4, y + Math.sin((y + index) * 0.2) * 1.0);
      ctx.stroke();
    }
    ctx.strokeStyle = light ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.12)";
    for (let x = p.x - 4; x < p.x + p.w + 4; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, p.y - 4);
      ctx.lineTo(x + Math.sin(x) * 1.0, p.y + p.h + 4);
      ctx.stroke();
    }
  });
}

function applyShade(ctx, p, intensity = 0.15) {
  const lightMode = intensity < 0.12;
  withClip(ctx, p, () => {
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    grad.addColorStop(0, `rgba(255,255,255,${lightMode ? 0.07 : intensity})`);
    grad.addColorStop(0.5, "rgba(255,255,255,0.012)");
    grad.addColorStop(1, `rgba(0,0,0,${lightMode ? 0.08 : intensity * 0.75})`);
    ctx.fillStyle = grad;
    ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
  });
}

function renderBasePanelSet(ctx, panels, brain, denim = false) {
  const light = isLightPalette(brain);
  panels.forEach((panel, i) => {
    fillPanel(ctx, panel, brain.palette.base, 5);
    if (denim) applyDenim(ctx, panel, brain, i); else applyFabric(ctx, panel, brain, i);
    applyGlobalPattern(ctx, panel, brain, i);
    applyShade(ctx, panel, light ? 0.08 : 0.13);
  });
}

function drawBetterColorBlocking(ctx, panel, brain, mode = 'sides') {
  const c = brain.palette;
  withClip(ctx, panel, () => {
    if (mode === 'sides') {
      ctx.fillStyle = rgba(c.accent, 0.28);
      ctx.fillRect(panel.x + 6, panel.y + 6, Math.max(12, panel.w * 0.18), panel.h - 12);
      ctx.fillRect(panel.x + panel.w - Math.max(18, panel.w * 0.18) - 6, panel.y + 6, Math.max(12, panel.w * 0.18), panel.h - 12);
    } else if (mode === 'stripe') {
      ctx.fillStyle = rgba(c.accent, 0.24);
      ctx.fillRect(panel.x + 8, panel.y + panel.h * 0.18, panel.w - 16, Math.max(10, panel.h * 0.12));
    }
  });
}

const __oldCreateSmartShirtV5 = createSmartShirt;
createSmartShirt = function(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  renderBasePanelSet(ctx, Object.values(p), brain, false);

  const variant = typeof getTopVariant === 'function' ? getTopVariant(brain) : (brain.style.hoodie ? 'hoodie' : 'shirt');
  const isHoodie = ['hoodie','jacket','sweater'].includes(variant) || (brain.style.hoodie && !brain.style.shirt);

  if (variant === 'bikini' || variant === 'tank' || variant === 'crop' || variant === 'babytee') {
    // keep bright top panels and clear lower torso area more cleanly
    [p.torsoDown].forEach(panel => clearPanel(ctx, panel));
  }

  if (typeof drawHoodie === 'function' && isHoodie && variant === 'hoodie') {
    drawHoodie(ctx, p, brain);
  } else if (typeof drawJacket === 'function' && variant === 'jacket') {
    drawJacket(ctx, p, brain);
  } else if (typeof drawPlainShirt === 'function' && ['shirt','tee','tank','crop','babytee','bikini','blouse','polo','corset','dress','jersey','uniform','suit','overalls'].includes(variant)) {
    drawPlainShirt(ctx, p, brain);
  } else {
    __oldCreateSmartShirtV5(prompt);
  }

  // cleaner / brighter variant tweaks
  if (variant === 'bikini' || variant === 'tank' || variant === 'crop' || variant === 'babytee') {
    drawV5FeminineTop(ctx, p, brain, variant);
  }
  if (variant === 'shirt' || variant === 'tee' || variant === 'polo' || variant === 'jersey') {
    drawV5TopDetails(ctx, p, brain, variant);
  }
  if (variant === 'hoodie') {
    drawV5HoodieDetails(ctx, p, brain);
  }
  if (variant === 'jacket') {
    drawV5JacketDetails(ctx, p, brain);
  }

  if (typeof drawSleeves === 'function') drawSleeves(ctx, p, brain, isHoodie, variant);
  if (typeof drawShirtExtras === 'function') drawShirtExtras(ctx, p, brain, variant);
  return canvas.toDataURL('image/png');
};

function drawV5TopDetails(ctx, p, brain, variant) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    if (brain.style.stripes) {
      for (let y = p.torsoFront.y + 18; y < p.torsoFront.y + 112; y += 16) {
        ctx.fillStyle = rgba(c.accent, 0.18);
        ctx.fillRect(p.torsoFront.x + 8, y, p.torsoFront.w - 16, 8);
      }
    }
    if (brain.style.checker) {
      const size = 16;
      for (let yy = p.torsoFront.y + 22; yy < p.torsoFront.y + 110; yy += size) {
        for (let xx = p.torsoFront.x + 12; xx < p.torsoFront.x + 116; xx += size) {
          if (((xx+yy)/size)%2===0) { ctx.fillStyle = rgba(c.accent,0.16); ctx.fillRect(xx, yy, size, size); }
        }
      }
    }
    if (variant === 'jersey') {
      ctx.fillStyle = rgba(c.accent,0.22);
      ctx.fillRect(p.torsoFront.x+8, p.torsoFront.y+22, p.torsoFront.w-16, 18);
      ctx.fillStyle = rgba(c.highlight,0.9);
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('07', p.torsoFront.x+64, p.torsoFront.y+92);
    }
    if (variant === 'polo') {
      drawBetterColorBlocking(ctx, p.torsoFront, brain, 'stripe');
    }
  });
}

function drawV5HoodieDetails(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    if (brain.style.y2k || brain.style.cyber || brain.style.graffiti) drawBetterColorBlocking(ctx, p.torsoFront, brain, 'sides');
    ctx.fillStyle = rgba(c.highlight, 0.08);
    ctx.fillRect(p.torsoFront.x + 22, p.torsoFront.y + 84, 84, 26);
  });
}

function drawV5JacketDetails(ctx, p, brain) {
  const c = brain.palette;
  withClip(ctx, p.torsoFront, () => {
    drawBetterColorBlocking(ctx, p.torsoFront, brain, 'sides');
    ctx.strokeStyle = rgba(c.highlight, 0.30);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.torsoFront.x + 64, p.torsoFront.y + 8);
    ctx.lineTo(p.torsoFront.x + 64, p.torsoFront.y + 120);
    ctx.stroke();
  });
}

function drawV5FeminineTop(ctx, p, brain, variant) {
  const c = brain.palette;
  // clear lower torso/sleeve noise for cleaner tops
  [p.torsoDown, p.rightD, p.leftD].forEach(panel => clearPanel(ctx, panel));
  withClip(ctx, p.torsoFront, () => {
    // neckline
    ctx.clearRect(p.torsoFront.x + 38, p.torsoFront.y + 0, 52, 14);
    if (variant === 'bikini') {
      ctx.fillStyle = rgba(c.accent, 0.78);
      ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 18, p.torsoFront.y + 28); ctx.lineTo(p.torsoFront.x + 56, p.torsoFront.y + 28); ctx.lineTo(p.torsoFront.x + 36, p.torsoFront.y + 64); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p.torsoFront.x + 110, p.torsoFront.y + 28); ctx.lineTo(p.torsoFront.x + 72, p.torsoFront.y + 28); ctx.lineTo(p.torsoFront.x + 92, p.torsoFront.y + 64); ctx.closePath(); ctx.fill();
      line(ctx, p.torsoFront.x + 56, p.torsoFront.y + 26, p.torsoFront.x + 72, p.torsoFront.y + 26, rgba(c.highlight,0.9), 3);
      line(ctx, p.torsoFront.x + 38, p.torsoFront.y + 62, p.torsoFront.x + 18, p.torsoFront.y + 100, rgba(c.highlight,0.35), 2);
      line(ctx, p.torsoFront.x + 90, p.torsoFront.y + 62, p.torsoFront.x + 110, p.torsoFront.y + 100, rgba(c.highlight,0.35), 2);
    } else if (variant === 'tank') {
      ctx.clearRect(p.torsoFront.x + 4, p.torsoFront.y + 12, 18, 42);
      ctx.clearRect(p.torsoFront.x + 106, p.torsoFront.y + 12, 18, 42);
      line(ctx, p.torsoFront.x + 34, p.torsoFront.y + 18, p.torsoFront.x + 52, p.torsoFront.y + 8, rgba(c.highlight,0.45), 3);
      line(ctx, p.torsoFront.x + 94, p.torsoFront.y + 18, p.torsoFront.x + 76, p.torsoFront.y + 8, rgba(c.highlight,0.45), 3);
    } else if (variant === 'crop' || variant === 'babytee') {
      ctx.clearRect(p.torsoFront.x, p.torsoFront.y + 96, p.torsoFront.w, 32);
      ctx.fillStyle = rgba(c.accent, 0.18);
      ctx.fillRect(p.torsoFront.x + 12, p.torsoFront.y + 80, p.torsoFront.w - 24, 10);
    }
    if (brain.style.bows || brain.style.coquette || brain.raw.includes('bow')) {
      if (typeof drawBow === 'function') drawBow(ctx, p.torsoFront.x + 64, p.torsoFront.y + 36, c.highlight, c.accent);
    }
  });
}

const __oldCreateSmartPantsV5 = createSmartPants;
createSmartPants = function(prompt) {
  const brain = parsePrompt(prompt);
  const { canvas, ctx } = createCanvas();
  const p = getPanels();
  const all = Object.values(p);
  const light = isLightPalette(brain);

  all.forEach(panel => clearPanel(ctx, panel));

  // Fill pants template areas only: torso + legs for classic pants, but torso should be waistband/top continuation only
  const torsoPanels = [p.torsoFront, p.torsoBack, p.torsoLeft, p.torsoRight, p.torsoUp, p.torsoDown];
  const legPanels = [p.rightL,p.rightB,p.rightR,p.rightF,p.rightU,p.rightD,p.leftL,p.leftB,p.leftR,p.leftF,p.leftU,p.leftD];
  renderBasePanelSet(ctx, torsoPanels, brain, brain.style.jeans || brain.raw.includes('denim'));
  renderBasePanelSet(ctx, legPanels, brain, brain.style.jeans || brain.raw.includes('denim'));

  // keep torso subtle on pants so it acts like waistband/upper section only
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight].forEach(panel => {
    withClip(ctx, panel, () => {
      ctx.clearRect(panel.x, panel.y + 42, panel.w, panel.h - 42);
      ctx.fillStyle = rgba(brain.palette.secondary, 0.22);
      ctx.fillRect(panel.x, panel.y + 8, panel.w, 26);
      line(ctx, panel.x + 8, panel.y + 34, panel.x + panel.w - 8, panel.y + 34, rgba(brain.palette.highlight,0.18), 2);
    });
  });

  if (brain.style.ripped || brain.raw.includes('ripped') || brain.raw.includes('distressed')) {
    if (typeof addRips === 'function') {
      [p.rightF,p.leftF,p.rightB,p.leftB].forEach((panel, i) => addRips(ctx, panel, i));
    }
  }
  if (brain.style.cargo || brain.raw.includes('cargo')) {
    if (typeof drawCargoPocket === 'function') {
      drawCargoPocket(ctx, p.rightF, brain.palette, true);
      drawCargoPocket(ctx, p.leftF, brain.palette, true);
    }
  }
  if (brain.style.chains || brain.raw.includes('chain')) {
    if (typeof drawChain === 'function') {
      drawChain(ctx, p.rightF.x + 16, p.rightF.y + 28, 24, brain.palette.highlight);
      drawChain(ctx, p.leftF.x + 48, p.leftF.y + 24, 22, brain.palette.highlight);
    }
  }
  if (brain.style.stars || brain.raw.includes('star')) {
    [p.rightF,p.leftF].forEach((panel, i) => {
      for (let n=0;n<4;n++) if (typeof drawStar === 'function') drawStar(ctx, panel.x + 18 + n*10, panel.y + 18 + ((n+i)%3)*22, 5, brain.palette.accent, 0.8);
    });
  }

  // cleaner finishing shade
  [...torsoPanels, ...legPanels].forEach(panel => applyShade(ctx, panel, light ? 0.06 : 0.10));
  return canvas.toDataURL('image/png');
};

/* =======================================
   EZZAI V6 NO-BASE CLEAN DESIGN ENGINE
   Transparent unused panels + cleaner,
   garment-specific designs + variations.
======================================= */

let EZZ_V6_COUNTER = 0;

function ezzV6Has(raw, ...terms) {
  return terms.some(t => raw.includes(t));
}

function ezzV6Kind(prompt, selectedTypeValue) {
  const raw = String(prompt || "").toLowerCase();
  if (selectedTypeValue === "Pants") {
    if (ezzV6Has(raw, "skirt", "mini skirt", "pleated")) return "skirt";
    if (ezzV6Has(raw, "shorts", "jorts")) return "shorts";
    if (ezzV6Has(raw, "leggings", "tights", "yoga")) return "leggings";
    return "pants";
  }

  if (ezzV6Has(raw, "bikini", "swimwear", "swimsuit", "bra top")) return "bikini";
  if (ezzV6Has(raw, "corset", "lace up", "bodice")) return "corset";
  if (ezzV6Has(raw, "tank", "tank top", "sleeveless", "cami", "halter")) return "tank";
  if (ezzV6Has(raw, "crop", "cropped", "crop top")) return "crop";
  if (ezzV6Has(raw, "baby tee", "babytee")) return "babytee";
  if (ezzV6Has(raw, "hoodie")) return "hoodie";
  if (ezzV6Has(raw, "jacket", "bomber", "varsity", "puffer", "windbreaker")) return "jacket";
  if (ezzV6Has(raw, "jersey", "football shirt", "soccer shirt")) return "jersey";
  if (ezzV6Has(raw, "dress", "gown")) return "dress";
  if (ezzV6Has(raw, "blouse", "coquette", "frilly", "ruffle")) return "blouse";
  if (ezzV6Has(raw, "suit", "blazer", "formal")) return "suit";
  return "shirt";
}

function ezzV6Palette(prompt) {
  const raw = String(prompt || "").toLowerCase();
  const colors = {
    black:   ["#111318", "#1f2430", "#e5e7eb", "#ffffff"],
    white:   ["#f3f4f6", "#d1d5db", "#111827", "#ffffff"],
    grey:    ["#6b7280", "#9ca3af", "#f3f4f6", "#ffffff"],
    gray:    ["#6b7280", "#9ca3af", "#f3f4f6", "#ffffff"],
    pink:    ["#f472b6", "#f9a8d4", "#831843", "#ffffff"],
    hotpink: ["#ec4899", "#f9a8d4", "#831843", "#ffffff"],
    red:     ["#ef4444", "#f87171", "#7f1d1d", "#ffffff"],
    blue:    ["#3b82f6", "#60a5fa", "#1e3a8a", "#ffffff"],
    navy:    ["#1e3a8a", "#2563eb", "#dbeafe", "#ffffff"],
    green:   ["#22c55e", "#86efac", "#064e3b", "#ffffff"],
    purple:  ["#a855f7", "#c4b5fd", "#581c87", "#ffffff"],
    lavender:["#c4b5fd", "#ddd6fe", "#4c1d95", "#ffffff"],
    yellow:  ["#facc15", "#fde68a", "#713f12", "#ffffff"],
    gold:    ["#f59e0b", "#fcd34d", "#78350f", "#ffffff"],
    orange:  ["#fb923c", "#fdba74", "#7c2d12", "#ffffff"],
    brown:   ["#92400e", "#d6b27c", "#fef3c7", "#ffffff"],
    beige:   ["#e8d8c3", "#f3e6d3", "#7c5b35", "#ffffff"],
    cream:   ["#f5ead0", "#fff7ed", "#7c5b35", "#ffffff"],
    silver:  ["#d1d5db", "#f8fafc", "#374151", "#ffffff"],
    chrome:  ["#cbd5e1", "#ffffff", "#334155", "#ffffff"],
  };
  const found = Object.keys(colors).filter(c => raw.includes(c));
  if (raw.includes("black and white") || raw.includes("black & white")) {
    return { base:"#111318", shade:"#1f2430", accent:"#f3f4f6", hi:"#ffffff", name:"black-white" };
  }
  if (found.length >= 2) {
    const a = colors[found[0]], b = colors[found[1]];
    return { base:a[0], shade:a[1], accent:b[0], hi:b[3], name:found[0]+"-"+found[1] };
  }
  if (found.length === 1) {
    const c = colors[found[0]];
    return { base:c[0], shade:c[1], accent:c[2], hi:c[3], name:found[0] };
  }
  return { base:"#f472b6", shade:"#f9a8d4", accent:"#831843", hi:"#ffffff", name:"pink-default" };
}

function ezzV6Brain(prompt) {
  const raw = String(prompt || "").toLowerCase();
  return {
    raw,
    p: ezzV6Palette(prompt),
    ripped: ezzV6Has(raw, "ripped", "distressed", "torn"),
    chains: ezzV6Has(raw, "chain", "chains"),
    stars: ezzV6Has(raw, "star", "stars"),
    hearts: ezzV6Has(raw, "heart", "hearts"),
    bows: ezzV6Has(raw, "bow", "bows", "ribbon", "coquette"),
    skull: ezzV6Has(raw, "skull", "skeleton"),
    cross: ezzV6Has(raw, "cross", "goth"),
    flames: ezzV6Has(raw, "flame", "fire"),
    lightning: ezzV6Has(raw, "lightning", "electric"),
    stripes: ezzV6Has(raw, "stripe", "striped"),
    checker: ezzV6Has(raw, "checker", "checkerboard"),
    plaid: ezzV6Has(raw, "plaid", "tartan"),
    camo: ezzV6Has(raw, "camo", "camouflage"),
    floral: ezzV6Has(raw, "floral", "flower"),
    y2k: ezzV6Has(raw, "y2k", "emo", "grunge", "cyber", "streetwear"),
    cute: ezzV6Has(raw, "cute", "girl", "girly", "coquette", "soft"),
  };
}

function ezzV6Canvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 585;
  canvas.height = 559;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,585,559);
  return { canvas, ctx };
}

function ezzV6Clip(ctx, panel, fn, bleed = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x - bleed, panel.y - bleed, panel.w + bleed * 2, panel.h + bleed * 2);
  ctx.clip();
  fn();
  ctx.restore();
}

function ezzV6Fill(ctx, panel, brain, opts = {}) {
  const p = brain.p;
  const fill = opts.color || p.base;
  const bleed = opts.bleed ?? 4;
  ezzV6Clip(ctx, panel, () => {
    ctx.fillStyle = fill;
    ctx.fillRect(panel.x - bleed, panel.y - bleed, panel.w + bleed*2, panel.h + bleed*2);

    // subtle fabric, not muddy
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let y = panel.y + 5; y < panel.y + panel.h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(panel.x, y);
      ctx.lineTo(panel.x + panel.w, y + Math.sin(y) * 0.8);
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
    grad.addColorStop(0, "rgba(255,255,255,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = grad;
    ctx.fillRect(panel.x-2, panel.y-2, panel.w+4, panel.h+4);

    if (brain.stripes) ezzV6Stripes(ctx, panel, brain);
    if (brain.checker) ezzV6Checker(ctx, panel, brain);
    if (brain.plaid) ezzV6Plaid(ctx, panel, brain);
    if (brain.floral) ezzV6Symbols(ctx, panel, "✿", brain);
    if (brain.stars) ezzV6Symbols(ctx, panel, "★", brain);
    if (brain.hearts) ezzV6Symbols(ctx, panel, "♡", brain);
  });
}

function ezzV6Line(ctx,x1,y1,x2,y2,color,width=1) {
  ctx.save();
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
  ctx.restore();
}

function ezzV6Round(ctx,x,y,w,h,r,fill,stroke) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fillStyle=fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke(); }
  ctx.restore();
}

function ezzV6Stripes(ctx, panel, brain) {
  ctx.fillStyle = ezzV6Rgba(brain.p.accent, 0.18);
  for (let y = panel.y + 8; y < panel.y + panel.h; y += 22) {
    ctx.fillRect(panel.x - 2, y, panel.w + 4, 7);
  }
}

function ezzV6Checker(ctx, panel, brain) {
  const s = 14;
  for (let y=panel.y; y<panel.y+panel.h; y+=s) for (let x=panel.x; x<panel.x+panel.w; x+=s) {
    if (((x+y)/s)%2<1) { ctx.fillStyle=ezzV6Rgba(brain.p.accent,0.16); ctx.fillRect(x,y,s,s); }
  }
}

function ezzV6Plaid(ctx, panel, brain) {
  for (let x=panel.x+8; x<panel.x+panel.w; x+=18) ezzV6Line(ctx,x,panel.y,x,panel.y+panel.h,ezzV6Rgba(brain.p.accent,0.20),2);
  for (let y=panel.y+8; y<panel.y+panel.h; y+=18) ezzV6Line(ctx,panel.x,y,panel.x+panel.w,y,ezzV6Rgba(brain.p.hi,0.16),2);
}

function ezzV6Symbols(ctx, panel, sym, brain) {
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ezzV6Rgba(brain.p.accent, 0.70);
  for (let i=0; i<4; i++) {
    ctx.fillText(sym, panel.x + 14 + (i*17)%Math.max(20,panel.w-20), panel.y + 20 + i*23);
  }
}

function ezzV6Rgba(hex, a) {
  if (!hex) return `rgba(255,255,255,${a})`;
  if (hex.startsWith("rgb")) return hex;
  const n = parseInt(hex.replace("#",""),16);
  const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  return `rgba(${r},${g},${b},${a})`;
}

function ezzV6Bow(ctx, x, y, brain) {
  const p = brain.p;
  ctx.save();
  ctx.fillStyle = ezzV6Rgba(p.accent, 0.85);
  ctx.beginPath(); ctx.ellipse(x-9,y,10,6,-0.35,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+9,y,10,6,0.35,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = p.hi;
  ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function ezzV6Icon(ctx, text, x, y, brain, size=24) {
  ctx.save();
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = brain.p.accent;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function ezzV6ExtraFront(ctx, panel, brain, kind) {
  ezzV6Clip(ctx, panel, () => {
    const x = panel.x + panel.w/2;
    const y = panel.y + (kind === "crop" ? 50 : 64);
    if (brain.bows) ezzV6Bow(ctx, x, y-14, brain);
    if (brain.skull) ezzV6Icon(ctx, "☠", x, y, brain, 30);
    if (brain.cross) ezzV6Icon(ctx, "✝", x, y, brain, 28);
    if (brain.hearts) ezzV6Icon(ctx, "♡", x, y, brain, 28);
    if (brain.lightning) ezzV6Icon(ctx, "ϟ", x, y, brain, 34);
  });
}

/* ----- V6 TOP DESIGNS ----- */

function ezzV6DrawShirt(prompt) {
  const brain = ezzV6Brain(prompt);
  const kind = ezzV6Kind(prompt, "Shirt");
  const { canvas, ctx } = ezzV6Canvas();
  const p = getPanels();

  EZZ_V6_COUNTER++;

  if (kind === "bikini") {
    // NO base. Only bikini panels.
    ezzV6DrawBikini(ctx, p, brain);
  } else if (kind === "tank") {
    ezzV6DrawTank(ctx, p, brain);
  } else if (kind === "crop" || kind === "babytee") {
    ezzV6DrawCrop(ctx, p, brain, kind);
  } else if (kind === "corset") {
    ezzV6DrawCorsetClean(ctx, p, brain);
  } else if (kind === "hoodie") {
    ezzV6DrawHoodieClean(ctx, p, brain);
  } else if (kind === "jacket") {
    ezzV6DrawJacketClean(ctx, p, brain);
  } else if (kind === "jersey") {
    ezzV6DrawJerseyClean(ctx, p, brain);
  } else if (kind === "blouse" || kind === "dress") {
    ezzV6DrawBlouseClean(ctx, p, brain, kind);
  } else if (kind === "suit") {
    ezzV6DrawSuitClean(ctx, p, brain);
  } else {
    ezzV6DrawBasicShirt(ctx, p, brain);
  }

  return canvas.toDataURL("image/png");
}

function ezzV6DrawBikini(ctx, p, brain) {
  // torso front
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x = p.torsoFront.x, y = p.torsoFront.y;
    ctx.fillStyle = brain.p.base;
    ctx.beginPath(); ctx.moveTo(x+18,y+33); ctx.lineTo(x+58,y+33); ctx.lineTo(x+38,y+72); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+110,y+33); ctx.lineTo(x+70,y+33); ctx.lineTo(x+90,y+72); ctx.closePath(); ctx.fill();
    ezzV6Line(ctx,x+38,y+32,x+28,y+8,ezzV6Rgba(brain.p.hi,0.65),2);
    ezzV6Line(ctx,x+90,y+32,x+100,y+8,ezzV6Rgba(brain.p.hi,0.65),2);
    ezzV6Line(ctx,x+57,y+33,x+71,y+33,ezzV6Rgba(brain.p.hi,0.75),2);
    if (brain.bows || brain.cute || brain.hearts) ezzV6Bow(ctx, x+64, y+41, brain);
    if (brain.stars) ezzV6Symbols(ctx, {x:x+18,y:y+33,w:92,h:42}, "★", brain);
  });

  // back strap only
  ezzV6Clip(ctx, p.torsoBack, () => {
    ezzV6Line(ctx,p.torsoBack.x+18,p.torsoBack.y+46,p.torsoBack.x+110,p.torsoBack.y+46,ezzV6Rgba(brain.p.base,0.9),5);
    ezzV6Line(ctx,p.torsoBack.x+26,p.torsoBack.y+46,p.torsoBack.x+38,p.torsoBack.y+14,ezzV6Rgba(brain.p.base,0.8),3);
    ezzV6Line(ctx,p.torsoBack.x+102,p.torsoBack.y+46,p.torsoBack.x+90,p.torsoBack.y+14,ezzV6Rgba(brain.p.base,0.8),3);
  });

  // side straps
  [p.torsoLeft, p.torsoRight].forEach(side => {
    ezzV6Clip(ctx, side, () => {
      ezzV6Line(ctx, side.x+8, side.y+47, side.x+side.w-8, side.y+47, ezzV6Rgba(brain.p.base,0.9),4);
    });
  });
}

function ezzV6DrawTank(ctx, p, brain) {
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp].forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    ctx.clearRect(p.torsoFront.x+36,p.torsoFront.y-1,56,18);
    ctx.clearRect(p.torsoFront.x-2,p.torsoFront.y,p.torsoFront.w+4,10);
    ezzV6Line(ctx,p.torsoFront.x+28,p.torsoFront.y+20,p.torsoFront.x+100,p.torsoFront.y+20,ezzV6Rgba(brain.p.hi,0.28),2);
    ezzV6Line(ctx,p.torsoFront.x+30,p.torsoFront.y+20,p.torsoFront.x+45,p.torsoFront.y+5,ezzV6Rgba(brain.p.hi,0.42),3);
    ezzV6Line(ctx,p.torsoFront.x+98,p.torsoFront.y+20,p.torsoFront.x+83,p.torsoFront.y+5,ezzV6Rgba(brain.p.hi,0.42),3);
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "tank");
}

function ezzV6DrawCrop(ctx, p, brain, kind) {
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp].forEach(panel => ezzV6Fill(ctx, panel, brain));
  [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.fillStyle = brain.p.base;
      ctx.fillRect(panel.x-3,panel.y-3,panel.w+6,panel.h*0.36);
      ctx.fillStyle = ezzV6Rgba(brain.p.shade,0.35);
      ctx.fillRect(panel.x-3,panel.y+panel.h*0.30,panel.w+6,8);
    });
  });
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight].forEach(panel => {
    ctx.clearRect(panel.x-4, panel.y+panel.h*0.72, panel.w+8, panel.h*0.30);
  });
  ezzV6Clip(ctx, p.torsoFront, () => {
    ezzV6Line(ctx,p.torsoFront.x+10,p.torsoFront.y+92,p.torsoFront.x+118,p.torsoFront.y+92,ezzV6Rgba(brain.p.hi,0.34),2);
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "crop");
}

function ezzV6DrawCorsetClean(ctx, p, brain) {
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp,p.torsoDown].forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ctx.fillStyle=ezzV6Rgba(brain.p.shade,0.55);
    ctx.beginPath(); ctx.moveTo(x+22,y+8); ctx.lineTo(x+106,y+8); ctx.lineTo(x+92,y+118); ctx.lineTo(x+36,y+118); ctx.closePath(); ctx.fill();
    for (let yy=y+24; yy<y+106; yy+=16) {
      ezzV6Line(ctx,x+50,yy,x+78,yy+10,ezzV6Rgba(brain.p.hi,0.60),1.5);
      ezzV6Line(ctx,x+78,yy,x+50,yy+10,ezzV6Rgba(brain.p.hi,0.60),1.5);
    }
    if (brain.bows) ezzV6Bow(ctx,x+64,y+18,brain);
  });
}

function ezzV6DrawHoodieClean(ctx, p, brain) {
  Object.values(p).forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ezzV6Line(ctx,x+64,y+10,x+64,y+120,ezzV6Rgba(brain.p.hi,0.35),2);
    ezzV6Line(ctx,x+50,y+30,x+40,y+76,ezzV6Rgba(brain.p.hi,0.65),2);
    ezzV6Line(ctx,x+78,y+30,x+88,y+76,ezzV6Rgba(brain.p.hi,0.65),2);
    ezzV6Round(ctx,x+24,y+82,80,32,8,ezzV6Rgba(brain.p.shade,0.38),ezzV6Rgba(brain.p.hi,0.16));
    ctx.strokeStyle=ezzV6Rgba(brain.p.hi,0.28); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+64,y+20,27,0.12*Math.PI,0.88*Math.PI); ctx.stroke();
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "hoodie");
}

function ezzV6DrawJacketClean(ctx, p, brain) {
  Object.values(p).forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ezzV6Line(ctx,x+64,y+6,x+64,y+122,ezzV6Rgba(brain.p.hi,0.40),2);
    ctx.fillStyle=ezzV6Rgba(brain.p.accent,0.18);
    ctx.beginPath(); ctx.moveTo(x+18,y+12); ctx.lineTo(x+52,y+12); ctx.lineTo(x+38,y+44); ctx.lineTo(x+20,y+34); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+110,y+12); ctx.lineTo(x+76,y+12); ctx.lineTo(x+90,y+44); ctx.lineTo(x+108,y+34); ctx.closePath(); ctx.fill();
    ezzV6Round(ctx,x+14,y+84,28,22,4,ezzV6Rgba(brain.p.shade,0.35),ezzV6Rgba(brain.p.hi,0.12));
    ezzV6Round(ctx,x+86,y+84,28,22,4,ezzV6Rgba(brain.p.shade,0.35),ezzV6Rgba(brain.p.hi,0.12));
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "jacket");
}

function ezzV6DrawJerseyClean(ctx, p, brain) {
  Object.values(p).forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ctx.strokeStyle=ezzV6Rgba(brain.p.hi,0.45); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+42,y+8); ctx.lineTo(x+64,y+35); ctx.lineTo(x+86,y+8); ctx.stroke();
    ctx.fillStyle=ezzV6Rgba(brain.p.hi,0.88); ctx.font="bold 44px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("07",x+64,y+78);
  });
}

function ezzV6DrawBlouseClean(ctx, p, brain, kind) {
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp,p.torsoDown].forEach(panel => ezzV6Fill(ctx, panel, brain));
  [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.fillStyle=brain.p.base; ctx.fillRect(panel.x-3,panel.y-3,panel.w+6,panel.h*0.44);
    });
  });
  ezzV6Clip(ctx, p.torsoFront, () => {
    ezzV6Line(ctx,p.torsoFront.x+26,p.torsoFront.y+20,p.torsoFront.x+102,p.torsoFront.y+20,ezzV6Rgba(brain.p.hi,0.35),2);
    if (brain.bows || kind==="dress") ezzV6Bow(ctx,p.torsoFront.x+64,p.torsoFront.y+42,brain);
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, kind);
}

function ezzV6DrawSuitClean(ctx, p, brain) {
  Object.values(p).forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ctx.fillStyle=ezzV6Rgba(brain.p.hi,0.85); ctx.fillRect(x+48,y+8,32,116);
    ctx.fillStyle=ezzV6Rgba(brain.p.shade,0.55);
    ctx.beginPath(); ctx.moveTo(x+5,y+8); ctx.lineTo(x+58,y+55); ctx.lineTo(x+40,y+124); ctx.lineTo(x+5,y+124); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+123,y+8); ctx.lineTo(x+70,y+55); ctx.lineTo(x+88,y+124); ctx.lineTo(x+123,y+124); ctx.closePath(); ctx.fill();
    ctx.fillStyle=brain.p.accent; ctx.beginPath(); ctx.moveTo(x+60,y+32); ctx.lineTo(x+68,y+32); ctx.lineTo(x+74,y+104); ctx.lineTo(x+64,y+118); ctx.lineTo(x+54,y+104); ctx.closePath(); ctx.fill();
  });
}

function ezzV6DrawBasicShirt(ctx, p, brain) {
  Object.values(p).forEach(panel => ezzV6Fill(ctx, panel, brain));
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x=p.torsoFront.x,y=p.torsoFront.y;
    ctx.strokeStyle=ezzV6Rgba(brain.p.hi,0.28); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x+64,y+14,26,0,Math.PI); ctx.stroke();
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "shirt");
}

/* ----- V6 PANTS ----- */

function ezzV6DrawPants(prompt) {
  const brain = ezzV6Brain(prompt);
  const kind = ezzV6Kind(prompt, "Pants");
  const { canvas, ctx } = ezzV6Canvas();
  const p = getPanels();

  const legPanels = [p.rightL,p.rightB,p.rightR,p.rightF,p.rightU,p.rightD,p.leftL,p.leftB,p.leftR,p.leftF,p.leftU,p.leftD];
  const waistPanels = [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp,p.torsoDown];

  if (kind === "skirt") {
    waistPanels.forEach(panel => ezzV6Fill(ctx, panel, brain));
    [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
      ezzV6Clip(ctx, panel, () => {
        ctx.fillStyle=brain.p.base;
        ctx.fillRect(panel.x-4,panel.y-4,panel.w+8,panel.h*0.62);
        if (brain.plaid) ezzV6Plaid(ctx, panel, brain);
        ezzV6Line(ctx,panel.x+2,panel.y+panel.h*0.60,panel.x+panel.w-2,panel.y+panel.h*0.60,ezzV6Rgba(brain.p.hi,0.35),2);
      });
    });
  } else if (kind === "shorts") {
    waistPanels.forEach(panel => ezzV6Fill(ctx, panel, brain));
    [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
      ezzV6Clip(ctx, panel, () => {
        ctx.fillStyle=brain.p.base;
        ctx.fillRect(panel.x-4,panel.y-4,panel.w+8,panel.h*0.55);
        ezzV6Line(ctx,panel.x+2,panel.y+panel.h*0.53,panel.x+panel.w-2,panel.y+panel.h*0.53,ezzV6Rgba(brain.p.hi,0.35),2);
      });
    });
  } else {
    [...waistPanels, ...legPanels].forEach(panel => ezzV6Fill(ctx, panel, brain));
  }

  // waistband
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.clearRect(panel.x, panel.y+42, panel.w, panel.h-42);
      ctx.fillStyle=ezzV6Rgba(brain.p.shade,0.42);
      ctx.fillRect(panel.x-2,panel.y+6,panel.w+4,26);
      ezzV6Line(ctx,panel.x+6,panel.y+34,panel.x+panel.w-6,panel.y+34,ezzV6Rgba(brain.p.hi,0.28),2);
    });
  });

  [p.rightF,p.leftF].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ezzV6Line(ctx,panel.x+panel.w/2,panel.y+4,panel.x+panel.w/2,panel.y+panel.h-6,ezzV6Rgba(brain.p.hi,0.15),1);
      if (brain.ripped) {
        for (let i=0;i<3;i++) {
          const yy=panel.y+36+i*26;
          ezzV6Line(ctx,panel.x+10,yy,panel.x+panel.w-10,yy-4,ezzV6Rgba(brain.p.hi,0.75),2);
          ezzV6Line(ctx,panel.x+12,yy+4,panel.x+panel.w-12,yy+1,"rgba(0,0,0,0.25)",4);
        }
      }
      if (brain.chains) {
        for (let y=panel.y+16;y<panel.y+98;y+=13) {
          ctx.strokeStyle=ezzV6Rgba(brain.p.hi,0.8); ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(panel.x+panel.w-16,y,7,4,0.5,0,Math.PI*2); ctx.stroke();
        }
      }
    });
  });

  return canvas.toDataURL("image/png");
}

/* override main creators */
createSmartShirt = function(prompt) {
  return ezzV6DrawShirt(prompt);
};

createSmartPants = function(prompt) {
  return ezzV6DrawPants(prompt);
};

function ezzV6AddVariationButton() {
  const generate = document.querySelector("#generateBtn, #generate");
  if (!generate || document.querySelector("#randomizeBtn")) return;
  const btn = document.createElement("button");
  btn.id = "randomizeBtn";
  btn.textContent = "Random Variation 🎲";
  btn.style.marginTop = "10px";
  btn.style.width = "100%";
  btn.addEventListener("click", () => {
    const extras = ["stars", "bows", "stripes", "hearts", "y2k", "checker", "chrome", "flames", "cross", "chains"];
    const pick = extras[Math.floor(Math.random() * extras.length)];
    promptInput.value = (promptInput.value.trim() || "pink top") + " " + pick;
    generate.click();
  });
  generate.insertAdjacentElement("afterend", btn);
}
ezzV6AddVariationButton();

/* =======================================
   EZZAI V7 NO AUTO STRIPES
   Removes forced fabric lines.
   Patterns only appear when requested.
   Adds cleaner hoodie / shirt details.
======================================= */

function ezzV7SoftShade(ctx, panel, brain, amount = 0.10) {
  ezzV6Clip(ctx, panel, () => {
    const grad = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
    grad.addColorStop(0, `rgba(255,255,255,${amount})`);
    grad.addColorStop(0.55, "rgba(255,255,255,0.00)");
    grad.addColorStop(1, `rgba(0,0,0,${amount})`);
    ctx.fillStyle = grad;
    ctx.fillRect(panel.x - 2, panel.y - 2, panel.w + 4, panel.h + 4);
  });
}

function ezzV7Fill(ctx, panel, brain, opts = {}) {
  const p = brain.p;
  const fill = opts.color || p.base;
  const bleed = opts.bleed ?? 4;

  ezzV6Clip(ctx, panel, () => {
    ctx.fillStyle = fill;
    ctx.fillRect(panel.x - bleed, panel.y - bleed, panel.w + bleed * 2, panel.h + bleed * 2);

    // No automatic stripy fabric lines. Only a soft shadow.
    const shade = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
    shade.addColorStop(0, "rgba(255,255,255,0.08)");
    shade.addColorStop(0.5, "rgba(255,255,255,0.00)");
    shade.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = shade;
    ctx.fillRect(panel.x - 2, panel.y - 2, panel.w + 4, panel.h + 4);

    // Only draw these if the prompt asks for them.
    if (brain.stripes) ezzV6Stripes(ctx, panel, brain);
    if (brain.checker) ezzV6Checker(ctx, panel, brain);
    if (brain.plaid) ezzV6Plaid(ctx, panel, brain);
    if (brain.floral) ezzV6Symbols(ctx, panel, "✿", brain);
    if (brain.stars) ezzV6Symbols(ctx, panel, "★", brain);
    if (brain.hearts) ezzV6Symbols(ctx, panel, "♡", brain);
  });
}

function ezzV7FillMany(ctx, panels, brain, opts = {}) {
  panels.forEach(panel => ezzV7Fill(ctx, panel, brain, opts));
}

function ezzV7DrawSeam(ctx, panel, brain, type = "panel") {
  const c = brain.p;
  ezzV6Clip(ctx, panel, () => {
    if (type === "side") {
      ezzV6Line(ctx, panel.x + 5, panel.y + 7, panel.x + 5, panel.y + panel.h - 7, ezzV6Rgba(c.hi, 0.12), 1);
      ezzV6Line(ctx, panel.x + panel.w - 5, panel.y + 7, panel.x + panel.w - 5, panel.y + panel.h - 7, "rgba(0,0,0,0.12)", 1);
    } else {
      ezzV6Line(ctx, panel.x + 4, panel.y + 4, panel.x + panel.w - 4, panel.y + 4, ezzV6Rgba(c.hi, 0.10), 1);
    }
  });
}

function ezzV7DrawHoodie(ctx, p, brain) {
  const panels = Object.values(p);
  ezzV7FillMany(ctx, panels, brain);

  // Sleeves have subtle cuff blocks, not stripes.
  [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
    ezzV7DrawSeam(ctx, panel, brain, "side");
    ezzV6Clip(ctx, panel, () => {
      ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.22);
      ctx.fillRect(panel.x + 6, panel.y + panel.h - 26, panel.w - 12, 16);
      if (brain.y2k || brain.raw.includes("two tone") || brain.raw.includes("accent")) {
        ctx.fillStyle = ezzV6Rgba(brain.p.accent, 0.22);
        ctx.fillRect(panel.x + 7, panel.y + 14, panel.w - 14, 18);
      }
    });
  });

  [p.rightD,p.leftD,p.torsoDown].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.34);
      ctx.fillRect(panel.x - 2, panel.y - 2, panel.w + 4, panel.h + 4);
    });
  });

  ezzV6Clip(ctx, p.torsoFront, () => {
    const x = p.torsoFront.x, y = p.torsoFront.y;
    // body side shading
    ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.18);
    ctx.fillRect(x + 8, y + 8, 20, 112);
    ctx.fillRect(x + 100, y + 8, 20, 112);

    // hood neck
    ctx.strokeStyle = ezzV6Rgba(brain.p.hi, 0.30);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 64, y + 20, 28, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();

    // zipper and drawstrings
    ezzV6Line(ctx, x + 64, y + 12, x + 64, y + 119, ezzV6Rgba(brain.p.hi, 0.28), 2);
    ezzV6Line(ctx, x + 51, y + 32, x + 42, y + 76, ezzV6Rgba(brain.p.hi, 0.65), 2);
    ezzV6Line(ctx, x + 77, y + 32, x + 86, y + 76, ezzV6Rgba(brain.p.hi, 0.65), 2);

    // pocket
    ezzV6Round(ctx, x + 25, y + 82, 78, 32, 8, ezzV6Rgba(brain.p.shade, 0.36), ezzV6Rgba(brain.p.hi, 0.18));

    // chest graphic
    if (brain.lightning) ezzV6Icon(ctx, "ϟ", x + 64, y + 60, brain, 32);
    if (brain.skull) ezzV6Icon(ctx, "☠", x + 64, y + 60, brain, 30);
    if (brain.hearts) ezzV6Icon(ctx, "♡", x + 64, y + 60, brain, 30);
    if (brain.cross) ezzV6Icon(ctx, "✝", x + 64, y + 60, brain, 28);
  });

  ezzV6Clip(ctx, p.torsoBack, () => {
    const x = p.torsoBack.x, y = p.torsoBack.y;
    ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.16);
    ctx.fillRect(x + 16, y + 14, 96, 96);
    ezzV6Line(ctx, x + 16, y + 25, x + 112, y + 25, ezzV6Rgba(brain.p.hi, 0.12), 2);
    if (brain.skull) ezzV6Icon(ctx, "☠", x + 64, y + 64, brain, 34);
    if (brain.lightning) ezzV6Icon(ctx, "ϟ", x + 64, y + 64, brain, 36);
  });
}

function ezzV7DrawBasicShirt(ctx, p, brain) {
  ezzV7FillMany(ctx, Object.values(p), brain);

  [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
    ezzV7DrawSeam(ctx, panel, brain, "side");
  });

  ezzV6Clip(ctx, p.torsoFront, () => {
    const x = p.torsoFront.x, y = p.torsoFront.y;
    ctx.strokeStyle = ezzV6Rgba(brain.p.hi, 0.30);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 64, y + 14, 27, 0, Math.PI);
    ctx.stroke();

    // chest panel / graphic area
    ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.10);
    ctx.fillRect(x + 18, y + 36, 92, 52);

    if (brain.skull) ezzV6Icon(ctx, "☠", x + 64, y + 62, brain, 30);
    if (brain.hearts) ezzV6Icon(ctx, "♡", x + 64, y + 62, brain, 30);
    if (brain.stars) ezzV6Icon(ctx, "★", x + 64, y + 62, brain, 28);
    if (brain.lightning) ezzV6Icon(ctx, "ϟ", x + 64, y + 62, brain, 32);
  });
}

function ezzV7DrawBikini(ctx, p, brain) {
  // Transparent unused panels. Bigger bikini than V6.
  ezzV6Clip(ctx, p.torsoFront, () => {
    const x = p.torsoFront.x, y = p.torsoFront.y;
    ctx.fillStyle = brain.p.base;

    // Bigger cups
    ctx.beginPath();
    ctx.ellipse(x + 42, y + 57, 26, 23, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 86, y + 57, 26, 23, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Inner shading
    ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.22);
    ctx.beginPath();
    ctx.ellipse(x + 42, y + 59, 17, 14, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 86, y + 59, 17, 14, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Straps
    ezzV6Line(ctx, x + 42, y + 35, x + 28, y + 8, ezzV6Rgba(brain.p.base, 0.95), 4);
    ezzV6Line(ctx, x + 86, y + 35, x + 100, y + 8, ezzV6Rgba(brain.p.base, 0.95), 4);
    ezzV6Line(ctx, x + 17, y + 58, x + 111, y + 58, ezzV6Rgba(brain.p.base, 0.55), 3);

    if (brain.bows || brain.cute || brain.hearts) ezzV6Bow(ctx, x + 64, y + 56, brain);
    if (brain.stars) ezzV6Symbols(ctx, {x:x+18,y:y+34,w:92,h:46}, "★", brain);
  });

  ezzV6Clip(ctx, p.torsoBack, () => {
    ezzV6Line(ctx, p.torsoBack.x + 18, p.torsoBack.y + 49, p.torsoBack.x + 110, p.torsoBack.y + 49, ezzV6Rgba(brain.p.base, 0.95), 5);
    ezzV6Line(ctx, p.torsoBack.x + 30, p.torsoBack.y + 49, p.torsoBack.x + 42, p.torsoBack.y + 14, ezzV6Rgba(brain.p.base, 0.90), 3);
    ezzV6Line(ctx, p.torsoBack.x + 98, p.torsoBack.y + 49, p.torsoBack.x + 86, p.torsoBack.y + 14, ezzV6Rgba(brain.p.base, 0.90), 3);
  });

  [p.torsoLeft, p.torsoRight].forEach(side => {
    ezzV6Clip(ctx, side, () => {
      ezzV6Line(ctx, side.x + 8, side.y + 49, side.x + side.w - 8, side.y + 49, ezzV6Rgba(brain.p.base, 0.95), 5);
    });
  });
}

function ezzV7DrawCrop(ctx, p, brain, kind) {
  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp].forEach(panel => ezzV7Fill(ctx, panel, brain));

  // short sleeves only
  [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.fillStyle = brain.p.base;
      ctx.fillRect(panel.x - 3, panel.y - 3, panel.w + 6, panel.h * 0.36);
      ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.22);
      ctx.fillRect(panel.x - 3, panel.y + panel.h * 0.30, panel.w + 6, 8);
    });
  });

  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight].forEach(panel => {
    ctx.clearRect(panel.x - 4, panel.y + panel.h * 0.72, panel.w + 8, panel.h * 0.30);
  });

  ezzV6Clip(ctx, p.torsoFront, () => {
    ezzV6Line(ctx, p.torsoFront.x + 10, p.torsoFront.y + 92, p.torsoFront.x + 118, p.torsoFront.y + 92, ezzV6Rgba(brain.p.hi,0.34), 2);
  });
  ezzV6ExtraFront(ctx, p.torsoFront, brain, "crop");
}

function ezzV7DrawPants(prompt) {
  const brain = ezzV6Brain(prompt);
  const kind = ezzV6Kind(prompt, "Pants");
  const { canvas, ctx } = ezzV6Canvas();
  const p = getPanels();

  const legPanels = [p.rightL,p.rightB,p.rightR,p.rightF,p.rightU,p.rightD,p.leftL,p.leftB,p.leftR,p.leftF,p.leftU,p.leftD];
  const waistPanels = [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight,p.torsoUp,p.torsoDown];

  if (kind === "skirt") {
    waistPanels.forEach(panel => ezzV7Fill(ctx, panel, brain));
    [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
      ezzV6Clip(ctx, panel, () => {
        ctx.fillStyle = brain.p.base;
        ctx.fillRect(panel.x - 4, panel.y - 4, panel.w + 8, panel.h * 0.62);
        if (brain.plaid) ezzV6Plaid(ctx, panel, brain);
        ezzV6Line(ctx, panel.x + 2, panel.y + panel.h * 0.60, panel.x + panel.w - 2, panel.y + panel.h * 0.60, ezzV6Rgba(brain.p.hi,0.35), 2);
      });
    });
  } else if (kind === "shorts") {
    waistPanels.forEach(panel => ezzV7Fill(ctx, panel, brain));
    [p.rightF,p.rightB,p.rightL,p.rightR,p.leftF,p.leftB,p.leftL,p.leftR].forEach(panel => {
      ezzV6Clip(ctx, panel, () => {
        ctx.fillStyle = brain.p.base;
        ctx.fillRect(panel.x - 4, panel.y - 4, panel.w + 8, panel.h * 0.55);
        ezzV6Line(ctx, panel.x + 2, panel.y + panel.h * 0.53, panel.x + panel.w - 2, panel.y + panel.h * 0.53, ezzV6Rgba(brain.p.hi,0.35), 2);
      });
    });
  } else {
    [...waistPanels, ...legPanels].forEach(panel => ezzV7Fill(ctx, panel, brain));
  }

  [p.torsoFront,p.torsoBack,p.torsoLeft,p.torsoRight].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ctx.clearRect(panel.x, panel.y + 42, panel.w, panel.h - 42);
      ctx.fillStyle = ezzV6Rgba(brain.p.shade, 0.34);
      ctx.fillRect(panel.x - 2, panel.y + 6, panel.w + 4, 26);
      ezzV6Line(ctx, panel.x + 6, panel.y + 34, panel.x + panel.w - 6, panel.y + 34, ezzV6Rgba(brain.p.hi,0.28), 2);
    });
  });

  [p.rightF,p.leftF].forEach(panel => {
    ezzV6Clip(ctx, panel, () => {
      ezzV6Line(ctx, panel.x + panel.w / 2, panel.y + 4, panel.x + panel.w / 2, panel.y + panel.h - 6, ezzV6Rgba(brain.p.hi,0.15), 1);
      if (brain.ripped) {
        for (let i=0;i<3;i++) {
          const yy = panel.y + 36 + i * 26;
          ezzV6Line(ctx, panel.x + 10, yy, panel.x + panel.w - 10, yy - 4, ezzV6Rgba(brain.p.hi,0.75), 2);
          ezzV6Line(ctx, panel.x + 12, yy + 4, panel.x + panel.w - 12, yy + 1, "rgba(0,0,0,0.25)", 4);
        }
      }
    });
  });

  return canvas.toDataURL("image/png");
}

createSmartShirt = function(prompt) {
  const brain = ezzV6Brain(prompt);
  const kind = ezzV6Kind(prompt, "Shirt");
  const { canvas, ctx } = ezzV6Canvas();
  const p = getPanels();

  if (kind === "bikini") {
    ezzV7DrawBikini(ctx, p, brain);
  } else if (kind === "crop" || kind === "babytee") {
    ezzV7DrawCrop(ctx, p, brain, kind);
  } else if (kind === "hoodie") {
    ezzV7DrawHoodie(ctx, p, brain);
  } else if (kind === "jacket") {
    ezzV7DrawJacket(ctx, p, brain);
  } else {
    ezzV7DrawBasicShirt(ctx, p, brain);
  }

  return canvas.toDataURL("image/png");
};

createSmartPants = function(prompt) {
  return ezzV7DrawPants(prompt);
};
