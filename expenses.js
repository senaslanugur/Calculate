// test.js - Modernize Edilmiş Gider Yönetimi
const STORAGE_KEY = "harcamlar";

function getHarcamalar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function setHarcamalar(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    const toplamHarcamaEl = document.getElementById("toplam_harcama");
    if (toplamHarcamaEl) {
        const sum = arr.reduce((acc, it) => acc + (parseFloat(it.ucret) || 0), 0);
        toplamHarcamaEl.textContent = "₺" + sum.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    }
}

function openExpensesPopup() {
    const isDark = document.documentElement.classList.contains('dark');
    
    Swal.fire({
        title: '<span style="font-family: \'Inter\', sans-serif; font-weight: 800; letter-spacing: -0.02em;">GİDER YÖNETİMİ</span>',
        html: `
            <div class="text-left font-display">
                <div id="swal-rows-container" class="flex flex-col gap-3 max-h-[350px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    </div>
                <button id="swal-add-btn" class="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent-blue text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">add_circle</span> Yeni Gider Ekle
                </button>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '450px',
        padding: '2rem',
        background: isDark ? '#1a2131' : '#f8fafc', // index.html: card-dark rengi
        color: isDark ? '#f1f5f9' : '#1e293b',
        customClass: {
            popup: 'rounded-3xl border border-white/10 shadow-2xl',
            closeButton: 'hover:text-loss-red transition-colors'
        },
        didOpen: () => {
            renderSwalList();
            document.getElementById('swal-add-btn').addEventListener('click', showAddInputs);
        }
    });
}

function renderSwalList() {
    const container = document.getElementById('swal-rows-container');
    const list = getHarcamalar();
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 opacity-40">
                <span class="material-symbols-outlined text-5xl mb-2">receipt_long</span>
                <p class="text-sm font-medium">Henüz bir harcama yok</p>
            </div>`;
        return;
    }

    list.forEach((item, index) => {
        const row = document.createElement('div');
        // index.html'deki glass-card yapısına benzer stil
        row.className = "flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:border-white/20 transition-all";
        row.innerHTML = `
            <div class="flex flex-col gap-1">
                <span class="text-sm font-bold tracking-tight">${item.detay.toUpperCase()}</span>
                <span class="text-xs font-medium text-loss-red">₺${item.ucret.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <button onclick="deleteGider(${index})" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-zinc-500 hover:text-loss-red transition-all">
                <span class="material-symbols-outlined text-xl">delete_sweep</span>
            </button>
        `;
        container.appendChild(row);
    });
}

async function showAddInputs() {
    const isDark = document.documentElement.classList.contains('dark');
    
    const { value: formValues } = await Swal.fire({
        title: 'YENİ KAYIT',
        background: isDark ? '#0b0f19' : '#ffffff', // index.html: background-dark rengi
        color: isDark ? '#f1f5f9' : '#1e293b',
        html: `
            <div class="flex flex-col gap-4 p-2">
                <div class="text-left">
                    <label class="text-[10px] font-bold text-muted uppercase ml-1">Harcama Detayı</label>
                    <input id="swal-input-detay" class="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all" placeholder="Örn: Market Faturası">
                </div>
                <div class="text-left">
                    <label class="text-[10px] font-bold text-muted uppercase ml-1">Tutar (₺)</label>
                    <input id="swal-input-ucret" type="number" step="0.01" class="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all" placeholder="0.00">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'KAYDET',
        cancelButtonText: 'İPTAL',
        confirmButtonColor: '#137fec', // primary rengi
        customClass: {
            popup: 'rounded-3xl border border-white/10',
            confirmButton: 'rounded-xl px-8 py-3 font-bold',
            cancelButton: 'rounded-xl px-8 py-3 font-medium'
        },
        preConfirm: () => {
            const detay = document.getElementById('swal-input-detay').value;
            const ucret = document.getElementById('swal-input-ucret').value;
            if (!detay || !ucret) {
                Swal.showValidationMessage('Eksik bilgi girdiniz!');
                return false;
            }
            return { detay: detay, ucret: parseFloat(ucret) };
        }
    });

    if (formValues) {
        const list = getHarcamalar();
        list.push(formValues);
        setHarcamalar(list);
        openExpensesPopup(); 
    }
}

window.deleteGider = function(index) {
    const list = getHarcamalar();
    list.splice(index, 1);
    setHarcamalar(list);
    renderSwalList();
};


