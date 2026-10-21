let currentAdmin = null;
let allCourses = [];

// DOM Elements
const tabMaterials = document.getElementById("tabMaterials");
const themeToggle = document.getElementById("themeToggle");
const tabUsers = document.getElementById("tabUsers");
const sectionMaterials = document.getElementById("sectionMaterials");
const sectionUsers = document.getElementById("sectionUsers");
const materialsTableBody = document.getElementById("materialsTableBody");
const usersTableBody = document.getElementById("usersTableBody");
const adminAlert = document.getElementById("adminAlert");

const uploadModal = document.getElementById("uploadModal");
const uploadMaterialForm = document.getElementById("uploadMaterialForm");
const matSemester = document.getElementById("matSemester");
const matCourseId = document.getElementById("matCourseId");
const matFile = document.getElementById("matFile");
const fileMsg = document.getElementById("fileMsg");

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await checkAdminAuth();
  await loadAllCourses();
  await fetchMaterials();
  await fetchUsers();
});

// ==========================================
// PENGATURAN TEMA (DARK / LIGHT MODE) ADMIN
// ==========================================
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


// ==========================================
// 1. CEK AUTORISASI ADMIN
// ==========================================
async function checkAdminAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session || !session.user) {
    alert("Silakan login sebagai admin.");
    window.location.href = "login.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    alert("Akses Ditolak: Anda bukan Admin!");
    window.location.href = "index.html";
    return;
  }

  currentAdmin = session.user;
}

// ==========================================
// 2. NAVIGASI TAB
// ==========================================
tabMaterials.addEventListener("click", () => {
  tabMaterials.classList.add("active");
  tabUsers.classList.remove("active");
  sectionMaterials.classList.remove("hidden");
  sectionUsers.classList.add("hidden");
});

tabUsers.addEventListener("click", () => {
  tabUsers.classList.add("active");
  tabMaterials.classList.remove("active");
  sectionUsers.classList.remove("hidden");
  sectionMaterials.classList.add("hidden");
});

// ==========================================
// 3. PILIHAN SEMESTER & FILTER MATA KULIAH
// ==========================================
async function loadAllCourses() {
  const { data } = await supabaseClient
    .from("courses")
    .select("id, code, name, semester")
    .order("semester", { ascending: true })
    .order("name", { ascending: true });

  if (data) allCourses = data;
}

matSemester.addEventListener("change", () => {
  const selectedSem = parseInt(matSemester.value);
  if (!selectedSem) {
    matCourseId.innerHTML = '<option value="">Pilih semester terlebih dahulu...</option>';
    matCourseId.disabled = true;
    return;
  }

  const filtered = allCourses.filter(c => c.semester === selectedSem);
  if (filtered.length === 0) {
    matCourseId.innerHTML = '<option value="">Tidak ada MK di semester ini</option>';
    matCourseId.disabled = true;
    return;
  }

  matCourseId.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>' +
    filtered.map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join("");
  matCourseId.disabled = false;
});

// Update label nama file saat file dipilih
matFile.addEventListener("change", () => {
  if (matFile.files.length > 0) {
    fileMsg.innerText = `📄 ${matFile.files[0].name}`;
  } else {
    fileMsg.innerText = "Pilih file PDF atau seret ke sini";
  }
});

// ==========================================
// 4. UNGGAH MATERI / REPOSITORI
// ==========================================
uploadMaterialForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitUpload");
  btn.disabled = true;
  btn.innerText = "Mengunggah berkas...";

  const courseId = matCourseId.value;
  const title = document.getElementById("matTitle").value.trim();
  const academicYear = document.getElementById("matAcademicYear").value.trim();
  const description = document.getElementById("matDesc").value.trim();
  const file = matFile.files[0];

  if (!courseId || !file) {
    alert("Lengkapi mata kuliah dan pilih berkas PDF.");
    btn.disabled = false;
    btn.innerText = "Simpan & Publikasikan Materi";
    return;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `modules/${fileName}`;

  // 1. Upload ke Supabase Storage
  const { error: storageError } = await supabaseClient.storage
    .from("course-materials")
    .upload(filePath, file);

  if (storageError) {
    showAlert("Gagal unggah file ke storage: " + storageError.message, "error");
    btn.disabled = false;
    btn.innerText = "Simpan & Publikasikan Materi";
    return;
  }

  // 2. Simpan metadata ke tabel materials
  const { error: dbError } = await supabaseClient.from("materials").insert({
    course_id: courseId,
    title,
    academic_year: academicYear,
    description,
    file_path: filePath,
    uploaded_by: currentAdmin.id
  });

  if (dbError) {
    showAlert("Gagal menyimpan ke database: " + dbError.message, "error");
  } else {
    showAlert("Materi berhasil ditambahkan ke repositori!", "success");
    uploadMaterialForm.reset();
    fileMsg.innerText = "Pilih file PDF atau seret ke sini";
    matCourseId.disabled = true;
    uploadModal.classList.add("hidden");
    await fetchMaterials();
  }

  btn.disabled = false;
  btn.innerText = "Simpan & Publikasikan Materi";
});

// ==========================================
// 5. LOAD & HAPUS MATERI
// ==========================================
async function fetchMaterials() {
  const { data: materials, error } = await supabaseClient
    .from("materials")
    .select("id, title, academic_year, views_count, file_path, courses(name, code, semester)")
    .order("created_at", { ascending: false });

  if (error || !materials || materials.length === 0) {
    materialsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada materi perkuliahan.</td></tr>';
    return;
  }

  materialsTableBody.innerHTML = materials.map(m => `
    <tr>
      <td><b>${m.title}</b></td>
      <td>${m.courses ? `[Sem ${m.courses.semester}] ${m.courses.code} -${m.courses.name}` : "-"}</td>
      <td>${m.academic_year}</td>
      <td>${m.views_count || 0} kali</td>
      <td>
        <button class="btn-danger" onclick="deleteMaterial('${m.id}', '${m.file_path}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

async function deleteMaterial(materialId, filePath) {
  if (!confirm("Hapus materi ini beserta dokumennya?")) return;

  await supabaseClient.storage.from("course-materials").remove([filePath]);
  await supabaseClient.from("materials").delete().eq("id", materialId);
  showAlert("Materi berhasil dihapus.", "success");
  await fetchMaterials();
}

// ==========================================
// 6. KELOLA PENGGUNA & FITUR JADIKAN ADMIN
// ==========================================
async function fetchUsers() {
  const { data: users, error } = await supabaseClient
    .from("profiles")
    .select("id, email, npm, full_name, role, is_active")
    .order("is_active", { ascending: true })
    .order("role", { ascending: true });

  if (error || !users || users.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada user terdaftar.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = users.map(u => {
    const isSelf = u.id === currentAdmin.id;
    const nextRole = u.role === "admin" ? "mahasiswa" : "admin";
    const toggleLabel = u.role === "admin" ? "Turunkan ke Mhs" : "Jadikan Admin";

    return `
      <tr>
        <td>
          <span class="badge-status ${u.is_active ? 'badge-active' : 'badge-inactive'}">
            ${u.is_active ? 'Aktif' : 'Non-Aktif'}
          </span>
        </td>
        <td>
          <span class="badge-role ${u.role}">${u.role}</span>
        </td>
        <td>${u.npm}</td>
        <td><b>${u.full_name}</b></td>
        <td>${u.email}</td>
        <td>
          ${isSelf 
            ? '<small class="text-muted">(Akun Anda)</small>' 
            : `<button class="btn-role-toggle" onclick="toggleRole('${u.id}', '${nextRole}', '${u.full_name.replace(/'/g, "\\'")}')">${toggleLabel}</button>`
          }
        </td>
        <td>
          ${isSelf 
            ? '-' 
            : `<button class="btn-danger" onclick="deleteUser('${u.id}', '${u.full_name.replace(/'/g, "\\'")}')">Hapus</button>`
          }
        </td>
      </tr>
    `;
  }).join("");
}

// Ubah Role User via RPC
async function toggleRole(userId, newRole, userName) {
  if (!confirm(`Ubah role ${userName} menjadi "${newRole}"?`)) return;

  const { error } = await supabaseClient.rpc("set_user_role", {
    target_user_id: userId,
    new_role: newRole
  });

  if (error) {
    showAlert("Gagal mengubah role: " + error.message, "error");
  } else {
    showAlert(`Role ${userName} berhasil diubah menjadi ${newRole}.`, "success");
    await fetchUsers();
  }
}

// Hapus User
async function deleteUser(userId, userName) {
  if (!confirm(`Hapus permanen akun ${userName}?`)) return;

  const { error } = await supabaseClient.rpc("delete_user_by_admin", {
    target_user_id: userId
  });

  if (error) {
    showAlert("Gagal menghapus akun: " + error.message, "error");
  } else {
    showAlert(`Akun ${userName} berhasil dihapus.`, "success");
    await fetchUsers();
  }
}

// Modal Toggle
document.getElementById("btnOpenUploadModal").addEventListener("click", () => uploadModal.classList.remove("hidden"));
document.getElementById("closeUploadModal").addEventListener("click", () => uploadModal.classList.add("hidden"));

// Utilitas Alert & Theme
function showAlert(msg, type) {
  adminAlert.textContent = msg;
  adminAlert.className = `alert-box alert-${type}`;
  adminAlert.style.display = "block";
  setTimeout(() => { adminAlert.style.display = "none"; }, 3500);
}

function initTheme() {
  const savedTheme = localStorage.getItem("repo_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});