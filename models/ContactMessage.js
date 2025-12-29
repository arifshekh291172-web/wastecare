const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    subject: String,
    message: String,

    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
