document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */
    const chatbotBtn = document.getElementById("chatbot-btn");
    const chatbotBox = document.getElementById("chatbot-box");
    const closeBtn = document.getElementById("chat-close");
    const fullscreenBtn = document.getElementById("chat-fullscreen");
    const messagesBox = document.getElementById("chatMessages");
    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    /* ================= SAFETY CHECK ================= */
    if (!chatbotBtn || !chatbotBox) {
        console.error("❌ Chatbot elements not found in DOM");
        return;
    }

    /* ================= OPEN CHAT ================= */
    chatbotBtn.addEventListener("click", () => {
        chatbotBox.style.display = "flex";
        input.focus();
    });

    /* ================= CLOSE CHAT ================= */
    closeBtn.addEventListener("click", () => {
        chatbotBox.style.display = "none";
        chatbotBox.classList.remove("fullscreen");
        fullscreenBtn.innerText = "⛶";
    });

    /* ================= FULLSCREEN TOGGLE ================= */
    fullscreenBtn.addEventListener("click", () => {
        chatbotBox.classList.toggle("fullscreen");
        chatbotBox.style.display = "flex";

        fullscreenBtn.innerText =
            chatbotBox.classList.contains("fullscreen") ? "🗗" : "⛶";
    });

    /* ================= QUICK BUTTONS ================= */
    document.querySelectorAll(".chat-quick button").forEach(btn => {
        btn.addEventListener("click", () => {
            const msg = btn.dataset.msg;
            sendMessage(msg);
        });
    });

    /* ================= SEND BUTTON ================= */
    sendBtn.addEventListener("click", () => {
        sendMessage();
    });

    /* ================= ENTER KEY ================= */
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    /* ================= SEND MESSAGE ================= */
    async function sendMessage(text) {
        const message = text || input.value.trim();
        if (!message) return;

        // USER MESSAGE
        appendMessage("user", message);
        input.value = "";

        // SCROLL
        messagesBox.scrollTop = messagesBox.scrollHeight;

        // TYPING INDICATOR
        const typing = document.createElement("div");
        typing.className = "bot-msg";
        typing.innerText = "AI is typing...";
        messagesBox.appendChild(typing);
        messagesBox.scrollTop = messagesBox.scrollHeight;

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            const data = await res.json();

            typing.remove();

            appendMessage("bot", data.reply || "No response received.");

        } catch (err) {
            typing.remove();
            appendMessage(
                "bot",
                "⚠️ Unable to connect to AI server. Please try again later."
            );
        }

        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    /* ================= APPEND MESSAGE ================= */
    function appendMessage(type, text) {
        const msgDiv = document.createElement("div");
        msgDiv.className = type === "user" ? "user-msg" : "bot-msg";
        msgDiv.innerHTML = text;
        messagesBox.appendChild(msgDiv);
    }

});
