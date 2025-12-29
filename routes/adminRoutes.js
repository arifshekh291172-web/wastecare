const express = require("express");
const bcrypt = require("bcryptjs");

const { User } = require("../models/User") || require("../models").User;
const ContactMessage =
    require("../models/ContactMessage") ||
    require("../models").ContactMessage;
const Notification =
    require("../models/Notification") ||
    require("../models").Notification;

const router = express.Router();

/* =====================================================
   ADMIN LOGIN
===================================================== */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password required"
            });
        }

        const admin = await User.findOne({
            email,
            role: "admin",
            provider: "local"
        });

        if (!admin) {
            return res.json({
                success: false,
                message: "Admin account not found"
            });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        // (JWT / session later)
        res.json({
            success: true,
            message: "Admin login successful"
        });

    } catch (err) {
        console.error("Admin Login Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =====================================================
   GET ALL CONTACT MESSAGES
===================================================== */
router.get("/messages", async (req, res) => {
    try {
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 });

        res.json(messages);

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages"
        });
    }
});

/* =====================================================
   MARK MESSAGE AS READ
===================================================== */
router.post("/messages/:id/read", async (req, res) => {
    try {
        await ContactMessage.findByIdAndUpdate(req.params.id, {
            status: "read"
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to update message"
        });
    }
});

/* =====================================================
   MARK MESSAGE AS REPLIED
===================================================== */
router.post("/messages/:id/replied", async (req, res) => {
    try {
        await ContactMessage.findByIdAndUpdate(req.params.id, {
            status: "replied"
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to update message"
        });
    }
});

/* =====================================================
   GET ADMIN NOTIFICATIONS
===================================================== */
router.get("/notifications", async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
});

/* =====================================================
   MARK NOTIFICATION AS READ
===================================================== */
router.post("/notifications/:id/read", async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, {
            isRead: true
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });
    }
});

module.exports = router;
