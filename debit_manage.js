function openDebitPopup() {
    const STORAGE_KEY = "debit";
    const STORAGE_TOTAL_KEY = "debit_total_percent";

    // Popup içeriği (HTML yapısı)
    const popupHtml = `
        <div class="text-left font-display">
            <div id="swalRowsContainer" class="flex flex-col gap-3 max-h-[50vh] overflow-y-auto p-2">
                </div>
            <div class="mt-4 p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button id="swalAddRow" class="flex items-center gap-1 text-sm font-bold text-accent-blue">
                    <span class="material-icons-round text-lg">add_circle</span> Satır Ekle
                </button>
                <div class="text-right">
                    <span class="text-xs text-text-muted uppercase">Toplam Borç:</span>
                    <div id="swalTotal" class="text-xl font-bold text-red-500">₺0.00</div>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        title: 'Borç Yönetimi',
        html: popupHtml,
        width: '500px',
        showConfirmButton: true,
        confirmButtonText: 'Kapat ve Kaydet',
        confirmButtonColor: '#137fec',
        background: document.documentElement.classList.contains('dark') ? '#1a2131' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        didOpen: () => {
            const container = document.getElementById('swalRowsContainer');
            const totalEl = document.getElementById('swalTotal');

            // --- Yardımcı Fonksiyonlar ---
            const calculateTotal = () => {
                const rows = container.querySelectorAll('.debit-row');
                let total = 0;
                rows.forEach(row => {
                    const val = parseFloat(row.querySelector('.amount-input').value) || 0;
                    total += val;
                });
                totalEl.textContent = '₺' + total.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
                localStorage.setItem(STORAGE_TOTAL_KEY, total.toFixed(2));
                
                // Ana sayfadaki borç değerini de anlık güncelle
                const mainDebitEl = document.getElementById("toplam_borc");
                if(mainDebitEl) mainDebitEl.textContent = '₺' + total.toLocaleString('tr-TR');
            };

            const saveData = () => {
                const rows = container.querySelectorAll('.debit-row');
                const data = Array.from(rows).map(row => ({
                    aciklama: row.querySelector('.desc-input').value.trim(),
                    miktar: row.querySelector('.amount-input').value.trim()
                })).filter(item => item.aciklama || item.miktar);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                calculateTotal();
            };

            const createRow = (data = { aciklama: "", miktar: "" }) => {
                const div = document.createElement("div");
                div.className = "debit-row flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-2 rounded-lg";
                div.innerHTML = `
                    <input type="text" placeholder="Fatura, Kira vb." 
                        class="desc-input flex-1 bg-transparent border-none text-sm focus:ring-0 dark:text-white" 
                        value="${data.aciklama}">
                    <input type="number" placeholder="0" 
                        class="amount-input w-24 bg-transparent border-none text-right text-sm font-bold focus:ring-0 dark:text-white" 
                        value="${data.miktar}">
                    <button class="delete-row text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                `;

                // Event Listeners
                div.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', saveData);
                });
                div.querySelector('.delete-row').addEventListener('click', () => {
                    div.remove();
                    saveData();
                });

                return div;
            };

            // --- İlk Yükleme ---
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            if (saved.length > 0) {
                saved.forEach(item => container.appendChild(createRow(item)));
            } else {
                container.appendChild(createRow());
            }

            document.getElementById('swalAddRow').addEventListener('click', () => {
                container.appendChild(createRow());
                container.scrollTop = container.scrollHeight;
            });

            calculateTotal();
        }
    }).then(() => {
        // Popup kapandığında ana sayfadaki donut chart ve diğer verileri tazele
        if (typeof calculate === "function") calculate();
    });
}

