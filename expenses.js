// harcamalar.js
(function () {
    const STORAGE_KEY = "harcamlar";

    // DOM hazır olunca başlat
    function init() {
        const rowsContainer = document.getElementById("rowsContainer");
        const addRowBtn = document.getElementById("addRowBtn");
        const karZararEl = document.getElementById("kar_zarar");

        if (!rowsContainer || !addRowBtn || !karZararEl) {
            console.error("harcamalar.js: Gerekli elementler bulunamadı. IDs: rowsContainer, addRowBtn, kar_zarar");
            return;
        }

        function getHarcamalar() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (err) {
                console.error("harcamalar.js: localStorage parse hatası:", err, "Raw:", localStorage.getItem(STORAGE_KEY));
                // bozuk veri varsa temizle ve boş dizi döndür
                localStorage.removeItem(STORAGE_KEY);
                return [];
            }
        }

        function setHarcamalar(arr) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
            } catch (err) {
                console.error("harcamalar.js: localStorage set hatası:", err);
            }
        }

        function formatNumber(n) {
            return Number(n || 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        function updateTotal() {
            const list = getHarcamalar();
            const sum = list.reduce((acc, it) => acc + (parseFloat(it.ucret) || 0), 0);
            karZararEl.textContent = formatNumber(sum);
        }

        function createDisplayRow(item, index) {
            const row = document.createElement("div");
            row.className = "flex items-center justify-between gap-2 rounded-xl p-3 bg-white/60 dark:bg-zinc-800/60";

            const left = document.createElement("div");
            left.className = "flex flex-col";
            const det = document.createElement("div");
            det.className = "text-sm font-medium text-slate-700 dark:text-slate-200";
            det.textContent = item.detay || "(Açıklama yok)";
            const idx = document.createElement("div");
            idx.className = "text-xs text-zinc-500 dark:text-zinc-400";
            idx.textContent = `#${index + 1}`;
            left.appendChild(det);
            left.appendChild(idx);

            const right = document.createElement("div");
            right.className = "flex items-center gap-2";

            const price = document.createElement("div");
            price.className = "text-sm font-bold text-red-500";
            price.textContent = formatNumber(item.ucret);

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "p-2 rounded-md text-zinc-500 hover:text-red-500";
            delBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            delBtn.addEventListener("click", () => {
                const list = getHarcamalar();
                list.splice(index, 1);
                setHarcamalar(list);
                renderList();
            });

            right.appendChild(price);
            right.appendChild(delBtn);

            row.appendChild(left);
            row.appendChild(right);
            return row;
        }

        function createEditorRow() {
            const row = document.createElement("div");
            row.className = "flex flex-col gap-2 rounded-xl p-3 bg-white/60 dark:bg-zinc-800/60";

            const inputs = document.createElement("div");
            inputs.className = "flex gap-2 w-full";

            const detayInput = document.createElement("input");
            detayInput.type = "text";
            detayInput.placeholder = "Harcama detayı";
            detayInput.className = "flex-1 rounded-md border px-3 py-2 text-sm outline-none dark:bg-zinc-900 dark:border-zinc-700";

            const ucretInput = document.createElement("input");
            ucretInput.type = "number";
            ucretInput.step = "0.01";
            ucretInput.min = "0";
            ucretInput.placeholder = "0.00";
            ucretInput.className = "w-36 rounded-md border px-3 py-2 text-sm outline-none dark:bg-zinc-900 dark:border-zinc-700";
            ucretInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") save();
            });

            inputs.appendChild(detayInput);
            inputs.appendChild(ucretInput);

            const actions = document.createElement("div");
            actions.className = "flex gap-2";

            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white";
            saveBtn.textContent = "Kaydet";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "rounded-lg border px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300";
            cancelBtn.textContent = "İptal";

            actions.appendChild(saveBtn);
            actions.appendChild(cancelBtn);

            row.appendChild(inputs);
            row.appendChild(actions);

            function save() {
                const detay = detayInput.value.trim();
                const ucretRaw = ucretInput.value.trim();
                const ucret = parseFloat(ucretRaw);
                if (!detay) {
                    if (window.Swal) Swal.fire({
                        icon: "warning",
                        text: "Lütfen harcama detayı girin."
                    });
                    else alert("Lütfen harcama detayı girin.");
                    return;
                }
                if (!ucretRaw || isNaN(ucret)) {
                    if (window.Swal) Swal.fire({
                        icon: "warning",
                        text: "Lütfen geçerli bir tutar girin."
                    });
                    else alert("Lütfen geçerli bir tutar girin.");
                    return;
                }
                const list = getHarcamalar();
                list.push({
                    detay,
                    ucret: Number(ucret.toFixed(2))
                });
                setHarcamalar(list);
                renderList();
            }

            saveBtn.addEventListener("click", save);
            cancelBtn.addEventListener("click", () => {
                renderList();
            });

            setTimeout(() => detayInput.focus(), 50);

            return row;
        }

        function renderList() {
            const list = getHarcamalar();
            rowsContainer.innerHTML = "";
            if (list.length === 0) {
                const empty = document.createElement("div");
                empty.className = "text-sm text-zinc-500 dark:text-zinc-400";
                empty.textContent = "Henüz harcama eklenmemiş.";
                rowsContainer.appendChild(empty);
            } else {
                list.forEach((it, idx) => {
                    rowsContainer.appendChild(createDisplayRow(it, idx));
                });
            }
            updateTotal();
            console.log("harcamalar.js: renderList çalıştı. Eleman sayısı:", list.length);
        }

        addRowBtn.addEventListener("click", () => {
            const existingEditor = rowsContainer.querySelector(".editor-active");
            if (existingEditor) return;
            const editor = createEditorRow();
            rowsContainer.prepend(editor);
            editor.classList.add("editor-active");
        });

        // İlk render
        renderList();

        // debug için expose et (İsteğe bağlı)
        window._harcamalar_debug = {
            getHarcamalar,
            setHarcamalar,
            renderList,
            clearAll: function () {
                localStorage.removeItem(STORAGE_KEY);
                renderList();
            }
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();