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

  previewTitle.textContent = "Generating real image...";
  previewBox.innerHTML = `<div class="loading-ring" aria-label="Loading"></div>`;

  try {
    const response = await fetch("/.netlify/functions/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        assetType: selectedType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed. Check your API key and billing.");
    }

    lastGeneratedImage = data.image;
    lastPrompt = prompt;
    previewTitle.textContent = `${selectedType} image ready`;

    previewBox.innerHTML = `
      <div class="generated-card">
        <img src="${data.image}" alt="Generated Roblox design" style="width:100%; border-radius:20px;" />
        <p>Generated from: ${escapeHTML(prompt)}</p>
      </div>
    `;
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
  link.download = "ezzcustoms-generated-design.png";
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

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[match]));
}
