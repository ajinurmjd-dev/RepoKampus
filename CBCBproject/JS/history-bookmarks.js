
let currentUser = null;

// Elemen DOM Tab & Kontainer
const tabBookmarks = document.getElementById("tabBookmarks");
const tabHistory = document.getElementById("tabHistory");
const sectionBookmarks = document.getElementById("sectionBookmarks");
const sectionHistory = document.getElementById("sectionHistory");
const bookmarksList = document.getElementById("bookmarksList");
const historyList = document.getElementById("historyList");
const statusAlert = document.getElementById("statusAlert");
const themeToggle = document.getElementById("themeToggle");
const logoutBtn = document.getElementById("logoutBtn");

// ==========================================
// 1. INISIALISASI HALAMAN & TAB
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await checkUserAuth();

  // Deteksi query param ?tab=history atau ?tab=bookmarks dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get("tab") || "bookmarks";
  activateTab(targetTab);

  // Ambil data secara paralel
  await Promise.all([loadBookmarks(), loadReadingHistory()]);
});

function activateTab(tabName) {
  if (tabName === "history") {
    tabHistory.classList.add("active");
    tabBookmarks.classList.remove("active");
    sectionHistory.classList.remove("hidden");
    sectionBookmarks.classList.add("hidden");
  } else {
    tabBookmarks.classList.add("active");
    tabHistory.classList.remove("active");
    sectionBookmarks.classList.remove("hidden");
    sectionHistory.classList.add("hidden");
  }
}

tabBookmarks.addEventListener("click", () => activateTab("bookmarks"));
tabHistory.addEventListener("click", () => activateTab("history"));

// ==========================================
// 2. CEK SESI LOGIN MAHASISWA
// ==========================================
async function checkUserAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session || !session.user) {
    alert("Silakan login dengan akun kampus terlebih dahulu.");
    window.location.href = "login.html";
    return;
  }
  currentUser = session.user;
}

// ==========================================
// 3. LOAD DATA BOOKMARK (MATERI TERSIMPAN)
// ==========================================
async function loadBookmarks() {
  bookmarksList.innerHTML = "<p class='text-muted'>Mengambil daftar bookmark...</p>";

  const { data: marks, error } = await supabaseClient
    .from("bookmarks")
    .select(`
      id,
      created_at,
      materials (
        id,
        title,
        academic_year,
        courses (code, name, semester)
      )
    `)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error || !marks || marks.length === 0) {
    bookmarksList.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Materi Tersimpan</h3>
        <p>Tandai materi perkuliahan penting dengan tombol bookmark agar mudah dibaca kembali.</p>
        <a href="index.html" class="btn-read-now" style="display:inline-block; margin-top: 1rem;">Cari Materi</a>
      </div>
    `;
    return;
  }

  bookmarksList.innerHTML = marks.map((item) => {
    const mat = item.materials;
    if (!mat) return "";

    const courseCode = mat.courses ? mat.courses.code : "-";
    const courseName = mat.courses ? mat.courses.name : "Mata Kuliah";
    const semester = mat.courses ? `Sem ${mat.courses.semester}` : "";
    const saveDate = new Date(item.created_at).toLocaleDateString("id-ID", {
      dateStyle: "medium"
    });

    return `
      <div class="activity-card" id="bookmark-card-${item.id}">
        <div class="card-details">
          <div class="activity-meta">
            <span class="badge-tag">${courseCode} - ${courseName}</span>
            ${semester ? `<span class="badge-tag">${semester}</span>` : ""}
            <span class="badge-tag">TA ${mat.academic_year}</span>
          </div>
          <div class="card-title">${mat.title}</div>
          <div class="card-timestamp">Disimpan pada: ${saveDate}</div>
        </div>
        <div class="activity-actions">
          <button class="btn-remove-bookmark" onclick="removeBookmark('${item.id}', '${mat.title.replace(/'/g, "\\'")}')">
            Hapus
          </button>
          <a href="reader.html?id=${mat.id}" class="btn-read-now">Buka</a>
        </div>
      </div>
    `;
  }).join("");
}

// Menghapus Bookmark
async function removeBookmark(bookmarkId, title) {
  if (!confirm(`Hapus "${title}" dari daftar bookmark?`)) return;

  const { error } = await supabaseClient
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId);

  if (error) {
    showAlert("Gagal menghapus bookmark: " + error.message, "error");
    return;
  }

  showAlert("Materi berhasil dihapus dari bookmark.", "success");
  const card = document.getElementById(`bookmark-card-${bookmarkId}`);
  if (card) card.remove();

  if (bookmarksList.querySelectorAll(".activity-card").length === 0) {
    loadBookmarks();
  }
}

// ==========================================
// 4. LOAD DATA RIWAYAT BACA
// ==========================================
async function loadReadingHistory() {
  historyList.innerHTML = "<p class='text-muted'>Mengambil riwayat baca...</p>";

  const { data: logs, error } = await supabaseClient
    .from("reading_histories")
    .select(`
      id,
      accessed_at,
      materials (
        id,
        title,
        academic_year,
        courses (code, name, semester)
      )
    `)
    .eq("user_id", currentUser.id)
    .order("accessed_at", { ascending: false })
    .limit(30);

  if (error || !logs || logs.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Riwayat Baca</h3>
        <p>Anda belum membuka atau membaca materi perkuliahan apa pun.</p>
        <a href="index.html" class="btn-read-now" style="display:inline-block; margin-top: 1rem;">Mulai Belajar</a>
      </div>
    `;
    return;
  }

  historyList.innerHTML = logs.map((log) => {
    const mat = log.materials;
    if (!mat) return "";

    const courseCode = mat.courses ? mat.courses.code : "-";
    const courseName = mat.courses ? mat.courses.name : "Mata Kuliah";
    const semester = mat.courses ? `Sem ${mat.courses.semester}` : "";
    const accessTime = new Date(log.accessed_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    return `
      <div class="activity-card">
        <div class="card-details">
          <div class="activity-meta">
            <span class="badge-tag">${courseCode} - ${courseName}</span>
            ${semester ? `<span class="badge-tag">${semester}</span>` : ""}
            <span class="badge-tag">TA ${mat.academic_year}</span>
          </div>
          <div class="card-title">${mat.title}</div>
          <div class="card-timestamp">Terakhir diakses: ${accessTime} WIB</div>
        </div>
        <div class="activity-actions">
          <a href="reader.html?id=${mat.id}" class="btn-read-now">Baca Lagi</a>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================
// 5. FITUR DARK MODE, ALERT & LOGOUT
// ==========================================
function showAlert(msg, type) {
  statusAlert.textContent = msg;
  statusAlert.className = `alert-box alert-${type}`;
  statusAlert.style.display = "block";
  setTimeout(() => {
    statusAlert.style.display = "none";
  }, 3500);
}

function initTheme() {
  const savedTheme = localStorage.getItem("repo_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonText(savedTheme);
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem("repo_theme", nextTheme);
  updateThemeButtonText(nextTheme);
});

function updateThemeButtonText(theme) {
  themeToggle.innerText = theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap";
}

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});