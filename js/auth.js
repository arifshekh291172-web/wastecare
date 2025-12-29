/* ======================================================
   AUTH.JS – COMPLETE FRONTEND AUTH LOGIC
   Features:
   ✔ Email + Password Login
   ✔ Email Signup with OTP verification
   ✔ Google OAuth Login / Signup
   ✔ Clean redirects & validations
====================================================== */

/* ===================== LOGIN ===================== */

async function login() {
  const emailEl = document.getElementById("loginEmail");
  const passEl = document.getElementById("loginPassword");

  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      // Login success
      window.location.href = "/dashboard.html";
    }

  } catch (err) {
    alert("Login failed. Please try again.");
  }
}

/* ===================== GOOGLE LOGIN / SIGNUP ===================== */

function googleLogin() {
  // Same function used in login & register pages
  window.location.href = "/auth/google";
}

/* ===================== REGISTER – SEND OTP ===================== */

async function sendRegisterOTP() {
  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");

  if (!nameEl || !emailEl || !passEl || !confirmEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passEl.value;
  const confirmPassword = confirmEl.value;

  if (!name || !email || !password || !confirmPassword) {
    alert("All fields are required");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch("/api/register/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      // Move to OTP step
      const step1 = document.getElementById("step1");
      const step2 = document.getElementById("step2");

      if (step1 && step2) {
        step1.style.display = "none";
        step2.style.display = "block";
      }
    }

  } catch (err) {
    alert("Unable to send verification code");
  }
}

/* ===================== REGISTER – VERIFY OTP ===================== */

async function verifyRegisterOTP() {
  const emailEl = document.getElementById("email");
  const otpEl = document.getElementById("otp");

  if (!emailEl || !otpEl) return;

  const email = emailEl.value.trim();
  const otp = otpEl.value.trim();

  if (!otp) {
    alert("Please enter OTP");
    return;
  }

  try {
    const res = await fetch("/api/register/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      // Registration complete
      window.location.href = "/login.html";
    }

  } catch (err) {
    alert("OTP verification failed");
  }
}

/* ===================== FORGOT PASSWORD (OPTIONAL) ===================== */

async function sendForgotOTP() {
  const emailEl = document.getElementById("forgotEmail");
  if (!emailEl) return;

  const email = emailEl.value.trim();
  if (!email) {
    alert("Email is required");
    return;
  }

  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message);

  } catch {
    alert("Unable to send OTP");
  }
}

async function resetPassword() {
  const email = document.getElementById("forgotEmail")?.value.trim();
  const otp = document.getElementById("otp")?.value.trim();
  const newPassword = document.getElementById("newPassword")?.value;

  if (!email || !otp || !newPassword) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      window.location.href = "/login.html";
    }

  } catch {
    alert("Password reset failed");
  }
}
