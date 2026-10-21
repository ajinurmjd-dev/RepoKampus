// Domain kampus yang diizinkan (tambah domain lain jika perlu)
const ALLOWED_DOMAINS = ["@unsika.ac.id", "@student.unsika.ac.id"];

// Elemen DOM
const alertBox = document.getElementById("alertBox");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const themeToggle = document.getElementById("themeToggle");

// ==========================================
// 2. CEK SESI LOGIN AKTIF
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  // Jika user sudah login, langsung lempar ke katalog utama
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    window.location.href = "index.html";
  }
});

// ==========================================
// 3. NAVIGASI TAB FORM
// ==========================================
tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

function switchTab(type) {
  hideAlert();
  if (type === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }
}

// ==========================================
// 4. LOGIKA LOGIN (LENGKAP DENGAN CEK STATUS AKTIF)
// ==========================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("btnLoginSubmit");

  btn.disabled = true;
  btn.innerText = "Memverifikasi...";

  try {
    // 1. Login ke Supabase Auth
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // 2. Ambil data profil & periksa apakah akun dinonaktifkan oleh Admin
    const { data: profile, error: profileErr } = await supabaseClient
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", data.user.id)
      .single();

    if (profile && profile.is_active === false) {
      // Logout paksa jika statusnya tidak aktif
      await supabaseClient.auth.signOut();
      throw new Error("Akun kamu telah dinonaktifkan oleh Admin Kampus. Hubungi bagian pengelola.");
    }

    // 3. Perbarui waktu last_login di database
    await supabaseClient
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);

    showAlert(`Login berhasil! Selamat datang, ${profile?.full_name || "Civitas"}.`, "success");
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (err) {
    showAlert(getReadableErrorMessage(err.message), "error");
    btn.disabled = false;
    btn.innerText = "Masuk ke Sistem";
  }
});

// ==========================================
// 5. LOGIKA REGISTER
// ==========================================
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName = document.getElementById("regFullName").value.trim();
  const npm = document.getElementById("regNpm").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  const btn = document.getElementById("btnRegisterSubmit");

  // Validasi format domain email kampus di client
  const isCampusEmail = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
  if (!isCampusEmail) {
    showAlert("Registrasi ditolak: Wajib menggunakan domain email resmi kampus (@unsika.ac.id atau @student.unsika.ac.id)!", "error");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Mendaftarkan...";

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          npm: npm,
          role: "mahasiswa"
        }
      }
    });

    if (error) throw error;

    showAlert("Pendaftaran berhasil! Akun sudah aktif. Silakan masuk.", "success");
    registerForm.reset();
    btn.disabled = false;
    btn.innerText = "Buat Akun Baru";

    // Pindah ke tab login otomatis
    setTimeout(() => switchTab("login"), 1600);

  } catch (err) {
    showAlert(getReadableErrorMessage(err.message), "error");
    btn.disabled = false;
    btn.innerText = "Buat Akun Baru";
  }
});

// ==========================================
// 6. PENERJEMAH ERROR KAMPUS
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
// 7. UTILITAS ALERT & TEMA
// ==========================================
function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = `alert-box alert-${type}`;
  alertBox.style.display = "block";
}

function hideAlert() {
  alertBox.style.display = "none";
}

function initTheme() {
  const savedTheme = localStorage.getItem("repo_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonText(savedTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("repo_theme", nextTheme);
    updateThemeButtonText(nextTheme);
  });
}

function updateThemeButtonText(theme) {
  if (themeToggle) {
    themeToggle.innerText = theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap";
  }
}