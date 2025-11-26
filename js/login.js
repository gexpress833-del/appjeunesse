document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const feedback = document.getElementById("loginFeedback");
  const usersKey = "appUsers";
  const defaultUsers = [
    { username: "admin", password: "admin123", role: "admin", dept: null },
    { username: "secretariat", password: "secret123", role: "secretariat", dept: null },
    { username: "responsable", password: "resp123", role: "responsable", dept: "DLB" },
    { username: "user", password: "user123", role: "user", dept: "Accueil" }
  ];

  function loadUsers() {
    const stored = localStorage.getItem(usersKey);
    if (!stored) {
      localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch {
      // ignore
    }
    localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  const users = loadUsers();
  const pages = {
    admin: "admin.html",
    secretariat: "secretariat.html",
    responsable: "responsable.html",
    user: "user.html"
  };

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const found = users.find((item) => item.username === username && item.password === password);
    if (!found) {
      if (feedback) {
        feedback.textContent = "Identifiants invalides.";
        feedback.classList.remove("dot-green");
        feedback.classList.add("dot-red");
      }
      return;
    }
    localStorage.setItem("appRole", found.role);
    if (found.dept) {
      localStorage.setItem("appDept", found.dept);
    } else {
      localStorage.removeItem("appDept");
    }
    localStorage.setItem("appUser", found.username);
    window.location.href = pages[found.role] || "index.html";
  });
});

