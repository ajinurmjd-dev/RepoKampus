// ==========================================
// KONFIGURASI SUPABASE GLOBAL (SINGLE SOURCE)
// ==========================================
const SUPABASE_URL = "https://wewlcpxigcvuwgrpaukb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yXMaEkB6UEsvf0q6BSr7Cw_pXC6Ah0s";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// THEME MANAGEMENT (DARK / LIGHT MODE)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem("repo_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonText(savedTheme);
}

function updateThemeButtonText(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.innerText = theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap";
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("repo_theme", nextTheme);
      updateThemeButtonText(nextTheme);
    });
  }
}

// ==========================================
// ALERT UTILITY
// ==========================================
function showAlert(msg, type, elementId = "alertBox") {
  const alertBox = document.getElementById(elementId);
  if (!alertBox) return;

  alertBox.textContent = msg;
  alertBox.className = `alert-box alert-${type}`;
  alertBox.style.display = "block";
}

function showAlertAutoHide(msg, type, elementId = "alertBox", delay = 3500) {
  showAlert(msg, type, elementId);
  const alertBox = document.getElementById(elementId);
  if (alertBox) {
    setTimeout(() => { alertBox.style.display = "none"; }, delay);
  }
}

function hideAlert(elementId = "alertBox") {
  const alertBox = document.getElementById(elementId);
  if (alertBox) alertBox.style.display = "none";
}

// ==========================================
// DOM SANITIZATION (Anti-XSS)
// ==========================================
function escapeHtml(unsafe) {
  if (unsafe == null) return "";
  const div = document.createElement("div");
  div.textContent = String(unsafe);
  return div.innerHTML;
}

// ==========================================
// AUTH CHECK UTILITY
// ==========================================
async function getSessionUser() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) return session.user;
    return null;
  } catch (err) {
    console.error("Gagal mengambil sesi:", err);
    return null;
  }
}

async function requireAuth(redirectUrl = "login.html", message = "Silakan login terlebih dahulu.") {
  const user = await getSessionUser();
  if (!user) {
    alert(message);
    window.location.href = redirectUrl;
    return null;
  }
  return user;
}

// ==========================================
// ERROR MESSAGE TRANSLATOR
// ==========================================
function getReadableErrorMessage(rawMsg) {
  if (!rawMsg) return "Terjadi kesalahan sistem.";
  const msg = rawMsg.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Email atau kata sandi salah. Periksa kembali.";
  }
  if (msg.includes("user already registered")) {
    return "Email ini sudah terdaftar. Silakan langsung login.";
  }
  if (msg.includes("password should be at least")) {
    return "Kata sandi minimal 6 karakter.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Terlalu banyak percobaan dalam waktu singkat. Tunggu 1–2 menit lalu coba lagi.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Pastikan opsi 'Confirm email' sudah dimatikan di Supabase Providers.";
  }

  return rawMsg;
}

// ==========================================
// MODAL KEYBOARD SUPPORT (Escape to close)
// ==========================================
function setupModalEscapeClose(modalElement) {
  if (!modalElement) return;

  function onKeydown(e) {
    if (e.key === "Escape" && !modalElement.classList.contains("hidden")) {
      modalElement.classList.add("hidden");
    }
  }

  document.addEventListener("keydown", onKeydown);

  // Return cleanup function
  return () => document.removeEventListener("keydown", onKeydown);
}
