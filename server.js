/* =====================================================
   SERVER.JS – WasteCare Platform (FINAL STABLE)
   - Root static files
   - MongoDB Atlas (TLS safe)
   - Email OTP Auth
   - Login
   - Google OAuth
   - OpenAI Chatbot
===================================================== */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config();

/* =====================================================
   APP INIT
===================================================== */
const app = express();
const PORT = process.env.PORT || 5000;

/* =====================================================
   MIDDLEWARE
===================================================== */
app.use(cors());
app.use(express.json());

/* ROOT FOLDER STATIC (login.html, index.html, css/, js/) */
// app.use(express.static(path.join(__dirname)));

/* =====================================================
   SESSION
===================================================== */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "wastecare_secret",
    resave: false,
    saveUninitialized: false
  })
);

/* =====================================================
   PASSPORT
===================================================== */
require("./passport");
app.use(passport.initialize());
app.use(passport.session());

/* =====================================================
   MONGODB CONNECTION (TLS SAFE)
===================================================== */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
  });

/* =====================================================
   USER MODEL
===================================================== */
const User = require("./models/User");

/* =====================================================
   TEMP OTP STORE
===================================================== */
const tempUsers = {};

/* =====================================================
   EMAIL (GMAIL SMTP)
===================================================== */
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/* =====================================================
   AUTH ROUTES
===================================================== */

/* REGISTER – SEND OTP */
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

/* REGISTER – VERIFY OTP */
app.post("/api/register/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const temp = tempUsers[email];

  if (!temp || temp.otp != otp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  await User.create({
    name: temp.name,
    email: temp.email,
    password: temp.password,
    provider: "local"
  });

  delete tempUsers[email];
  res.json({ success: true, message: "Account created successfully" });
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, provider: "local" });
  if (!user || user.password !== password) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, message: `Welcome ${user.name}` });
});

/* =====================================================
   GOOGLE OAUTH
===================================================== */

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
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
   AI CHATBOT API (OPENAI)
===================================================== */

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.json({ reply: "Please type a message." });
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
                "You are WasteCare AI Customer Support. Be professional and concise."
            },
            { role: "user", content: userMessage }
          ],
          temperature: 0.5
        })
      }
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "No response from AI.";

    res.json({ reply });
  } catch (err) {
    console.error("OpenAI Error:", err.message);
    res.json({
      reply: "⚠️ AI service temporarily unavailable."
    });
  }
});

/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("✅ MongoDB + Auth + Google OAuth ready");
  console.log("✅ AI Chatbot API ready");
  console.log("CWD =", process.cwd());
});
