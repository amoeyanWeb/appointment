const API_URL = "http://localhost:5000/api/appointments";
let selectedDate = null;
let selectedSlot = null;
let currentUser = null;

const timeSlots = ["8-10", "10-12", "12-14", "14-16", "16-18"];

// اطلاعات ادمین
const ADMIN = {
  firstName: "admin",
  lastName: "admin",
  phone: "002233445566",
  email: "amoeyan.music@gmail.com",
  password: "123456",
};

// ==================== شروع برنامه ====================
window.onload = () => {
  document.getElementById("initial-modal").classList.remove("hidden");
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("password-modal").classList.add("hidden");
};

// ==================== مدال اولیه ====================
function checkUserType() {
  const firstName = document.getElementById("modal-first-name").value.trim();
  const lastName = document.getElementById("modal-last-name").value.trim();
  const phone = document.getElementById("modal-phone").value.trim();
  const email = document.getElementById("modal-email").value.trim();

  if (!firstName || !lastName || !phone || !email) {
    return alert("لطفاً همه فیلدها را پر کنید");
  }

  currentUser = { firstName, lastName, phone, email };

  // تشخیص ادمین
  if (
    firstName.toLowerCase() === ADMIN.firstName &&
    lastName.toLowerCase() === ADMIN.lastName &&
    phone === ADMIN.phone &&
    email.toLowerCase() === ADMIN.email.toLowerCase()
  ) {
    document.getElementById("initial-modal").classList.add("hidden");
    document.getElementById("admin-pass-modal").classList.remove("hidden");
  } else {
    // کاربر عادی
    document.getElementById("initial-modal").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    generateCalendar();
  }
}

function verifyAdminPassword() {
  const enteredPass = document.getElementById("admin-password").value;
  if (enteredPass === ADMIN.password) {
    document.getElementById("admin-pass-modal").classList.add("hidden");
    document.getElementById("admin-panel").classList.remove("hidden");
    loadAppointments("future");
  } else {
    alert("پسورد اشتباه است!");
    document.getElementById("admin-password").value = "";
  }
}

function closeAdminPassModal() {
  document.getElementById("admin-pass-modal").classList.add("hidden");
  document.getElementById("initial-modal").classList.remove("hidden");
  document.getElementById("admin-password").value = "";
}

// ==================== تقویم ====================
function generateCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysOfWeek = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
  ];
  daysOfWeek.forEach((day) => {
    const div = document.createElement("div");
    div.textContent = day;
    div.style.fontWeight = "bold";
    div.style.textAlign = "center";
    calendar.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startOffset = (firstDay + 6) % 7;

  for (let i = 0; i < startOffset; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  const todayStr = today.toISOString().split("T")[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const div = document.createElement("div");
    div.className = "day";
    div.textContent = day;
    div.dataset.date = dateStr;

    if (dateStr === todayStr) div.classList.add("today");
    if (dateStr < todayStr) div.classList.add("past");

    div.onclick = () => selectDate(dateStr, div);
    calendar.appendChild(div);
  }
}

// انتخاب تاریخ
async function selectDate(dateStr, element) {
  document
    .querySelectorAll(".day")
    .forEach((d) => d.classList.remove("selected"));
  element.classList.add("selected");

  selectedDate = dateStr;
  const dateObj = new Date(dateStr);
  const dayNames = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];

  document.getElementById("date-text").textContent = dateStr;
  document.getElementById("day-name").textContent = dayNames[dateObj.getDay()];

  document.getElementById("selected-date").classList.remove("hidden");

  try {
    const res = await fetch(`${API_URL}/slots/${dateStr}`);
    const bookedSlots = await res.json();
    renderTimeSlots(bookedSlots);
  } catch (e) {
    renderTimeSlots([]);
  }
}

// نمایش ساعات
function renderTimeSlots(bookedSlots) {
  const container = document.getElementById("slots-container");
  container.innerHTML = "";

  timeSlots.forEach((slot) => {
    const div = document.createElement("div");
    div.className = `slot ${bookedSlots.includes(slot) ? "booked" : ""}`;
    div.textContent = slot;

    if (!bookedSlots.includes(slot)) {
      div.onclick = () => {
        document
          .querySelectorAll(".slot")
          .forEach((s) => s.classList.remove("selected"));
        div.classList.add("selected");
        selectedSlot = slot;
        document.getElementById("form").classList.remove("hidden");
      };
    }
    container.appendChild(div);
  });

  document.getElementById("time-slots").classList.remove("hidden");
}

// ثبت نوبت
async function submitAppointment() {
  if (!selectedDate || !selectedSlot || !currentUser) {
    return alert("اطلاعات ناقص است");
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone,
        date: selectedDate,
        dayOfWeek: document.getElementById("day-name").textContent,
        timeSlot: selectedSlot,
        userEmail: currentUser.email,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert(
        `✅ قرار ملاقات با موفقیت ثبت شد!\n\nروز: ${document.getElementById("day-name").textContent}\nتاریخ: ${selectedDate}\nساعت: ${selectedSlot}\n\nاطلاعات به ایمیل شما ارسال شد.`,
      );
      setTimeout(() => location.reload(), 2000);
    } else {
      alert(data.msg || "خطا در ثبت نوبت");
    }
  } catch (err) {
    alert("خطا در ارتباط با سرور");
  }
}

// ==================== پنل ادمین ====================
function adminLoginFromMenu() {
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("admin-pass-modal").classList.remove("hidden");
}

async function loadAppointments(type = "future") {
  try {
    const res = await fetch(`${API_URL}/all?type=${type}`);
    const data = await res.json();
    renderAdminTable(data);
  } catch (err) {
    console.error(err);
  }
}

function renderAdminTable(data) {
  const tbody = document.querySelector("#appointments-table tbody");
  tbody.innerHTML = "";
  data.forEach((app) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${app.firstName} ${app.lastName}</td>
            <td>${app.phone}</td>
            <td>${app.userEmail}</td>
            <td>${app.date} (${app.dayOfWeek || ""})</td>
            <td>${app.timeSlot}</td>
            <td><button onclick="deleteAppointment('${app._id}')" style="background:#f44336;color:white;">حذف</button></td>
        `;
    tbody.appendChild(tr);
  });
}

async function deleteAppointment(id) {
  if (confirm("آیا از حذف این نوبت مطمئن هستید؟")) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    loadAppointments("future");
  }
}

function filterByDate() {
  const date = document.getElementById("filter-date").value;
  if (date) {
    fetch(`${API_URL}/all?filterDate=${date}`)
      .then((r) => r.json())
      .then((data) => renderAdminTable(data));
  }
}

// ==================== تغییر پسورد ====================
function changePasswordModal() {
  document.getElementById("password-modal").classList.remove("hidden");
}

async function changeAdminPassword() {
  const current = document.getElementById("current-pass").value;
  const newPass = document.getElementById("new-pass").value;
  const confirm = document.getElementById("new-pass-confirm").value;

  if (!current || !newPass || !confirm) return alert("همه فیلدها را پر کنید");
  if (newPass !== confirm) return alert("پسورد جدید مطابقت ندارد");

  try {
    const res = await fetch(`${API_URL}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPass: current, newPass }),
    });
    const data = await res.json();
    alert(data.msg || (data.success ? "✅ پسورد با موفقیت تغییر یافت" : "خطا"));
    if (data.success) closeModal();
  } catch (err) {
    alert("خطا در تغییر پسورد");
  }
}

function closeModal() {
  document.getElementById("password-modal").classList.add("hidden");
  document.getElementById("current-pass").value = "";
  document.getElementById("new-pass").value = "";
  document.getElementById("new-pass-confirm").value = "";
}

function logoutAdmin() {
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("initial-modal").classList.remove("hidden");
}
