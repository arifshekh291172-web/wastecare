const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const passport = require("passport");
const { User, Otp } = require("../models");

const router = express.Router();

/* ================= EMAIL SETUP ================= */
const mailer = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

/* ================= REGISTER (SEND OTP) ================= */
router.post("/register/send-otp", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "All fields required" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({
            email,
            otp,
            purpose: "register",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        await mailer.sendMail({
            to: email,
            subject: "WasteCare Email Verification",
            html: `<h3>Your OTP: ${otp}</h3><p>Valid for 5 minutes</p>`
        });

        res.json({ success: true, message: "OTP sent to email" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= REGISTER (VERIFY OTP) ================= */
router.post("/register/verify-otp", async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        const record = await Otp.findOne({ email, otp, purpose: "register" });
        if (!record) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
            provider: "local",
            isVerified: true
        });

        await Otp.deleteMany({ email });

        res.json({ success: true, message: "Account created successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, provider: "local" });
        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GOOGLE OAUTH ================= */
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login.html" }),
    (req, res) => {
        res.redirect("/index.html");
    }
);

module.exports = router;
