let images = [];
let selected = [];
let strict = false;

let page = 1;
let loading = false;
let hasMore = true;
let allSubjects = [];

const gallery = document.getElementById("gallery");

// ===== KHỞI TẠO =====
document.addEventListener("DOMContentLoaded", async () => {
    readParamsFromURL();
    await loadSubjects();
    await loadMore();
    setupScroll();
});

// ===== URL =====
function readParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    selected = (params.get("subject") || "").split(",").filter(Boolean);
    strict   = params.get("strict") === "1";
}

function pushToURL() {
    const params = new URLSearchParams();
    if (selected.length) params.set("subject", selected.join(","));
    if (strict)          params.set("strict", "1");
    const newURL = params.toString()
        ? `${location.pathname}?${params}`
        : location.pathname;
    history.pushState({}, "", newURL);
}

// ===== LOAD =====
async function loadSubjects() {
    const res  = await fetch("/api/subjects");
    allSubjects = await res.json();
    renderOptions();
}

async function loadMore(reset = false) {
    if (loading || (!hasMore && !reset)) return;
    loading = true;

    const params = new URLSearchParams({
        page, limit: 30,
        selected: selected.join(","),
        strict: strict ? "1" : "0",
    });

    const res  = await fetch(`/api/images?${params}`);
    const json = await res.json();

    hasMore = json.has_more;
    page++;

    // APPEND thay vì re-render toàn bộ
    appendToGallery(json.data);
    loading = false;
}

// ===== FILTER =====
function applyFilter() {
    page   = 1;
    images = [];
    hasMore = true;
    gallery.innerHTML = "";
    loadMore(true);
}

// ===== SCROLL (IntersectionObserver — tốt hơn scroll event) =====
function setupScroll() {
    const sentinel = document.createElement("div");
    sentinel.id = "sentinel";
    document.body.appendChild(sentinel);

    new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "400px" }).observe(sentinel);
}

// ===== BROWSER NAV =====
window.addEventListener("popstate", () => {
    readParamsFromURL();
    page   = 1;
    images = [];
    hasMore = true;
    gallery.innerHTML = "";
    renderOptions();
    loadMore(true);
});

// ===== TOGGLE =====
function toggleSubject(s) {
    selected = selected.includes(s)
        ? selected.filter(x => x !== s)
        : [...selected, s];
    pushToURL();
    applyFilter();
}

function toggleStrict() {
    strict = !strict;
    pushToURL();
    applyFilter();
}

// ===== UI =====
function renderOptions() {
    document.getElementById("optionsList").innerHTML = allSubjects.map(s => `
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" ${selected.includes(s) ? "checked" : ""}
                onchange="toggleSubject('${s}')">
            ${s}
        </label>
    `).join("");
}

// APPEND (không xóa cũ), lazy load ảnh
function appendToGallery(data) {
    const fragment = document.createDocumentFragment();

    data.forEach(img => {
        const div = document.createElement("div");
        div.className = "gallery-card border border-white/10 rounded-xl overflow-hidden";
        div.innerHTML = `
            <img src="${img.img_src}"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-56 object-cover">
            <div class="p-3">
                <div class="flex flex-wrap gap-1 mb-2">
                    ${img.subjects.map(s =>
                        `<span class="text-xs px-2 py-1 bg-white/10 rounded">${s}</span>`
                    ).join("")}
                </div>
                <div class="flex gap-2 text-sm">
                    <a href="${img.view_link}" target="_blank">View</a>
                    <a href="${img.download_link}" target="_blank" class="dl-link">Download</a>
                </div>
            </div>
        `;
        fragment.appendChild(div);
    });

    gallery.appendChild(fragment);   // 1 DOM write duy nhất
}

// ===== DOWNLOAD (event delegation) =====
gallery.addEventListener("click", async (e) => {
    const el = e.target.closest(".dl-link");
    if (!el) return;
    e.preventDefault();

    const url      = el.href;
    const filename = url.split("/").pop();

    const res    = await fetch(url);
    const blob   = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    Object.assign(document.createElement("a"), {
        href: blobUrl, download: filename,
    }).click();          // không cần append vào DOM

    URL.revokeObjectURL(blobUrl);
});