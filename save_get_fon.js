    // Sayfa yüklendiğinde localStorage'dan verileri yükle ve otomatik veri çek
    document.addEventListener('DOMContentLoaded', function() {
        const fonBilgisi = localStorage.getItem('fon_bilgisi');
        if (fonBilgisi) {
            const data = JSON.parse(fonBilgisi);
            const container = document.getElementById('rowsContainer');
            
            for (const [text, value] of Object.entries(data)) {
                addRow(text, value);
            }
            
            // Otomatik veri çekme
            fetchDataAutomatically();
        }
    });

    function addRow(text = '', value = '', lastOValue = '', calculatedValue = '') {
        const container = document.getElementById('rowsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'flex gap-2 items-center w-full flex-wrap bg-white dark:bg-zinc-800 p-2 rounded-lg';
        
        // Float input (önce)
        const floatInput = document.createElement('input');
        floatInput.type = 'number';
        floatInput.step = '0.01';
        floatInput.value = value;
        floatInput.placeholder = 'Sayı (float)';
        floatInput.className = 'flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white';
        
        // Text input (sonra)
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = text;
        textInput.placeholder = 'Metin';
        textInput.className = 'flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white';
        
        // Son O değeri gösteren element
        const lastOElement = document.createElement('div');
        lastOElement.className = 'px-3 py-2 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium';
        lastOElement.textContent = lastOValue ? `Son O: ${lastOValue}` : 'Yükleniyor...';
        
        // Hesaplanan değer gösteren element
        const calculatedElement = document.createElement('div');
        calculatedElement.className = 'px-3 py-2 rounded-lg bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-medium';
        calculatedElement.textContent = calculatedValue ? `Hesap: ${calculatedValue}` : 'Hesaplanıyor...';
        
        // Silme butonu
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteBtn.className = 'p-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800';
        deleteBtn.addEventListener('click', function() {
            // LocalStorage'dan sil
            const fonBilgisi = localStorage.getItem('fon_bilgisi');
            if (fonBilgisi) {
                const data = JSON.parse(fonBilgisi);
                delete data[textInput.value];
                localStorage.setItem('fon_bilgisi', JSON.stringify(data));
            }
            // Sayfadan kaldır
            newRow.remove();
            // Toplamı güncelle
            updateTotal();
        });
        
        newRow.appendChild(floatInput);
        newRow.appendChild(textInput);
        newRow.appendChild(lastOElement);
        newRow.appendChild(calculatedElement);
        newRow.appendChild(deleteBtn);
        container.appendChild(newRow);
        
        // Eğer lastOValue yoksa (yeni eklenen satır) veri çek
        if (!lastOValue) {
            fetchOValue(text, lastOElement, calculatedElement, floatInput);
        }
    }

    function fetchOValue(symbol, lastOElement, calculatedElement, floatInput) {
        const now = Math.floor(Date.now() / 1000); // Şu anki epoch time
        const url = `https://gate.fintables.com/barbar/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=1734210000&to=${now}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.o && Array.isArray(data.o) && data.o.length > 0) {
                    const lastElement = data.o[data.o.length - 1];
                    lastOElement.textContent = `Son O: ${lastElement}`;
                    
                    // Float değeri ile çarpma işlemi
                    const floatValue = parseFloat(floatInput.value) || 0;
                    const calculatedValue = (lastElement * floatValue).toFixed(2);
                    calculatedElement.textContent = `Hesap: ${calculatedValue}`;
                    
                    // Hesaplanan değeri göstermek için arka plan rengini güncelle
                    calculatedElement.className = 'px-3 py-2 rounded-lg bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-medium';
                    
                    // Toplamı güncelle
                    updateTotal();
                } else {
                    lastOElement.textContent = 'Veri bulunamadı';
                    lastOElement.className = 'px-3 py-2 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm font-medium';
                    calculatedElement.textContent = 'Hesaplanamadı';
                    calculatedElement.className = 'px-3 py-2 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm font-medium';
                    
                    // Toplamı güncelle
                    updateTotal();
                }
            })
            .catch(error => {
                lastOElement.textContent = 'Hata';
                lastOElement.className = 'px-3 py-2 rounded-lg bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-medium';
                calculatedElement.textContent = 'Hesaplanamadı';
                calculatedElement.className = 'px-3 py-2 rounded-lg bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-medium';
                console.error(`Symbol: ${symbol} için hata:`, error);
                
                // Toplamı güncelle
                updateTotal();
            });
    }

    function updateTotal() {
        const rows = document.querySelectorAll('#rowsContainer > div');
        let total = 0;
        
        rows.forEach(row => {
            const calculatedElement = row.children[3]; // Hesap elementi
            
            if (calculatedElement && calculatedElement.textContent.startsWith('Hesap:')) {
                const valueStr = calculatedElement.textContent.replace('Hesap: ', '');
                const value = parseFloat(valueStr);
                if (!isNaN(value)) {
                    total += value;
                }
            }
        });
        
        // Toplamı id="kar_zarar" alanına yaz
        const karZararElement = document.getElementById('kar_zarar');
        if (karZararElement) {
            karZararElement.textContent = total.toFixed(2);
            
            // Renk güncelleme (pozitif/negatif)
            if (total > 0) {
                karZararElement.className = 'text-green-500 tracking-tight text-2xl font-bold leading-tight';
            } else if (total < 0) {
                karZararElement.className = 'text-red-500 tracking-tight text-2xl font-bold leading-tight';
            } else {
                karZararElement.className = 'text-gray-500 tracking-tight text-2xl font-bold leading-tight';
            }
        }
    }

    function fetchDataAutomatically() {
        const fonBilgisi = localStorage.getItem('fon_bilgisi');
        if (!fonBilgisi) return;

        const data = JSON.parse(fonBilgisi);
        const rows = document.querySelectorAll('#rowsContainer > div');
        
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const textInput = inputs[1]; // Metin inputu
            const floatInput = inputs[0]; // Float inputu
            const lastOElement = row.children[2]; // Son O elementi
            const calculatedElement = row.children[3]; // Hesaplanan değer elementi
            
            if (textInput && lastOElement && calculatedElement && floatInput) {
                fetchOValue(textInput.value, lastOElement, calculatedElement, floatInput);
            }
        });
    }

    document.getElementById('addRowBtn').addEventListener('click', function() {
        addRow();
    });

    // Tek buton (Save & Info) için fonksiyon
    document.getElementById('saveBtn').addEventListener('click', function() {
        // 1. Önce tüm verileri localStorage'a kaydet
        const rows = document.querySelectorAll('#rowsContainer > div');
        const fonBilgisi = {};
        
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const floatValue = inputs[0].value;
            const textValue = inputs[1].value;
            
            if (textValue && floatValue) {
                fonBilgisi[textValue] = parseFloat(floatValue);
            }
        });
        
        localStorage.setItem('fon_bilgisi', JSON.stringify(fonBilgisi));
        
        // 2. Sonra tüm veriler için API çağrısı yap ve güncelle
        const now = Math.floor(Date.now() / 1000); // Şu anki epoch time
        
        // API çağrılarının sayısını takip et
        let pendingRequests = Object.keys(fonBilgisi).length;
        let successfulRequests = 0;
        let failedRequests = 0;
        
        if (pendingRequests === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Bilgi',
                text: 'Kaydedilecek veri bulunamadı!',
                confirmButtonText: 'Tamam'
            });
            return;
        }
        
        for (const [symbol, value] of Object.entries(fonBilgisi)) {
            const url = `https://gate.fintables.com/barbar/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=1734210000&to=${now}`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.o && Array.isArray(data.o) && data.o.length > 0) {
                        const lastElement = data.o[data.o.length - 1];
                        console.log(`Symbol: ${symbol} - Son O değeri:`, lastElement);
                        
                        // Sayfadaki ilgili satırı bul ve güncelle
                        const rows = document.querySelectorAll('#rowsContainer > div');
                        rows.forEach(row => {
                            const inputs = row.querySelectorAll('input');
                            const textInput = inputs[1];
                            const floatInput = inputs[0];
                            const lastOElement = row.children[2];
                            const calculatedElement = row.children[3];
                            
                            if (textInput && textInput.value === symbol && lastOElement && calculatedElement && floatInput) {
                                lastOElement.textContent = `Son O: ${lastElement}`;
                                lastOElement.className = 'px-3 py-2 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium';
                                
                                // Float değeri ile çarpma işlemi
                                const floatValue = parseFloat(floatInput.value) || 0;
                                const calculatedValue = (lastElement * floatValue).toFixed(2);
                                calculatedElement.textContent = `Hesap: ${calculatedValue}`;
                                calculatedElement.className = 'px-3 py-2 rounded-lg bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-medium';
                            }
                        });
                        successfulRequests++;
                    } else {
                        console.log(`Symbol: ${symbol} - "o" objesi boş veya bulunamadı.`);
                        
                        // Sayfadaki ilgili satırı bul ve güncelle
                        const rows = document.querySelectorAll('#rowsContainer > div');
                        rows.forEach(row => {
                            const inputs = row.querySelectorAll('input');
                            const textInput = inputs[1];
                            const lastOElement = row.children[2];
                            const calculatedElement = row.children[3];
                            
                            if (textInput && textInput.value === symbol && lastOElement && calculatedElement) {
                                lastOElement.textContent = 'Veri bulunamadı';
                                lastOElement.className = 'px-3 py-2 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm font-medium';
                                calculatedElement.textContent = 'Hesaplanamadı';
                                calculatedElement.className = 'px-3 py-2 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm font-medium';
                            }
                        });
                        failedRequests++;
                    }
                })
                .catch(error => {
                    console.error(`Symbol: ${symbol} için hata:`, error);
                    
                    // Sayfadaki ilgili satırı bul ve güncelle
                    const rows = document.querySelectorAll('#rowsContainer > div');
                    rows.forEach(row => {
                        const inputs = row.querySelectorAll('input');
                        const textInput = inputs[1];
                        const lastOElement = row.children[2];
                        const calculatedElement = row.children[3];
                        
                        if (textInput && textInput.value === symbol && lastOElement && calculatedElement) {
                            lastOElement.textContent = 'Hata';
                            lastOElement.className = 'px-3 py-2 rounded-lg bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-medium';
                            calculatedElement.textContent = 'Hesaplanamadı';
                            calculatedElement.className = 'px-3 py-2 rounded-lg bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-medium';
                        }
                    });
                    failedRequests++;
                })
                .finally(() => {
                    pendingRequests--;
                    
                    // Tüm işlemler tamamlandığında toplamı güncelle
                    updateTotal();
                    
                    // Tüm istekler tamamlandığında SweetAlert2 ile bildirim göster
                    if (pendingRequests === 0) {
                        if (successfulRequests > 0 && failedRequests === 0) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Başarılı!',
                                text: `${successfulRequests} veri başarıyla güncellendi!`,
                                confirmButtonText: 'Tamam'
                            });
                        } else if (successfulRequests > 0 && failedRequests > 0) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Kısmi Başarılı!',
                                html: `${successfulRequests} veri başarıyla güncellendi, ${failedRequests} veri güncellenemedi.`,
                                confirmButtonText: 'Tamam'
                            });
                        } else if (successfulRequests === 0 && failedRequests > 0) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Hata!',
                                text: 'Hiçbir veri güncellenemedi!',
                                confirmButtonText: 'Tamam'
                            });
                        }
                    }
                });
        }
    });