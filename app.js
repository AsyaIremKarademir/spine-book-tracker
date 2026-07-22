
  // Spine — kitap günlüğü

const STORAGE_KEY = "spine_library_v1";

/** @type {Book[]} */
let library = loadLibrary();
let currentView = "home";
let currentModalBookId = null;

// ---------------------------------------------------------------------
// Depolama
// ---------------------------------------------------------------------
function loadLibrary(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Kütüphane okunamadı:", e);
    return [];
  }
}

function saveLibrary(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function findBook(id){
  return library.find(b => b.id === id);
}

function upsertBook(book){
  const idx = library.findIndex(b => b.id === book.id);
  if(idx >= 0) library[idx] = book;
  else library.unshift(book);
  saveLibrary();
}

function removeBook(id){
  library = library.filter(b => b.id !== id);
  saveLibrary();
}

// ---------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------
function esc(str){
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function coverUrl(coverId, size){
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

function starsString(rating){
  const r = Math.round(rating || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function formatDate(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day:"numeric", month:"short", year:"numeric" });
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

const STATUS_LABEL = { want: "Okumak istiyorum", reading: "Okuyorum", read: "Okudum" };

// ---------------------------------------------------------------------
// Görünüm yönlendirme
// ---------------------------------------------------------------------
const content = document.getElementById("content");

function setActiveNav(view, status){
  document.querySelectorAll(".nav-item").forEach(btn => {
    const matches = btn.dataset.view === view && (btn.dataset.status || null) === (status || null);
    btn.classList.toggle("active", matches);
  });
}

function renderView(view, status){
  currentView = view;
  if(view === "home") return renderHome();
  if(view === "search") return renderSearch();
  if(view === "shelf") return renderShelf(status);
  if(view === "stats") return renderStats();
}

// ---------------------------------------------------------------------
// Akış (Home)
// ---------------------------------------------------------------------
function renderHome(){
  setActiveNav("home");
  const read = library.filter(b => b.status === "read").sort((a,b) => new Date(b.dateFinished||b.dateAdded) - new Date(a.dateFinished||a.dateAdded));
  const reading = library.filter(b => b.status === "reading").length;
  const totalPages = read.reduce((s,b) => s + (Number(b.pages)||0), 0);
  const ratedBooks = read.filter(b => b.rating > 0);
  const avgRating = ratedBooks.length ? (ratedBooks.reduce((s,b)=>s+b.rating,0) / ratedBooks.length).toFixed(1) : "—";

  const stats = `
    <div class="stat-strip">
      <div class="stat-box"><div class="num">${read.length}</div><div class="lbl">okunan kitap</div></div>
      <div class="stat-box"><div class="num">${reading}</div><div class="lbl">şu an okunuyor</div></div>
      <div class="stat-box"><div class="num">${totalPages.toLocaleString("tr-TR")}</div><div class="lbl">sayfa okundu</div></div>
      <div class="stat-box"><div class="num">${avgRating}</div><div class="lbl">ortalama puan</div></div>
    </div>`;

  let feed;
  if(read.length === 0){
    feed = emptyState("📖", "Henüz günlüğün boş", "Bir kitabı bitirdiğinde puanla ve burada beliricek.", "search", "Kitap ara");
  }else{
    feed = `<p class="section-label">Günlük</p>` + read.map(diaryRow).join("");
  }

  content.innerHTML = `
    <h1 class="page-title">Akış</h1>
    <p class="page-sub">Okuma yolculuğuna genel bakış.</p>
    ${stats}
    ${feed}
  `;
  bindDiaryClicks();
  bindEmptyStateLink();
}

function diaryRow(b){
  const cover = coverUrl(b.cover, "S");
  return `
  <div class="diary-entry" data-id="${b.id}">
    ${cover
      ? `<img class="diary-cover" src="${cover}" alt="${esc(b.title)} kapağı">`
      : `<div class="diary-cover no-cover">${esc(initials(b.title))}</div>`}
    <div class="diary-body">
      <div class="diary-date">${formatDate(b.dateFinished || b.dateAdded)} tarihinde okundu</div>
      <div class="spine-title-inline">${esc(b.title)}</div>
      <div class="diary-stars">${starsString(b.rating)}</div>
      ${b.review ? `<div class="diary-review">${esc(b.review)}</div>` : ""}
    </div>
  </div>`;
}

function initials(title){
  return (title || "?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
}

function bindDiaryClicks(){
  content.querySelectorAll(".diary-entry").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.id));
  });
}

function bindEmptyStateLink(){
  content.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => {
      renderView(el.dataset.goto);
    });
  });
}

function emptyState(icon, title, sub, gotoView, gotoLabel){
  return `
    <div class="empty-state">
      <span class="em-icon">${icon}</span>
      <strong>${esc(title)}</strong>
      <p>${esc(sub)} ${gotoView ? `<a data-goto="${gotoView}">${esc(gotoLabel)} →</a>` : ""}</p>
    </div>`;
}

// ---------------------------------------------------------------------
// Arama
// ---------------------------------------------------------------------
function renderSearch(){
  setActiveNav("search");
  content.innerHTML = `
    <h1 class="page-title">Kitap ara</h1>
    <p class="page-sub">Open Library kataloğunda ara, tek tıkla rafına ekle.</p>
    <div class="search-row">
      <input type="text" id="searchInput" placeholder="Kitap adı, yazar…" autocomplete="off">
      <button id="searchBtn">Ara</button>
    </div>
    <div class="result-list" id="resultList"></div>
  `;
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const run = () => doSearch(input.value.trim());
  btn.addEventListener("click", run);
  input.addEventListener("keydown", e => { if(e.key === "Enter") run(); });
  input.focus();
}

async function doSearch(query){
  const list = document.getElementById("resultList");
  if(!query){ list.innerHTML = ""; return; }
  list.innerHTML = `<p class="page-sub">Aranıyor…</p>`;
  try{
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("İstek başarısız");
    const data = await res.json();
    const docs = data.docs || [];
    if(docs.length === 0){
      list.innerHTML = emptyState("🔍", "Sonuç bulunamadı", "Farklı bir arama terimi dene.");
      return;
    }
    list.innerHTML = docs.map(searchRow).join("");
    bindSearchActions();
  }catch(e){
    console.error(e);
    list.innerHTML = `<div class="empty-state"><span class="em-icon">⚠️</span><strong>Arama sırasında bir hata oluştu</strong><p>İnternet bağlantını kontrol edip tekrar dene.</p></div>`;
  }
}

function searchRow(doc){
  const id = doc.key; // örn. /works/OL123W
  const cover = coverUrl(doc.cover_i, "S");
  const author = (doc.author_name && doc.author_name.join(", ")) || "Bilinmeyen yazar";
  const year = doc.first_publish_year || "";
  const existing = library.find(b => b.id === id);
  return `
  <div class="result-row" data-id="${id}"
       data-title="${esc(doc.title)}"
       data-author="${esc(author)}"
       data-year="${year}"
       data-cover="${doc.cover_i || ""}"
       data-pages="${doc.number_of_pages_median || ""}">
    ${cover ? `<img class="result-cover" src="${cover}" alt="">` : `<div class="result-cover"></div>`}
    <div class="result-meta">
      <strong>${esc(doc.title)}</strong>
      <div>${esc(author)}${year ? " · " + year : ""}</div>
    </div>
    <div class="result-actions">
      <button class="pill-btn add-btn ${existing?.status==='want'?'on':''}" data-status="want">İstiyorum</button>
      <button class="pill-btn add-btn ${existing?.status==='reading'?'on':''}" data-status="reading">Okuyorum</button>
      <button class="pill-btn add-btn ${existing?.status==='read'?'on':''}" data-status="read">Okudum</button>
    </div>
  </div>`;
}

function bindSearchActions(){
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".result-row");
      const status = btn.dataset.status;
      const id = row.dataset.id;
      const existing = findBook(id);
      const book = existing || {
        id,
        title: row.dataset.title,
        author: row.dataset.author,
        cover: row.dataset.cover ? Number(row.dataset.cover) : null,
        year: row.dataset.year ? Number(row.dataset.year) : null,
        pages: row.dataset.pages ? Number(row.dataset.pages) : null,
        status: "want",
        rating: 0,
        review: "",
        dateAdded: new Date().toISOString(),
        dateFinished: null
      };
      book.status = status;
      if(status === "read" && !book.dateFinished) book.dateFinished = new Date().toISOString();
      upsertBook(book);
      row.querySelectorAll(".add-btn").forEach(b => b.classList.toggle("on", b.dataset.status === status));
      showToast(`"${book.title}" → ${STATUS_LABEL[status]}`);
    });
  });
}

// ---------------------------------------------------------------------
// Raf görünümü
// ---------------------------------------------------------------------
function renderShelf(status){
  setActiveNav("shelf", status);
  const books = library.filter(b => b.status === status)
    .sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  const titles = { want:"Okumak istiyorum", reading:"Şu an okuyorum", read:"Okudum" };
  const subs = {
    want:"Sırada bekleyen kitapların.",
    reading:"Şu anda içinde olduğun dünyalar.",
    read:"Bitirdiğin tüm kitaplar."
  };

  const grid = books.length
    ? `<div class="shelf-grid">${books.map(spineCard).join("")}</div>`
    : emptyState("📚", "Bu raf boş", "Arama yapıp buraya kitap ekleyebilirsin.", "search", "Kitap ara");

  content.innerHTML = `
    <h1 class="page-title">${titles[status]}</h1>
    <p class="page-sub">${subs[status]}</p>
    ${grid}
  `;
  content.querySelectorAll(".spine-card").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.id));
  });
}

function spineCard(b){
  const cover = coverUrl(b.cover, "M");
  return `
  <div class="spine-card" data-id="${b.id}">
    <div class="spine-cover">
      ${cover ? `<img src="${cover}" alt="${esc(b.title)} kapağı">` : `<div class="no-cover">${esc(b.title)}</div>`}
      ${b.status === "read" && b.rating > 0 ? `<div class="spine-rating">${starsString(b.rating)}</div>` : ""}
    </div>
    <div class="spine-title">${esc(b.title)}</div>
    <div class="spine-author">${esc(b.author)}</div>
  </div>`;
}

// ---------------------------------------------------------------------
// İstatistikler
// ---------------------------------------------------------------------
function renderStats(){
  setActiveNav("stats");
  const read = library.filter(b => b.status === "read");
  const byRating = [5,4,3,2,1].map(r => ({ r, n: read.filter(b => Math.round(b.rating) === r).length }));
  const maxN = Math.max(1, ...byRating.map(x => x.n));

  const authorCounts = {};
  read.forEach(b => { authorCounts[b.author] = (authorCounts[b.author]||0) + 1; });
  const topAuthors = Object.entries(authorCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxAuthorN = Math.max(1, ...topAuthors.map(a=>a[1]));

  content.innerHTML = `
    <h1 class="page-title">İstatistikler</h1>
    <p class="page-sub">Rakamlarla okuma alışkanlığın.</p>

    <p class="section-label">Puan dağılımı</p>
    ${byRating.map(x => `
      <div class="bar-row">
        <div class="bar-label">${"★".repeat(x.r)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(x.n/maxN)*100}%"></div></div>
        <div class="bar-val">${x.n}</div>
      </div>`).join("")}

    <p class="section-label" style="margin-top:36px;">En çok okunan yazarlar</p>
    ${topAuthors.length ? topAuthors.map(([author,n]) => `
      <div class="bar-row">
        <div class="bar-label">${esc(author)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(n/maxAuthorN)*100}%"></div></div>
        <div class="bar-val">${n}</div>
      </div>`).join("") : `<p class="page-sub">Henüz veri yok.</p>`}
  `;
}

// ---------------------------------------------------------------------
// Modal — kitap detayı / günlük girişi
// ---------------------------------------------------------------------
const modalBackdrop = document.getElementById("modalBackdrop");
const bookModal = document.getElementById("bookModal");

function openModal(id){
  const b = findBook(id);
  if(!b) return;
  currentModalBookId = id;
  const cover = coverUrl(b.cover, "M");

  bookModal.innerHTML = `
    <button class="close-x" id="closeModal" aria-label="Kapat">✕</button>
    <div class="modal-top">
      ${cover ? `<img class="modal-cover" src="${cover}" alt="">` : `<div class="modal-cover no-cover">${esc(b.title)}</div>`}
      <div>
        <div class="modal-title">${esc(b.title)}</div>
        <div class="modal-author">${esc(b.author)}</div>
        <div class="modal-meta">${b.year ? b.year : ""}${b.pages ? " · " + b.pages + " sayfa" : ""}</div>
      </div>
    </div>

    <span class="field-label">Durum</span>
    <div class="status-row">
      ${["want","reading","read"].map(s => `
        <button class="pill-btn status-btn ${b.status===s?'on':''}" data-status="${s}">${STATUS_LABEL[s]}</button>
      `).join("")}
    </div>

    <span class="field-label">Puan</span>
    <div class="star-picker" id="starPicker">
      ${[1,2,3,4,5].map(n => `<span data-n="${n}" class="${b.rating>=n?'filled':''}">★</span>`).join("")}
    </div>

    <span class="field-label">Yorumun</span>
    <textarea id="reviewInput" placeholder="Bu kitap hakkında ne düşünüyorsun?">${esc(b.review)}</textarea>

    <div class="modal-actions">
      <button class="text-danger-btn" id="deleteBtn">Kitabı kaldır</button>
      <button class="primary-btn" id="saveBtn">Kaydet</button>
    </div>
  `;

  modalBackdrop.classList.add("open");

  document.getElementById("closeModal").addEventListener("click", closeModal);

  bookModal.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bookModal.querySelectorAll(".status-btn").forEach(x => x.classList.remove("on"));
      btn.classList.add("on");
    });
  });

  bookModal.querySelectorAll("#starPicker span").forEach(star => {
    star.addEventListener("click", () => {
      const n = Number(star.dataset.n);
      bookModal.querySelectorAll("#starPicker span").forEach(s => {
        s.classList.toggle("filled", Number(s.dataset.n) <= n);
      });
      bookModal.dataset.rating = n;
    });
  });
  bookModal.dataset.rating = b.rating || 0;

  document.getElementById("saveBtn").addEventListener("click", () => saveModal(id));
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if(confirm(`"${b.title}" kütüphaneden kaldırılsın mı?`)){
      removeBook(id);
      closeModal();
      renderView(currentView, getActiveStatus());
      showToast("Kitap kaldırıldı");
    }
  });
}

function getActiveStatus(){
  const active = document.querySelector(".nav-item.active");
  return active ? active.dataset.status : undefined;
}

function saveModal(id){
  const b = findBook(id);
  if(!b) return;
  const chosenStatus = bookModal.querySelector(".status-btn.on")?.dataset.status || b.status;
  const rating = Number(bookModal.dataset.rating || 0);
  const review = document.getElementById("reviewInput").value.trim();

  const wasRead = b.status === "read";
  b.status = chosenStatus;
  b.rating = rating;
  b.review = review;
  if(chosenStatus === "read" && !wasRead) b.dateFinished = new Date().toISOString();
  if(chosenStatus !== "read") b.dateFinished = b.dateFinished || null;

  upsertBook(b);
  closeModal();
  renderView(currentView, getActiveStatus());
  showToast("Kaydedildi");
}

function closeModal(){
  modalBackdrop.classList.remove("open");
  currentModalBookId = null;
}

modalBackdrop.addEventListener("click", e => {
  if(e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && modalBackdrop.classList.contains("open")) closeModal();
});

// ---------------------------------------------------------------------
// Navigasyon
// ---------------------------------------------------------------------
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    renderView(btn.dataset.view, btn.dataset.status);
    document.querySelector(".sidebar").classList.remove("open");
  });
});

document.getElementById("mobileMenuBtn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// ---------------------------------------------------------------------
// Dışa / içe aktarma
// ---------------------------------------------------------------------
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(library, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spine-kutuphanem.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error("Geçersiz format");
      library = data;
      saveLibrary();
      renderView(currentView, getActiveStatus());
      showToast("Kütüphane içe aktarıldı");
    }catch(err){
      alert("Dosya okunamadı. Geçerli bir Spine yedeği seçtiğinden emin ol.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// ---------------------------------------------------------------------
// Başlangıç
// ---------------------------------------------------------------------
renderView("home");
