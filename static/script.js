let images = [];
let selected = [];
let strict = false;

let page = 1;
let loading = false;
let hasMore = true;

let allSubjects = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadSubjects();
    await loadMore();
    setupScroll();
});

// ===== LOAD SUBJECTS =====
async function loadSubjects() {
    const res = await fetch("/api/subjects");
    allSubjects = await res.json();
    renderOptions();
}

// ===== LOAD IMAGES =====
async function loadMore(reset = false) {
    if (loading || (!hasMore && !reset)) return;

    loading = true;

    const params = new URLSearchParams({
        page: page,
        limit: 30,
        selected: selected.join(","),
        strict: strict ? "1" : "0"
    });

    const res = await fetch(`/api/images?${params}`);
    const json = await res.json();

    hasMore = json.has_more;
    page++;

    images = images.concat(json.data);

    renderGallery();
    loading = false;
}

// ===== RESET + FILTER =====
function applyFilter() {
    page = 1;
    images = [];
    hasMore = true;

    document.getElementById("gallery").innerHTML = "";

    loadMore(true);
}

// ===== SCROLL =====
function setupScroll() {
    window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
            loadMore();
        }
    });
}

// ===== TOGGLE FILTER =====
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

// ===== UI =====
function renderOptions() {
    document.getElementById("optionsList").innerHTML =
        allSubjects.map(s => `
            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" onchange="toggleSubject('${s}')">
                ${s}
            </label>
        `).join("");
}

function renderGallery() {
    document.getElementById("gallery").innerHTML =
        images.map(img => `
            <div class="gallery-card border border-white/10 rounded-xl overflow-hidden">

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

document.addEventListener("click", async (e) => {
    const el = e.target;

    if (el.tagName === "A" && el.textContent.trim() === "Download") {
        e.preventDefault();

        const url = el.href;
        const filename = url.split("/").pop();

        const res = await fetch(url);
        const blob = await res.blob();

        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(blobUrl);
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    const isOpen = !sidebar.classList.contains("-translate-x-full");

    if (isOpen) {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
    } else {
        sidebar.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
    }
}