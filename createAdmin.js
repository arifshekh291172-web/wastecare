/* =====================================================
   CREATE ADMIN SCRIPT – WasteCare
   Run once to create admin user
===================================================== */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

/* ===== USER MODEL ===== */
const User = require("./models/User");

/* ===== ADMIN DETAILS (CHANGE AS NEEDED) ===== */
const ADMIN_DATA = {
  name: "WasteCare Admin",
  email: "owner@wastecare.com",
  password: "admin@wastecare.com", // CHANGE THIS AFTER LOGIN
  role: "admin"
};

/* ===== CONNECT DB ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    const exists = await User.findOne({ email: ADMIN_DATA.email });
    if (exists) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);

    await User.create({
      name: ADMIN_DATA.name,
      email: ADMIN_DATA.email,
      password: hashedPassword,
      role: "admin",
      provider: "local",
      isVerified: true
    });

    console.log("✅ Admin account created successfully");
    console.log("📧 Email:", ADMIN_DATA.email);
    console.log("🔑 Password:", ADMIN_DATA.password);
    console.log("⚠️ CHANGE PASSWORD AFTER FIRST LOGIN");

    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
