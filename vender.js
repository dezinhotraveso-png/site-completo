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

    const select = document.getElementById("pCategory");
    if (select) {
        const cats = JSON.parse(localStorage.getItem("tech_categories")) || [
            {name:"Teclados",emoji:"⌨️"},{name:"Mouses",emoji:"🖱️"},
            {name:"Monitores",emoji:"🖥️"},{name:"Headsets",emoji:"🎧"},
            {name:"Smartwatches",emoji:"⌚"},{name:"Notebooks",emoji:"💻"},
            {name:"Periféricos",emoji:"🕹️"},{name:"Setups",emoji:"🎮"}
        ];
        select.innerHTML = '<option value="">Selecione...</option>' +
            cats.map(c => `<option value="${c.name}">${c.emoji} ${c.name}</option>`).join('');
    }
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

/* ---- PHOTO PICKER ---- */
let selectedPhotoUrl = null;

async function openPhotoPicker() {
    const name = document.getElementById("pName").value.trim();
    const category = document.getElementById("pCategory").value;

    if (!category) {
        showToast("Selecione uma categoria primeiro.", "warning");
        return;
    }

    const btn = document.querySelector(".ai-photo-btn");
    btn.disabled = true;
    btn.textContent = "⏳ Buscando...";

    try {
        const params = new URLSearchParams({ category, name });
        const res = await fetch(`/api/github/images?${params}`);
        const data = await res.json();
        renderPhotoPicker(data.images || []);
    } catch (e) {
        showToast("Erro ao buscar fotos. Tente novamente.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "✨ Buscar Fotos";
    }
}

function renderPhotoPicker(images) {
    const picker = document.getElementById("photoPicker");
    const grid = document.getElementById("photoGrid");
    const useBtn = document.getElementById("photoUseBtn");

    selectedPhotoUrl = null;
    useBtn.style.display = "none";

    grid.innerHTML = images.map((url, i) => `
        <div class="photo-option" onclick="selectPhoto(this, '${url}')">
            <img src="${url}" alt="Foto ${i + 1}" loading="lazy"
                 onerror="this.parentElement.style.display='none'">
            <div class="check">✓</div>
        </div>
    `).join('');

    picker.style.display = "block";
    picker.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function selectPhoto(el, url) {
    document.querySelectorAll(".photo-option").forEach(p => p.classList.remove("selected"));
    el.classList.add("selected");
    selectedPhotoUrl = url;
    document.getElementById("photoUseBtn").style.display = "block";
}

function useSelectedPhoto() {
    if (!selectedPhotoUrl) return;
    document.getElementById("pImage").value = selectedPhotoUrl;
    document.getElementById("photoPicker").style.display = "none";
    previewImage();
    showToast("✅ Foto selecionada!", "success", 2000);
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
    if (!image) { showToast("Informe a URL da imagem ou use ✨ Buscar Fotos.", "error"); return; }

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
    document.getElementById("photoPicker").style.display = "none";
    document.querySelector(".vender-form").style.display = "block";
    document.getElementById("successMsg").style.display = "none";
}
