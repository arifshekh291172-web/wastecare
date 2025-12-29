const express = require("express");
const fetch = require("node-fetch");
const { ChatMessage } = require("../models");

const router = express.Router();

/* ================= CHAT API ================= */
router.post("/", async (req, res) => {
  const { message, userId } = req.body;

  if (!message) {
    return res.json({ reply: "Message is required" });
  }

  try {
    // Save user message
    if (userId) {
      await ChatMessage.create({
        user: userId,
        role: "user",
        message
      });
    }

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
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "No response from AI";

    // Save bot reply
    if (userId) {
      await ChatMessage.create({
        user: userId,
        role: "assistant",
        message: reply
      });
    }

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ reply: "AI service unavailable" });
  }
});

module.exports = router;
