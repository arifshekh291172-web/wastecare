async function loadDashboard() {
  const messagesRes = await fetch("/api/admin/messages");
  const messages = await messagesRes.json();

  const notifRes = await fetch("/api/admin/notifications");
  const notifs = await notifRes.json();

  // COUNTS
  document.getElementById("totalMessages").innerText = messages.length;
  document.getElementById("newMessages").innerText =
    messages.filter(m => m.status === "new").length;
  document.getElementById("readMessages").innerText =
    messages.filter(m => m.status === "read").length;
  document.getElementById("repliedMessages").innerText =
    messages.filter(m => m.status === "replied").length;

  // MESSAGES TABLE
  const tbody = document.getElementById("messages");
  tbody.innerHTML = "";

  messages.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.subject || "-"}</td>
        <td><span class="status status-${m.status}">${m.status}</span></td>
      </tr>
    `;
  });

  // NOTIFICATIONS
  const ul = document.getElementById("notifications");
  ul.innerHTML = "";
  notifs.forEach(n => {
    ul.innerHTML += `<li>${n.title} – ${n.message}</li>`;
  });
}

loadDashboard();
setInterval(loadDashboard, 10000);
