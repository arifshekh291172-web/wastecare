const express = require("express");
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");

const router = express.Router();

/* CONTACT FORM SUBMIT */
router.post("/", async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.json({ success: false, message: "All fields required" });
    }

    const contact = await ContactMessage.create({
        name,
        email,
        subject,
        message
    });

    // Create notification for admin
    await Notification.create({
        title: "New Contact Message",
        message: `${name} sent a message`
    });

    res.json({ success: true, message: "Message sent successfully" });
});

module.exports = router;
