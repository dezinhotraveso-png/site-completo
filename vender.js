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

    initPhotoGallery();
}

/* =====================================================
   MULTI-PHOTO GALLERY
   ===================================================== */
let gallerySlots = [''];      // array of URL strings, one per slot
let activeSlotForPicker = 0;  // which slot the picker is targeting
let selectedPhotoUrl = null;

function initPhotoGallery() {
    gallerySlots = [''];
    renderGallery();
}

function renderGallery() {
    const container = document.getElementById('photoGallery');
    if (!container) return;

    container.innerHTML = gallerySlots.map((url, i) => `
        <div class="photo-slot${i === 0 ? ' is-main' : ''}" id="slot-${i}">
            <div class="slot-preview-wrap" id="slotPreview-${i}">
                ${url
                    ? `<img src="${url}" class="slot-thumb"
                            onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`
                    : `<div class="slot-placeholder">📷</div>`}
            </div>
            <div class="slot-inputs">
                <span class="slot-label${i === 0 ? ' main' : ''}">
                    ${i === 0 ? '⭐ Foto Principal (capa)' : `Foto ${i + 1}`}
                </span>
                <input type="url" class="slot-url-input" id="slotUrl-${i}"
                       value="${url}"
                       placeholder="Cole ou cole a URL da imagem..."
                       oninput="updateSlotPreview(${i})">
            </div>
            <div class="slot-btns">
                <button type="button" class="ai-photo-btn" onclick="openPhotoPicker(${i})">✨ Buscar</button>
                ${i > 0 ? `<button type="button" class="btn-remove-slot" onclick="removePhotoSlot(${i})">✕ Remover</button>` : ''}
            </div>
        </div>
    `).join('');

    const addBtn = document.getElementById('btnAddPhoto');
    if (addBtn) addBtn.style.display = gallerySlots.length >= 6 ? 'none' : 'flex';
}

function updateSlotPreview(i) {
    const input = document.getElementById(`slotUrl-${i}`);
    if (!input) return;
    const url = input.value.trim();
    gallerySlots[i] = url;
    const previewWrap = document.getElementById(`slotPreview-${i}`);
    if (!previewWrap) return;
    if (url) {
        previewWrap.innerHTML = `<img src="${url}" class="slot-thumb"
            onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`;
    } else {
        previewWrap.innerHTML = `<div class="slot-placeholder">📷</div>`;
    }
}

function addPhotoSlot() {
    if (gallerySlots.length >= 6) return;
    gallerySlots.push('');
    renderGallery();
    // scroll to new slot
    const newSlot = document.getElementById(`slot-${gallerySlots.length - 1}`);
    if (newSlot) newSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removePhotoSlot(i) {
    if (i === 0 || gallerySlots.length <= 1) return;
    gallerySlots.splice(i, 1);
    renderGallery();
    // Close picker if it was for this slot
    if (activeSlotForPicker === i) {
        document.getElementById('photoPicker').style.display = 'none';
    }
}

function getGalleryImages() {
    return gallerySlots.map(u => u.trim()).filter(u => u.length > 0);
}

/* ---- PHOTO PICKER ---- */
async function openPhotoPicker(slotIndex) {
    const name = document.getElementById("pName").value.trim();
    const category = document.getElementById("pCategory").value;

    if (!category) {
        showToast("Selecione uma categoria primeiro.", "warning");
        return;
    }

    activeSlotForPicker = slotIndex;

    const btns = document.querySelectorAll('.ai-photo-btn');
    btns.forEach(b => { b.disabled = true; });
    const clickedBtn = document.querySelector(`#slot-${slotIndex} .ai-photo-btn`);
    if (clickedBtn) clickedBtn.textContent = "⏳ Buscando...";

    try {
        const params = new URLSearchParams({ category, name });
        const res = await fetch(`/api/github/images?${params}`);
        const data = await res.json();
        renderPhotoPicker(data.images || []);
    } catch (e) {
        showToast("Erro ao buscar fotos. Tente novamente.", "error");
    } finally {
        btns.forEach(b => { b.disabled = false; });
        if (clickedBtn) clickedBtn.textContent = "✨ Buscar";
    }
}

function renderPhotoPicker(images) {
    const picker = document.getElementById("photoPicker");
    const grid   = document.getElementById("photoGrid");
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
    gallerySlots[activeSlotForPicker] = selectedPhotoUrl;

    // Update the input and preview without full re-render
    const input = document.getElementById(`slotUrl-${activeSlotForPicker}`);
    if (input) input.value = selectedPhotoUrl;
    const previewWrap = document.getElementById(`slotPreview-${activeSlotForPicker}`);
    if (previewWrap) {
        previewWrap.innerHTML = `<img src="${selectedPhotoUrl}" class="slot-thumb"
            onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`;
    }

    document.getElementById("photoPicker").style.display = "none";
    showToast("✅ Foto adicionada!", "success", 2000);
}

/* ---- SUBMIT ---- */
function submitProduct(e) {
    e.preventDefault();
    const user = getLoggedUser();
    const name       = document.getElementById("pName").value.trim();
    const price      = parseFloat(document.getElementById("pPrice").value);
    const category   = document.getElementById("pCategory").value;
    const featuresRaw = document.getElementById("pFeatures").value.trim();
    const condition  = document.getElementById("pCondition").value;
    const stock      = parseInt(document.getElementById("pStock").value) || 1;
    const images     = getGalleryImages();

    if (!name)              { showToast("Informe o nome do produto.", "error"); return; }
    if (!price || price <= 0) { showToast("Informe um preço válido.", "error"); return; }
    if (!category)          { showToast("Selecione uma categoria.", "error"); return; }
    if (images.length === 0) { showToast("Adicione ao menos uma foto do produto.", "error"); return; }

    const features = featuresRaw
        ? featuresRaw.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : ["Produto de alta qualidade", "Garantia inclusa", "Envio rápido"];

    const products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const newProduct = {
        id: Date.now(),
        name, price, category,
        image: images[0],     // primary image (backward compat)
        images,               // full gallery
        features,
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
    document.getElementById("pFeatures").value = "";
    document.getElementById("pStock").value = "1";
    document.getElementById("photoPicker").style.display = "none";
    document.querySelector(".vender-form").style.display = "block";
    document.getElementById("successMsg").style.display = "none";
    initPhotoGallery();
}
