const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let ADMIN_PASSWORD = "123456"; // پسورد اولیه

function isPastDate(dateStr, timeSlot) {
  const today = new Date();
  const selectedDate = new Date(dateStr);
  const todayStr = today.toISOString().split("T")[0];

  if (selectedDate < new Date(todayStr)) return true;
  if (dateStr === todayStr) {
    const hour = parseInt(timeSlot.split("-")[0]);
    return hour <= today.getHours();
  }
  return false;
}

router.get("/slots/:date", async (req, res) => {
  const booked = await Appointment.find({ date: req.params.date });
  res.json(booked.map((a) => a.timeSlot));
});

router.get("/all", async (req, res) => {
  const { type, filterDate } = req.query;
  let query = {};

  if (filterDate) query.date = filterDate;
  else if (type === "future")
    query.date = { $gte: new Date().toISOString().split("T")[0] };
  else if (type === "past")
    query.date = { $lt: new Date().toISOString().split("T")[0] };

  const appointments = await Appointment.find(query).sort({ date: -1 });
  res.json(appointments);
});

router.post("/", async (req, res) => {
  const { firstName, lastName, phone, date, dayOfWeek, timeSlot, userEmail } =
    req.body;

  if (isPastDate(date, timeSlot)) {
    return res.status(400).json({
      msg: "امکان ثبت نوبت در روزهای گذشته یا ساعات گذشته وجود ندارد",
    });
  }

  const existing = await Appointment.findOne({ date, timeSlot });
  if (existing)
    return res.status(400).json({ msg: "این ساعت قبلاً رزرو شده است" });

  const appointment = new Appointment({
    firstName,
    lastName,
    phone,
    date,
    dayOfWeek,
    timeSlot,
    userEmail,
  });
  await appointment.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: [userEmail, process.env.ADMIN_EMAIL],
    subject: `نوبت ملاقات - ${date}`,
    html: `
            <h3>نوبت ثبت شد</h3>
            <p><strong>نام:</strong> ${firstName} ${lastName}</p>
            <p><strong>تلفن:</strong> ${phone}</p>
            <p><strong>تاریخ:</strong> ${date} (${dayOfWeek})</p>
            <p><strong>ساعت:</strong> ${timeSlot}</p>
        `,
  });

  res.json({
    success: true,
    message: `قرار شما در روز ${dayOfWeek} مورخ ${date} ساعت ${timeSlot} ثبت شد.`,
  });
});

router.delete("/:id", async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.post("/change-password", (req, res) => {
  const { currentPass, newPass } = req.body;
  if (currentPass === ADMIN_PASSWORD) {
    ADMIN_PASSWORD = newPass;
    res.json({ success: true, msg: "پسورد با موفقیت تغییر یافت" });
  } else {
    res.status(400).json({ msg: "پسورد فعلی اشتباه است" });
  }
});

module.exports = router;
