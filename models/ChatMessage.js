const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false // guest users allowed
        },

        role: {
            type: String,
            enum: ["user", "assistant", "system"],
            required: true
        },

        message: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
