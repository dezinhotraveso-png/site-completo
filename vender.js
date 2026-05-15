function getUsers() { return JSON.parse(localStorage.getItem("tech_users_v2")) || []; }
function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    return getUsers().find(u => u.email === email) || null;
}

function initVender() {
    const user = getLoggedUser();
    if (!user) { window.location.href = "index.html"; return; }
    if (user.role !== "admin" && user.role !== "seller") {
        showToast("❌ Acesso negado. Você não tem permissão para cadastrar produtos.", "error", 3000);
        setTimeout(() => window.location.href = "dashboard.html", 1600);
        return;
    }
    const roleTag = document.getElementById("roleTag");
    roleTag.innerText = user.role === "admin" ? "⚙️ Admin" : "🏪 Vendedor";
    roleTag.className = "role-tag " + user.role;
}

function previewImage() {
    const url = document.getElementById("pImage").value.trim();
    const box = document.getElementById("imgPreviewBox");
    const img = document.getElementById("imgPreview");
    if (url) {
        img.src = url;
        img.onerror = () => { box.style.display = "none"; showToast("Não foi possível carregar a imagem nessa URL.", "warning"); };
        img.onload = () => { box.style.display = "block"; };
    } else {
        box.style.display = "none";
    }
}

function submitProduct(e) {
    e.preventDefault();
    const user = getLoggedUser();
    const name = document.getElementById("pName").value.trim();
    const price = parseFloat(document.getElementById("pPrice").value);
    const category = document.getElementById("pCategory").value;
    const image = document.getElementById("pImage").value.trim();
    const featuresRaw = document.getElementById("pFeatures").value.trim();
    const condition = document.getElementById("pCondition").value;
    const stock = parseInt(document.getElementById("pStock").value) || 1;

    if (!name) { showToast("Informe o nome do produto.", "error"); return; }
    if (!price || price <= 0) { showToast("Informe um preço válido.", "error"); return; }
    if (!category) { showToast("Selecione uma categoria.", "error"); return; }
    if (!image) { showToast("Informe a URL da imagem.", "error"); return; }

    const features = featuresRaw
        ? featuresRaw.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : ["Produto de alta qualidade", "Garantia inclusa", "Envio rápido"];

    const products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const newProduct = {
        id: Date.now(),
        name, price, category, image, features,
        condition, stock,
        seller: user.email,
        sellerName: user.name || user.email.split('@')[0],
        addedAt: new Date().toLocaleDateString('pt-BR')
    };

    products.push(newProduct);
    localStorage.setItem("tech_products", JSON.stringify(products));

    document.querySelector(".vender-form").style.display = "none";
    document.getElementById("successMsg").style.display = "flex";
}

function resetForm() {
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pCategory").value = "";
    document.getElementById("pImage").value = "";
    document.getElementById("pFeatures").value = "";
    document.getElementById("pStock").value = "1";
    document.getElementById("imgPreviewBox").style.display = "none";
    document.querySelector(".vender-form").style.display = "block";
    document.getElementById("successMsg").style.display = "none";
}
