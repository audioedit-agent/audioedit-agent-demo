const methodOrder = [
  ["before", "Original"],
  ["agent", "Audio Edit Agent"],
  ["zeta", "ZETA"],
  ["audioeditor", "AudioEditor"],
  ["mmedit", "MMEdit"],
  ["sao-instruct", "SAO-instruct"],
];

function text(value) {
  return value == null ? "" : String(value);
}

function mediaPath(src) {
  if (!src) return "";
  const marker = "/project_demo_cases/";
  const idx = src.indexOf(marker);
  if (idx >= 0) return src.slice(idx + marker.length);
  return src;
}

function audioCell(caseItem, key, label) {
  const src = mediaPath(caseItem.audio?.[key]);
  const cls = key === "agent" ? "audio-cell ours" : "audio-cell";
  return `
    <div class="${cls}">
      <span class="audio-label">${label}</span>
      <audio controls preload="none" src="${src || ""}"></audio>
    </div>
  `;
}

function caseBlock(caseItem, idx) {
  const steps = Array.isArray(caseItem.steps) && caseItem.steps.length
    && caseItem.group !== "multiturn"
    ? `<div class="steps"><b>Steps:</b> ${caseItem.steps.map((s) => text(s.instruction)).join(" / ")}</div>`
    : "";
  const promptGrid = caseItem.group === "multiturn"
    ? `
          <div class="prompt-grid prompt-grid-single">
            <div class="prompt-box">
              <b>Edit Instruction</b>
              <span>${text(caseItem.edit_instruction)}</span>
            </div>
          </div>`
    : `
          <div class="prompt-grid prompt-grid-two">
            <div class="prompt-box">
              <b>Source Prompt</b>
              <span>${text(caseItem.source_prompt)}</span>
            </div>
            <div class="prompt-box">
              <b>Target Prompt</b>
              <span>${text(caseItem.target_prompt)}</span>
            </div>
          </div>`;

  return `
    <article class="case-block">
      <div class="case-head">
        <div class="case-index">Demo ${idx}</div>
        <div>
          ${promptGrid}
          ${steps}
        </div>
      </div>
      <div class="audio-grid">
        ${methodOrder.map(([key, label]) => audioCell(caseItem, key, label)).join("")}
      </div>
    </article>
  `;
}

async function loadManifest() {
  const response = await fetch("manifest.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load manifest.json: ${response.status}`);
  }
  return response.json();
}

function render(manifest) {
  const groups = new Map();
  for (const item of manifest.cases || []) {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group).push(item);
  }

  document.querySelectorAll("[data-group]").forEach((section) => {
    const group = section.dataset.group;
    const target = section.querySelector(".sample-table");
    const cases = groups.get(group) || [];
    target.innerHTML = cases.map((item, index) => caseBlock(item, index + 1)).join("");
  });

  setupFilters();
}

function setupFilters() {
  const buttons = Array.from(document.querySelectorAll(".tabs [data-filter]"));
  const sections = Array.from(document.querySelectorAll("[data-group]"));

  function applyFilter(filter) {
    buttons.forEach((button) => button.classList.toggle("active", button.dataset.filter === filter));
    sections.forEach((section) => {
      section.hidden = filter !== "all" && section.dataset.group !== filter;
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  const hashToFilter = {
    "#single-add": "single_add",
    "#single-remove": "single_remove",
    "#single-replace": "single_replace",
    "#multiturn": "multiturn",
  };
  applyFilter(hashToFilter[window.location.hash] || "all");
}

loadManifest()
  .then(render)
  .catch((error) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<p class="wrap" style="color:#b00020;">${error.message}</p>`
    );
  });
