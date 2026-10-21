// State Aplikasi
let allCourses = [];
let currentUser = null;
const DEFAULT_ACADEMIC_YEARS = ["2025/2026", "2024/2025", "2023/2024"];

// Elemen DOM - akan di-set saat DOMContentLoaded
let themeToggle, userStatus, adminLink, bookmarkNavBtn, historyNavBtn, logoutBtn;
let courseGrid, searchInput, semesterFilter;
let yearModal, modalCourseTitle, yearList, closeModal;

// ==========================================
// 2. INISIALISASI HALAMAN UTAMA
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Setup DOM elements
  themeToggle = document.getElementById("themeToggle");
  userStatus = document.getElementById("userStatus");
  adminLink = document.getElementById("adminLink");
  bookmarkNavBtn = document.getElementById("bookmarkNavBtn");
  historyNavBtn = document.getElementById("historyNavBtn");
  logoutBtn = document.getElementById("logoutBtn");
  courseGrid = document.getElementById("courseGrid");
  searchInput = document.getElementById("searchInput");
  semesterFilter = document.getElementById("semesterFilter");
  yearModal = document.getElementById("yearModal");
  modalCourseTitle = document.getElementById("modalCourseTitle");
  yearList = document.getElementById("yearList");
  closeModal = document.getElementById("closeModal");

  // Initialize
  initTheme();
  setupThemeToggle();
  await checkAuthStatus();
  await fetchCourses();
  
  // Setup event listeners
  setupEventListeners();
  setupModalKeyboardSupport();
});

// ==========================================
// 3. CEK AUTENTIKASI & TAMPILAN NAVBAR
// ==========================================
let switcherInterval = null;

async function checkAuthStatus() {
  const activitySwitcher = document.getElementById("activitySwitcher");
  const switcherCard = document.getElementById("switcherCard");
  const switcherLink = document.getElementById("switcherLink");

  // Clear interval lama sebelum set yang baru (prevent memory leak)
  if (switcherInterval) {
    clearInterval(switcherInterval);
    switcherInterval = null;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session && session.user) {
    currentUser = session.user;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, role")
      .eq("id", currentUser.id)
      .single();

    // 1. Munculkan tombol switcher flip
    activitySwitcher.classList.remove("hidden");

    // 2. Jalankan animasi switching tiap 2 detik
    if (!switcherInterval) {
      let isBack = false;
      switcherInterval = setInterval(() => {
        isBack = !isBack;
        if (isBack) {
          switcherCard.classList.add("flipped");
          switcherLink.href = "history-bookmarks.html?tab=history";
        } else {
          switcherCard.classList.remove("flipped");
          switcherLink.href = "history-bookmarks.html?tab=bookmarks";
        }
      }, 2000);
    }

    // Role admin check
    if (profile && profile.role === "admin") {
      adminLink.classList.remove("hidden");
    } else {
      adminLink.classList.add("hidden");
    }

    userStatus.textContent = `Halo, ${profile?.full_name || currentUser.email}`;
    const boldEl = document.createElement("b");
    boldEl.textContent = profile?.full_name || currentUser.email;
    userStatus.innerHTML = "Halo, ";
    userStatus.appendChild(boldEl);

    logoutBtn.classList.remove("hidden");

    logoutBtn.onclick = async () => {
      if (switcherInterval) clearInterval(switcherInterval);
      await supabaseClient.auth.signOut();
      window.location.reload();
    };
  } else {
    // Mode Guest
    currentUser = null;
    if (switcherInterval) clearInterval(switcherInterval);
    activitySwitcher.classList.add("hidden");
    adminLink.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    userStatus.innerHTML = `<a href="login.html" style="color: var(--primary); font-weight: 600; text-decoration: none;">Login Kampus</a> (Guest)`;
  }
}

// ==========================================
// 4. AMBIL DATA MATA KULIAH (COURSES)
// ==========================================
async function fetchCourses() {
  courseGrid.innerHTML = "<p class='text-muted'>Memuat daftar mata kuliah...</p>";

  const { data, error } = await supabaseClient
    .from("courses")
    .select("*")
    .order("semester", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    courseGrid.innerHTML = "<p class='text-muted'>Belum ada data mata kuliah yang tersedia.</p>";
    return;
  }

  allCourses = data;
  renderCourses();
}

// ==========================================
// 5. RENDER MOTHER BUTTON (GRID MK)
// ==========================================
function renderCourses() {
  const keyword = searchInput.value.toLowerCase().trim();
  const selectedSemester = semesterFilter.value;

  const filtered = allCourses.filter((course) => {
    const matchKeyword =
      course.name.toLowerCase().includes(keyword) ||
      course.code.toLowerCase().includes(keyword);
    const matchSemester =
      selectedSemester === "all" || course.semester.toString() === selectedSemester;

    return matchKeyword && matchSemester;
  });

  if (filtered.length === 0) {
    courseGrid.innerHTML = "<p class='text-muted'>Mata kuliah tidak ditemukan.</p>";
    return;
  }

  courseGrid.innerHTML = filtered
    .map(
      (mk) => `
      <button class="mother-btn" onclick="openYearModal(${mk.id}, '${mk.name.replace(/'/g, "\\'")}')">
        <div>
          <span class="badge-semester">Semester ${mk.semester}</span>
          <div class="course-code">${mk.code}</div>
          <div class="course-name">${mk.name}</div>
        </div>
        <p class="course-desc">${mk.description || "Klik untuk melihat materi per tahun ajaran."}</p>
      </button>
    `
    )
    .join("");
}

// ==========================================
// 6. MODAL POP-UP PILIH TAHUN AJARAN
// ==========================================
async function openYearModal(courseId, courseName) {
  modalCourseTitle.textContent = courseName;
  yearList.innerHTML = "<p class='text-muted'>Mengecek tahun ajaran...</p>";
  yearModal.classList.remove("hidden");

  let availableYears = DEFAULT_ACADEMIC_YEARS;

  // Jika sudah login, cari tahun ajaran yang benar-benar ada filenya di tabel materials
  if (currentUser) {
    const { data } = await supabaseClient
      .from("materials")
      .select("academic_year")
      .eq("course_id", courseId);

    if (data && data.length > 0) {
      availableYears = [...new Set(data.map((item) => item.academic_year))].sort().reverse();
    }
  }

  yearList.innerHTML = availableYears
    .map(
      (year) => `
      <button class="year-btn" onclick="goToMaterialsPage(${courseId}, '${year}')">
        <span>📅 Tahun Ajaran ${year}</span>
        <span>➔</span>
      </button>
    `
    )
    .join("");
}

// Navigasi ke halaman materi dengan validasi login
function goToMaterialsPage(courseId, academicYear) {
  if (!currentUser) {
    alert("Akses Terkunci: Silakan login dengan email resmi kampus untuk membuka materi perkuliahan!");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams({
    course_id: courseId,
    year: academicYear
  });

  window.location.href = `materials.html?${params.toString()}`;
}

// ==========================================
// 7. SETUP EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  if (searchInput) searchInput.addEventListener("input", renderCourses);
  if (semesterFilter) semesterFilter.addEventListener("change", renderCourses);
  if (closeModal) closeModal.addEventListener("click", () => yearModal.classList.add("hidden"));
  if (yearModal) {
    yearModal.addEventListener("click", (e) => {
      if (e.target === yearModal) yearModal.classList.add("hidden");
    });
  }
}

// ==========================================
// 8. MODAL KEYBOARD SUPPORT (Escape key)
// ==========================================
function setupModalKeyboardSupport() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !yearModal.classList.contains("hidden")) {
      yearModal.classList.add("hidden");
    }
  });
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (switcherInterval) {
    clearInterval(switcherInterval);
    switcherInterval = null;
  }
});