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
    renderMeusProdutos();
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
    renderMeusProdutos();
}

/* =====================================================
   MEUS PRODUTOS — listagem
   ===================================================== */
function renderMeusProdutos() {
    const user = getLoggedUser();
    if (!user) return;

    const allProducts = JSON.parse(localStorage.getItem("tech_products")) || [];
    const meus = user.role === "admin"
        ? allProducts
        : allProducts.filter(p => p.seller === user.email);

    const lista = document.getElementById("meusProdutosList");
    const count = document.getElementById("meusCount");
    if (!lista) return;

    count.textContent = meus.length + (meus.length === 1 ? " produto" : " produtos");

    if (meus.length === 0) {
        lista.innerHTML = `<div class="meus-empty"><span>📦</span>Você ainda não publicou nenhum produto.</div>`;
        return;
    }

    lista.innerHTML = meus.map(p => {
        const imgEl = p.image
            ? `<img class="meu-produto-img" src="${p.image}" alt="${p.name}" onerror="this.outerHTML='<div class=\\'meu-produto-img-placeholder\\'>📦</div>'">`
            : `<div class="meu-produto-img-placeholder">📦</div>`;
        return `
        <div class="meu-produto-card">
            ${imgEl}
            <div class="meu-produto-info">
                <div class="meu-produto-nome">${p.name}</div>
                <div class="meu-produto-meta">
                    <span class="meu-badge preco">R$ ${Number(p.price).toFixed(2)}</span>
                    <span class="meu-badge estoque">Estoque: ${p.stock ?? 1}</span>
                    <span class="meu-badge cat">${p.category}</span>
                    <span class="meu-badge cond">${p.condition || 'Novo'}</span>
                </div>
            </div>
            <div class="meu-produto-acoes">
                <button class="btn-editar" onclick="abrirEdicao(${p.id})">✏️ Editar</button>
                <button class="btn-excluir" onclick="excluirProduto(${p.id})">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function excluirProduto(id) {
    if (!confirm("Tem certeza que quer excluir este produto? Esta ação não pode ser desfeita.")) return;
    let products = JSON.parse(localStorage.getItem("tech_products")) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem("tech_products", JSON.stringify(products));
    renderMeusProdutos();
    showToast("🗑️ Produto excluído.", "success", 2000);
}

/* =====================================================
   EDIÇÃO — galeria de fotos dentro do modal
   ===================================================== */
let editGallerySlots = [''];
let editActiveSlot = 0;
let editSelectedPhotoUrl = null;

function editRenderGallery() {
    const container = document.getElementById('editPhotoGallery');
    if (!container) return;
    container.innerHTML = editGallerySlots.map((url, i) => `
        <div class="photo-slot${i === 0 ? ' is-main' : ''}" id="eslot-${i}">
            <div class="slot-preview-wrap" id="eslotPreview-${i}">
                ${url
                    ? `<img src="${url}" class="slot-thumb" onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`
                    : `<div class="slot-placeholder">📷</div>`}
            </div>
            <div class="slot-inputs">
                <span class="slot-label${i === 0 ? ' main' : ''}">${i === 0 ? '⭐ Foto Principal' : 'Foto ' + (i + 1)}</span>
                <input type="url" class="slot-url-input" id="eslotUrl-${i}" value="${url}"
                       placeholder="URL da imagem..." oninput="editUpdateSlotPreview(${i})">
            </div>
            <div class="slot-btns">
                <button type="button" class="ai-photo-btn" onclick="editOpenPhotoPicker(${i})">✨ Buscar</button>
                ${i > 0 ? `<button type="button" class="btn-remove-slot" onclick="editRemovePhotoSlot(${i})">✕ Remover</button>` : ''}
            </div>
        </div>
    `).join('');
    const addBtn = document.getElementById('editBtnAddPhoto');
    if (addBtn) addBtn.style.display = editGallerySlots.length >= 6 ? 'none' : 'flex';
}

function editUpdateSlotPreview(i) {
    const input = document.getElementById(`eslotUrl-${i}`);
    if (!input) return;
    const url = input.value.trim();
    editGallerySlots[i] = url;
    const wrap = document.getElementById(`eslotPreview-${i}`);
    if (!wrap) return;
    wrap.innerHTML = url
        ? `<img src="${url}" class="slot-thumb" onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`
        : `<div class="slot-placeholder">📷</div>`;
}

function editAddPhotoSlot() {
    if (editGallerySlots.length >= 6) return;
    editGallerySlots.push('');
    editRenderGallery();
}

function editRemovePhotoSlot(i) {
    if (i === 0 || editGallerySlots.length <= 1) return;
    editGallerySlots.splice(i, 1);
    editRenderGallery();
}

function editGetGalleryImages() {
    return editGallerySlots.map(u => u.trim()).filter(u => u.length > 0);
}

async function editOpenPhotoPicker(slotIndex) {
    const name = document.getElementById("editName").value.trim();
    const category = document.getElementById("editCategory").value;
    if (!category) { showToast("Selecione uma categoria primeiro.", "warning"); return; }

    editActiveSlot = slotIndex;
    const btns = document.querySelectorAll('#editModal .ai-photo-btn');
    btns.forEach(b => b.disabled = true);
    const clicked = document.querySelector(`#eslot-${slotIndex} .ai-photo-btn`);
    if (clicked) clicked.textContent = "⏳ Buscando...";

    try {
        const params = new URLSearchParams({ category, name });
        const res = await fetch(`/api/github/images?${params}`);
        const data = await res.json();
        editRenderPhotoPicker(data.images || []);
    } catch (e) {
        showToast("Erro ao buscar fotos.", "error");
    } finally {
        btns.forEach(b => b.disabled = false);
        if (clicked) clicked.textContent = "✨ Buscar";
    }
}

function editRenderPhotoPicker(images) {
    const picker = document.getElementById("editPhotoPicker");
    const grid   = document.getElementById("editPhotoGrid");
    const useBtn = document.getElementById("editPhotoUseBtn");
    editSelectedPhotoUrl = null;
    useBtn.style.display = "none";
    grid.innerHTML = images.map((url, i) => `
        <div class="photo-option" onclick="editSelectPhoto(this, '${url}')">
            <img src="${url}" alt="Foto ${i + 1}" loading="lazy" onerror="this.parentElement.style.display='none'">
            <div class="check">✓</div>
        </div>
    `).join('');
    picker.style.display = "block";
}

function editSelectPhoto(el, url) {
    document.querySelectorAll('#editPhotoPicker .photo-option').forEach(p => p.classList.remove("selected"));
    el.classList.add("selected");
    editSelectedPhotoUrl = url;
    document.getElementById("editPhotoUseBtn").style.display = "block";
}

function editUseSelectedPhoto() {
    if (!editSelectedPhotoUrl) return;
    editGallerySlots[editActiveSlot] = editSelectedPhotoUrl;
    const input = document.getElementById(`eslotUrl-${editActiveSlot}`);
    if (input) input.value = editSelectedPhotoUrl;
    const wrap = document.getElementById(`eslotPreview-${editActiveSlot}`);
    if (wrap) wrap.innerHTML = `<img src="${editSelectedPhotoUrl}" class="slot-thumb" onerror="this.parentElement.innerHTML='<div class=\\'slot-placeholder\\'>❌</div>'">`;
    document.getElementById("editPhotoPicker").style.display = "none";
    showToast("✅ Foto adicionada!", "success", 2000);
}

/* =====================================================
   EDIÇÃO — abrir / fechar / salvar
   ===================================================== */
function abrirEdicao(id) {
    const products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const p = products.find(x => x.id === id);
    if (!p) return;

    document.getElementById("editId").value = id;
    document.getElementById("editName").value = p.name;
    document.getElementById("editPrice").value = p.price;
    document.getElementById("editStock").value = p.stock ?? 1;

    const catSelect = document.getElementById("editCategory");
    const cats = JSON.parse(localStorage.getItem("tech_categories")) || [
        {name:"Teclados",emoji:"⌨️"},{name:"Mouses",emoji:"🖱️"},
        {name:"Monitores",emoji:"🖥️"},{name:"Headsets",emoji:"🎧"},
        {name:"Smartwatches",emoji:"⌚"},{name:"Notebooks",emoji:"💻"},
        {name:"Periféricos",emoji:"🕹️"},{name:"Setups",emoji:"🎮"}
    ];
    catSelect.innerHTML = '<option value="">Selecione...</option>' +
        cats.map(c => `<option value="${c.name}"${c.name === p.category ? ' selected' : ''}>${c.emoji} ${c.name}</option>`).join('');

    const condSelect = document.getElementById("editCondition");
    condSelect.value = p.condition || "Novo";

    const feats = Array.isArray(p.features) ? p.features.join('\n') : (p.features || '');
    document.getElementById("editFeatures").value = feats;

    editGallerySlots = (p.images && p.images.length > 0) ? [...p.images] : (p.image ? [p.image] : ['']);
    document.getElementById("editPhotoPicker").style.display = "none";
    editRenderGallery();

    document.getElementById("editModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function fecharModal() {
    document.getElementById("editModal").style.display = "none";
    document.body.style.overflow = "";
}

function closeEditModal(e) {
    if (e.target === document.getElementById("editModal")) fecharModal();
}

function salvarEdicao(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("editId").value);
    const name     = document.getElementById("editName").value.trim();
    const price    = parseFloat(document.getElementById("editPrice").value);
    const category = document.getElementById("editCategory").value;
    const condition= document.getElementById("editCondition").value;
    const stock    = parseInt(document.getElementById("editStock").value) || 0;
    const featRaw  = document.getElementById("editFeatures").value.trim();
    const images   = editGetGalleryImages();

    if (!name)   { showToast("Informe o nome do produto.", "error"); return; }
    if (!price || price <= 0) { showToast("Informe um preço válido.", "error"); return; }
    if (!category) { showToast("Selecione uma categoria.", "error"); return; }
    if (images.length === 0) { showToast("Adicione ao menos uma foto.", "error"); return; }

    const features = featRaw
        ? featRaw.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : [];

    let products = JSON.parse(localStorage.getItem("tech_products")) || [];
    products = products.map(p => {
        if (p.id !== id) return p;
        return { ...p, name, price, category, condition, stock, features, image: images[0], images };
    });
    localStorage.setItem("tech_products", JSON.stringify(products));

    fecharModal();
    renderMeusProdutos();
    showToast("✅ Produto atualizado com sucesso!", "success", 2500);
}
