let images = [];
let selected = [];
let strict = false;

// INIT
document.addEventListener("DOMContentLoaded", () => {
    images = JSON.parse(document.getElementById("data").dataset.images);

    renderOptions();
    renderGallery();
    updateCounter();
});

// ===== SIDEBAR MOBILE =====
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    const open = sidebar.classList.contains("-translate-x-full");

    if (open) {
        sidebar.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
    } else {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
    }
}

// ===== FILTER OPTIONS =====
function renderOptions() {
    const set = new Set();
    images.forEach(i => i.subjects.forEach(s => set.add(s)));

    document.getElementById("optionsList").innerHTML =
        [...set].map(s => `
            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" onchange="toggleSubject('${s}')">
                ${s}
            </label>
        `).join("");
}

// ===== GALLERY =====
function renderGallery() {
    document.getElementById("gallery").innerHTML =
        images.map(img => `
            <div class="gallery-card border border-white/10 rounded-xl overflow-hidden"
                 data-subjects="${img.subjects.join(",")}">

                <img src="${img.img_src}" class="w-full h-56 object-cover">

                <div class="p-3">
                    <div class="flex flex-wrap gap-1 mb-2">
                        ${img.subjects.map(s => `
                            <span class="text-xs px-2 py-1 bg-white/10 rounded">${s}</span>
                        `).join("")}
                    </div>

                    <div class="flex gap-2 text-sm">
                        <a href="${img.view_link}" target="_blank">View</a>
                        <a href="${img.download_link}" target="_blank">Download</a>
                    </div>
                </div>
            </div>
        `).join("");
}

// ===== FILTER =====
function toggleSubject(s) {
    selected = selected.includes(s)
        ? selected.filter(x => x !== s)
        : [...selected, s];

    applyFilter();
}

function toggleStrict() {
    strict = !strict;
    applyFilter();
}

function applyFilter() {
    const cards = document.querySelectorAll(".gallery-card");

    let visible = 0;

    cards.forEach(card => {
        const subjects = card.dataset.subjects.split(",");

        const ok = selected.length === 0
            ? true
            : (strict
                ? selected.every(s => subjects.includes(s))
                : selected.some(s => subjects.includes(s)));

        card.style.display = ok ? "" : "none";
        if (ok) visible++;
    });

    document.getElementById("imageCounter").textContent =
        `${visible} / ${images.length} ảnh`;
}

// ===== COUNTER =====
function updateCounter() {
    document.getElementById("imageCounter").textContent =
        `${images.length} ảnh`;
}