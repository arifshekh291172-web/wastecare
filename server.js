/* =====================================================
   SERVER.JS – WasteCare (FINAL STABLE)
===================================================== */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

dotenv.config();

/* ================= APP INIT ================= */
const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ROOT STATIC FILES (index.html, login.html etc.) */
app.use(express.static(__dirname));

/* ================= SESSION ================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "wastecare_secret",
    resave: false,
    saveUninitialized: false
  })
);

/* ================= PASSPORT ================= */
require("./passport");
app.use(passport.initialize());
app.use(passport.session());

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

/* ================= MODELS ================= */
const User = require("./models/User");
const ContactMessage = require("./models/ContactMessage");
const Notification = require("./models/Notification");

/* ================= EMAIL ================= */
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/* ================= TEMP OTP STORE ================= */
const tempUsers = {};

/* =====================================================
   USER REGISTER – SEND OTP
===================================================== */
app.post("/api/register/send-otp", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.json({ success: false, message: "Account already exists" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  tempUsers[email] = { name, email, password, otp };

  await mailer.sendMail({
    from: "WasteCare <no-reply@wastecare.com>",
    to: email,
    subject: "Verify your WasteCare account",
    text: `Your OTP is ${otp}`
  });

  res.json({ success: true, message: "OTP sent to email" });
});

/* =====================================================
   USER REGISTER – VERIFY OTP (PASSWORD HASHED)
===================================================== */
app.post("/api/register/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const temp = tempUsers[email];

  if (!temp || temp.otp != otp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  const hashedPassword = await bcrypt.hash(temp.password, 10);

  await User.create({
    name: temp.name,
    email: temp.email,
    password: hashedPassword,
    provider: "local"
  });

  delete tempUsers[email];
  res.json({ success: true, message: "Account created successfully" });
});

/* =====================================================
   USER LOGIN
===================================================== */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, provider: "local" });
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, message: `Welcome ${user.name}` });
});

/* =====================================================
   ADMIN LOGIN
===================================================== */
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const admin = await User.findOne({
    email,
    role: "admin",
    provider: "local"
  });

  if (!admin) {
    return res.json({ success: false, message: "Admin not found" });
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return res.json({ success: false, message: "Invalid password" });
  }

  res.json({ success: true, message: "Admin login successful" });
});

/* =====================================================
   CONTACT FORM → DB + NOTIFICATION
===================================================== */
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.json({ success: false, message: "All fields required" });
  }

  await ContactMessage.create({ name, email, subject, message });

  await Notification.create({
    title: "New Contact Message",
    message: `${name} sent a message`
  });

  res.json({ success: true });
});

/* =====================================================
   ADMIN DASHBOARD DATA
===================================================== */
app.get("/api/admin/messages", async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json(messages);
});

app.get("/api/admin/notifications", async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  res.json(notifications);
});

/* =====================================================
   GOOGLE OAUTH
===================================================== */
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login.html"
  }),
  (req, res) => {
    res.redirect("/index.html");
  }
);

/* =====================================================
   AI CHATBOT API
===================================================== */
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Message required" });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are WasteCare AI Customer Support. Be professional."
            },
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "No response from AI";

    res.json({ reply });
  } catch (err) {
    res.json({ reply: "AI temporarily unavailable" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("✅ Root static enabled");
  console.log("✅ User + Admin auth ready");
  console.log("✅ Contact + Dashboard ready");
});
