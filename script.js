function showLogin() {
    document.getElementById("loginArea").style.display = "block";
    document.getElementById("registerArea").style.display = "none";
    document.getElementById("loginTab").classList.add("active");
    document.getElementById("registerTab").classList.remove("active");
    document.getElementById("msg").innerText = "";
}

function showRegister() {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("registerArea").style.display = "block";
    document.getElementById("registerTab").classList.add("active");
    document.getElementById("loginTab").classList.remove("active");
    document.getElementById("msg").innerText = "";
}

/* ---- Helpers de usuário ---- */
function getUsers() {
    return JSON.parse(localStorage.getItem("tech_users_v2")) || [];
}
function saveUsers(users) {
    localStorage.setItem("tech_users_v2", JSON.stringify(users));
}
function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    const users = getUsers();
    return users.find(u => u.email === email) || null;
}

function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!email || !password) { msg.style.color = "#ff4d4d"; msg.innerText = "Preencha todos os campos."; return; }

    if (email === "admin@tech.com" && password) {
        localStorage.setItem("loggedEmail", email);
        window.location.href = "dashboard.html";
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem("loggedEmail", email);
        window.location.href = "dashboard.html";
    } else {
        msg.style.color = "#ff4d4d";
        msg.innerText = "Email ou senha incorretos.";
    }
}

function register() {
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const name = document.getElementById("registerName") ? document.getElementById("registerName").value.trim() : "";
    const msg = document.getElementById("msg");

    if (!email || !password) { msg.style.color = "#ff4d4d"; msg.innerText = "Preencha todos os campos."; return; }
    if (password.length < 6) { msg.style.color = "#ff4d4d"; msg.innerText = "A senha deve ter pelo menos 6 caracteres."; return; }

    const users = getUsers();
    if (users.find(u => u.email === email)) { msg.style.color = "#ff4d4d"; msg.innerText = "Este email já está cadastrado."; return; }

    users.push({ email, password, name: name || email.split('@')[0], role: "user", createdAt: new Date().toLocaleDateString('pt-BR') });
    saveUsers(users);

    msg.style.color = "#00ff88";
    msg.innerText = "✅ Conta criada! Faça login agora.";
    setTimeout(showLogin, 1500);
}
