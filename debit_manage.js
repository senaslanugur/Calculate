        const STORAGE_KEY = "debit";
        const STORAGE_TOTAL_KEY = "debit_total_percent";
        const rowsContainer = document.getElementById("rowsContainer");
        const karZararEl = document.getElementById("kar_zarar");

        // Toplamı hesapla ve ekrana yaz
        function updateTotal() {
            const amounts = Array.from(rowsContainer.querySelectorAll("input[type=number]"))
                .map(input => parseFloat(input.value) || 0);

            const total = amounts.reduce((sum, val) => sum + val, 0);
            const percentStr = total.toFixed(2);

            // Renk: pozitif yeşil, negatif kırmızı
            if (total > 0) {
                karZararEl.textContent = percentStr;
                karZararEl.className = "text-2xl font-bold tracking-tight leading-tight text-red-500";
            } else if (total < 0) {
                karZararEl.textContent = percentStr.replace("-", "−"); // güzel tire
                karZararEl.className = "text-2xl font-bold tracking-tight leading-tight text-red-500";
            } else {
                karZararEl.textContent = "0.00";
                karZararEl.className = "text-2xl font-bold tracking-tight leading-tight text-slate-500 dark:text-slate-400";
            }

            // Toplam yüzdeyi de kaydet (isteğe bağlı)
            localStorage.setItem(STORAGE_TOTAL_KEY, total.toFixed(2));
        }

        function saveToStorage() {
            const data = Array.from(rowsContainer.children).map(row => ({
                aciklama: row.querySelector("input[type=text]").value.trim(),
                miktar: row.querySelector("input[type=number]").value.trim()
            })).filter(item => item.aciklama || item.miktar);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            updateTotal(); // Her kaydetmede toplam güncellensin
        }

        function createRow(data = { aciklama: "", miktar: "" }) {
            const div = document.createElement("div");
            div.className = "flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800/50";

            div.innerHTML = `
      <div class="flex-1">
        <input class="w-full border-0 bg-transparent p-1 text-base placeholder:text-slate-500 focus:ring-0 dark:text-white"
               placeholder="Açıklama Girin (örn: Fatura)" type="text" value="${data.aciklama || ''}">
      </div>
      <div class="w-px self-stretch bg-slate-200 dark:bg-slate-700"></div>
      
      <div class="w-28 flex justify-end">
        <input class="w-20 border-0 bg-transparent px-2 py-1 text-right text-base tabular-nums focus:ring-0 dark:text-white
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                       flex items-center justify-center"
               style="height: 38px; line-height: 38px;"
               placeholder="0" type="number" step="0.01" value="${data.miktar || ''}">
      </div>

      <button class="deleteBtn flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:bg-red-500/10">
        <span class="material-symbols-outlined text-xl">delete</span>
      </button>
    `;

            const inputs = div.querySelectorAll("input");
            inputs.forEach(input => {
                input.addEventListener("input", () => {
                    saveToStorage();
                });
            });

            div.querySelector(".deleteBtn").addEventListener("click", () => {
                div.remove();
                saveToStorage();
            });

            return div;
        }

        function loadFromStorage() {
            rowsContainer.innerHTML = "";
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const items = JSON.parse(saved);
                    items.forEach(item => {
                        if (item.aciklama || item.miktar) {
                            rowsContainer.appendChild(createRow(item));
                        }
                    });
                } catch (e) {
                    console.error("Veri bozuk", e);
                }
            }

            if (rowsContainer.children.length === 0) {
                rowsContainer.appendChild(createRow());
            }

            // Önceki toplamı geri yükle (isteğe bağlı)
            const savedTotal = localStorage.getItem(STORAGE_TOTAL_KEY);
            if (savedTotal) {
                const total = parseFloat(savedTotal);
                karZararEl.textContent = total >= 0 ? "+" + total.toFixed(2) + "%" : total.toFixed(2) + "%";
                karZararEl.className = total > 0 ? "text-2xl font-bold tracking-tight leading-tight text-green-500" :
                    total < 0 ? "text-2xl font-bold tracking-tight leading-tight text-red-500" :
                        "text-2xl font-bold tracking-tight leading-tight text-slate-500 dark:text-slate-400";
            }

            updateTotal(); // En güncel hali göster
        }

        document.getElementById("addRowBtn").addEventListener("click", () => {
            rowsContainer.appendChild(createRow());
            saveToStorage();
        });

        document.getElementById("saveBtn").addEventListener("click", () => {
            saveToStorage();
            // alert("Tüm veriler ve toplam güncellendi!");
            // calculate();
        });

        window.addEventListener("load", loadFromStorage);