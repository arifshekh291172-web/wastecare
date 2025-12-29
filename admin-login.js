async function adminLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("error");

    errorBox.innerText = "";

    if (!email || !password) {
        errorBox.innerText = "Email and password required";
        return;
    }

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
        errorBox.innerText = data.message;
        return;
    }

    // success
    window.location.href = "dashboard.html";
}
