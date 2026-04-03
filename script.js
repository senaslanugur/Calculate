function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Aylar 0'dan başlıyor
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDayDate(tl, usd) {
  const dateKey = getCurrentDate();

  let existingData = JSON.parse(localStorage.getItem("day_data_set")) || [];


  const existingIndex = existingData.findIndex(item => item.date === dateKey);

  if (existingIndex !== -1) {
    // Eğer mevcutsa, üzerine yaz
    existingData[existingIndex] = { date: dateKey, turkish_lira: tl, dolar: usd };
  } else {
    // Eğer mevcut değilse, yeni veri ekle
    existingData.push({ date: dateKey, turkish_lira: tl, dolar: usd });
  }

  localStorage.setItem("day_data_set", JSON.stringify(existingData));

}



function calculate() {
  const staff_1 = parseFloat(document.getElementById("staff-1").value) || 0;
  const staff_2 = parseFloat(document.getElementById("staff-2").value) || 0;
  const staff_3 = parseFloat(document.getElementById("staff-3").value) || 0;
  const staff_4 = parseFloat(document.getElementById("staff-4").value) || 0;
  const staff_5 = parseFloat(document.getElementById("staff-5").value) || 0;
  const staff_6 = parseFloat(document.getElementById("staff-6").value) || 0;
  const staff_7 = parseFloat(document.getElementById("staff-7").value) || 0;

  // --- HAFTALIK KAR/ZARAR HESAPLAMA (mevcut kod) ---
  const dayDataSet = JSON.parse(localStorage.getItem("day_data_set")) || [];
  let weeklyPerformanceHtml = "";

  if (dayDataSet.length > 0) {
    const todayDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(todayDate.getDate() - 7);

    const sortedData = dayDataSet
      .map(item => ({ ...item, dateObj: new Date(item.date) }))
      .sort((a, b) => a.dateObj - b.dateObj);

    const startEntry = sortedData.find(item => item.dateObj >= sevenDaysAgo) || sortedData[0];
    
    const temp_borc = parseFloat(localStorage.getItem("debit_total_percent")) || 0;
    const current_total = (staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6 + staff_7) - temp_borc;

    const weeklyDiff = current_total - startEntry.turkish_lira;
    const weeklyPercent = ((weeklyDiff / startEntry.turkish_lira) * 100).toFixed(1);
    const isWeeklyProfit = weeklyDiff >= 0;

    weeklyPerformanceHtml = `
      <div class="mt-2 p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
        <div>
          <p class="text-[9px] font-bold text-muted uppercase tracking-tight">Haftalık Performans</p>
          <p class="text-[10px] text-text-muted opacity-50">${startEntry.date} tarihinden beri</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-black ${isWeeklyProfit ? 'text-accent-teal' : 'text-loss-red'}">
            ${isWeeklyProfit ? '▲' : '▼'} ₺${Math.abs(weeklyDiff).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p class="text-[10px] font-bold ${isWeeklyProfit ? 'text-accent-teal/60' : 'text-loss-red/60'}">
            %${weeklyPercent}
          </p>
        </div>
      </div>
    `;
  }

  // === YENİ: GÜNLÜK KAR/ZARAR HESAPLAMA ===
  const total_borc = parseFloat(localStorage.getItem("debit_total_percent")) || 0;
  let all_amount = staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6 + staff_7;
  all_amount = all_amount - total_borc;

  const gunlukKarZararEl = document.getElementById("gunluk_kar_zarar");
  const gunlukKarZararAmountEl = document.getElementById("gunluk_kar_zarar_amount");

  let dailyDiff = 0;
  let dailyPercent = 0;
  let isDailyProfit = true;

  if (dayDataSet.length > 0) {
    const todayStr = getCurrentDate();

    // Dünden önceki en son kaydı bul (bugünkü veri hariç)
    const previousEntries = dayDataSet
      .filter(item => item.date < todayStr)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (previousEntries.length > 0) {
      const previousTL = previousEntries[0].turkish_lira;
      if (previousTL !== 0) {
        dailyDiff = all_amount - previousTL;
        dailyPercent = (dailyDiff / previousTL) * 100;
        isDailyProfit = dailyDiff >= 0;
      }
    }
  }

  // Günlük % değerini güncelle
  if (gunlukKarZararEl) {
    gunlukKarZararEl.textContent = `${isDailyProfit ? '+' : ''}${dailyPercent.toFixed(2)}%`;
    // Renkleri dinamik yap (accent-teal = kâr, loss-red = zarar)
    gunlukKarZararEl.classList.remove("text-green-500", "text-accent-teal", "text-loss-red", "text-red-500");
    gunlukKarZararEl.classList.add(isDailyProfit ? "text-accent-teal" : "text-loss-red");
  }

  // Günlük TL miktarını güncelle
  if (gunlukKarZararAmountEl) {
    const sign = isDailyProfit ? "+" : "";
    gunlukKarZararAmountEl.innerHTML = `${sign}₺${Math.abs(dailyDiff).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  }

  // --- BORÇ KONTROL MANTIĞI (mevcut kod) ---
  const rawDebits = localStorage.getItem("debit");
  let todayDebtInfo = "";
  let todayTotalDebt = 0;

  if (rawDebits) {
    const debits = JSON.parse(rawDebits);
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();

    debits.forEach(item => {
      if (item.aciklama && item.aciklama.includes("-")) {
        const datePart = item.aciklama.split("-")[1].trim();
        const [bd, bm, by] = datePart.split('.').map(num => parseInt(num));
        if (bd === d && bm === m && by === y) {
          todayTotalDebt += parseFloat(item.miktar || 0);
        }
      }
    });
  }

  if (todayTotalDebt > 0) {
    todayDebtInfo = `
      <div class="mt-3 p-3 bg-loss-red/10 border border-loss-red/20 rounded-xl animate-pulse">
        <p class="text-[10px] font-bold text-loss-red uppercase tracking-widest mb-1 text-center">⚠️ BUGÜN ÖDEME VAR</p>
        <p class="text-sm font-black text-loss-red text-center">₺${todayTotalDebt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
      </div>`;
  } else {
    todayDebtInfo = `
      <div class="mt-3 p-2 bg-accent-teal/10 border border-accent-teal/20 rounded-xl">
        <p class="text-[9px] font-bold text-accent-teal uppercase tracking-widest text-center">✅ BUGÜN ÖDEME YOK</p>
      </div>`;
  }

  const old_amount = parseFloat(localStorage.getItem("all_amount")) || 0;
  localStorage.setItem("all_amount", all_amount);

  const values = {
    "staff_1": staff_1, "staff_2": staff_2, "staff_3": staff_3,
    "staff_4": staff_4, "staff_5": staff_5, "staff_6": staff_6, "staff_7": staff_7,
  };
  localStorage.setItem("values", JSON.stringify(values));


  const isDark = document.documentElement.classList.contains('dark');

// === Güncellenmiş Frankfurter v2 API ile çeviri ===
const url = `https://api.frankfurter.dev/v2/rates?base=TRY&quotes=USD`;

$.ajax({
  url: url,
  async: false,
  success: function(data) {
    // v2 API'de rate doğrudan geliyor
    const rate = data[0] ? data[0].rate : 0;
    const usdAmount = (all_amount * rate).toFixed(2);

    const isIncreased = all_amount >= old_amount;
    const diff = all_amount - old_amount;

    Swal.fire({
      title: `<span style="font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.02em;">
                ${isIncreased ? 'VARLIKLAR ARTTI' : 'VARLIKLAR AZALDI'}
              </span>`,
      html: `
        <div class="flex flex-col gap-3 p-1 font-display">
          <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p class="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 text-center">Güncel Toplam (TRY)</p>
            <p class="text-3xl font-black text-white text-center">₺${all_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
              <p class="text-[9px] font-bold text-muted uppercase mb-1">Dolar Karşılığı</p>
              <p class="text-sm font-bold text-accent-blue">$${usdAmount}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
              <p class="text-[9px] font-bold text-muted uppercase mb-1">Son Değişim</p>
              <p class="text-sm font-bold ${isIncreased ? 'text-accent-teal' : 'text-loss-red'}">
                ${isIncreased ? '+' : ''}₺${diff.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          ${weeklyPerformanceHtml}
          ${todayDebtInfo}

          ${!isIncreased ? `
          <div class="text-[11px] text-text-muted text-center mt-1 italic opacity-60">
            Önceki miktar: ₺${old_amount.toLocaleString("tr-TR")}
          </div>` : ''}
        </div>
      `,
      icon: isIncreased ? "success" : "warning",
      iconColor: isIncreased ? "#00c49a" : "#ff4d4d",
      background: isDark ? '#1a2131' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#1e293b',
      confirmButtonText: 'TAMAM',
      confirmButtonColor: '#137fec',
      customClass: {
        popup: 'rounded-3xl border border-white/10 shadow-2xl',
        confirmButton: 'rounded-xl px-10 py-3 font-bold tracking-wide'
      }
    });

    // addDayDate için usdAmount ve rate gönderiyoruz
    addDayDate(all_amount, parseFloat(usdAmount));
  },
  error: function() {
    Swal.fire('Hata', 'Döviz kuru alınamadı. Lütfen internet bağlantınızı kontrol edin.', 'error');
  }
});


  get();
  donut_and_init();
  lineGraph();
}










function get(){
  var values = JSON.parse(localStorage.getItem("values"))
  document.getElementById("staff-1").value = values.staff_1
  document.getElementById("staff-2").value = values.staff_2
  document.getElementById("staff-3").value = values.staff_3
  document.getElementById("staff-4").value = values.staff_4
  document.getElementById("staff-5").value = values.staff_5
  document.getElementById("staff-6").value = values.staff_6
  document.getElementById("staff-7").value = values.staff_7

  var labels = JSON.parse(localStorage.getItem("labels"))
  document.getElementById("staff-1-name").innerText = labels.label_1
  document.getElementById("staff-2-name").innerText = labels.label_2
  document.getElementById("staff-3-name").innerText = labels.label_3
  document.getElementById("staff-4-name").innerText = labels.label_4
  document.getElementById("staff-5-name").innerText = labels.label_5
  document.getElementById("staff-6-name").innerText = labels.label_6
  document.getElementById("staff-7-name").innerText = labels.label_7



  
}


get()

// --- TL Formatlama Yardımcı Fonksiyonu ---
// (Varsa mevcut tlFormat fonksiyonunu kullan)
function tlFormat(val) {
  if (val === null || val === undefined || isNaN(val)) return "₺0";

  const num = Number(val);

  // Büyük değerler için K formatı
  if (Math.abs(num) > 9999) {
    return (num < 0 ? "-₺" : "₺") + (Math.abs(num) / 1000).toFixed(1) + "K";
  }

  // Normal TL formatı
  return (num < 0 ? "-₺" : "₺") +
    Math.abs(num).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

// --- LocalStorage'daki "harcamlar" içindeki ücretleri toplar ---
function getToplamHarcamaFromStorage() {
  try {
    const raw = localStorage.getItem("harcamlar");
    if (!raw) return 0;

    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return 0;

    return arr.reduce((acc, it) => {
      // Esneklik için farklı field isimleri kontrol edilir
      const v = parseFloat((it && (it.ucret ?? it.ucreti ?? it.amount)) ?? it);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  } catch (err) {
    console.error("Harcama oku hatası:", err);
    return 0;
  }
}

// --- Sayfada ilgili alanları güncelle ---
function updateBorrowAndExpenseDisplays() {
  // Toplam Borç (mevcut kodda savedTotal varsa kullanılıyor)
  const savedTotal = localStorage.getItem("debit_total_percent");
  const toplamBorcEl = document.getElementById("toplam_borc");

  if (toplamBorcEl) {
    const borcVal = savedTotal ? parseFloat(savedTotal) : 0;
    toplamBorcEl.textContent = tlFormat(isNaN(borcVal) ? 0 : borcVal);
  }

  // Toplam Harcama
  const toplamHarcamaEl = document.getElementById("toplam_harcama");
  if (toplamHarcamaEl) {
    const toplamHarcama = getToplamHarcamaFromStorage();
    toplamHarcamaEl.textContent = tlFormat(toplamHarcama);
  }
}

// --- Sayfa hazır olduğunda güncelle ---
document.addEventListener("DOMContentLoaded", () => {
  updateBorrowAndExpenseDisplays();
  updateChecklistNotification();

  

  // localStorage değişikliklerinde otomatik güncelleme (başka sekmede değişirse)
  window.addEventListener("storage", (e) => {
    if (e.key === "harcamlar" || e.key === "debit_total_percent") {
      updateBorrowAndExpenseDisplays();
    }
  });
});

// --- Eğer script body sonunda çağrılıyorsa direkt çalıştır ---
// (DOMContentLoaded şartına takılmaz)
updateBorrowAndExpenseDisplays();

// Verileri globalde tutuyoruz
let currentPortfolioData = [];
let portfolioGrandTotal = 0;
let isRefreshing = false; // Animasyon kontrolü için

async function showPortfolioSlider() {
    if (currentPortfolioData.length === 0) {
        await refreshPortfolioData();
    }
    renderPortfolioContent('slider');
}

// Verileri yenileyen ana tetikleyici
async function triggerRefresh(viewType) {
    if (isRefreshing) return;
    isRefreshing = true;
    
    // İkonun dönmesi için UI'ı anlık güncelle
    renderPortfolioContent(viewType); 

    await refreshPortfolioData();
    
    isRefreshing = false;
    renderPortfolioContent(viewType);
}

async function refreshPortfolioData() {
    const fonBilgisi = JSON.parse(localStorage.getItem('fon_bilgisi') || '{}');
    const symbols = Object.keys(fonBilgisi);

    currentPortfolioData = [];
    portfolioGrandTotal = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const symbol of symbols) {
        try {
            const url = `https://gate.fintables.com/barbar/udf/history?symbol=${encodeURIComponent(symbol)}&resolution=D&from=1734210000&to=${now}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.o && data.o.length > 0) {
                const lastPrice = parseFloat(data.o[data.o.length - 1]);
                const prevPrice = parseFloat(data.o[data.o.length - 2]) || lastPrice;
                const change = (((lastPrice - prevPrice) / prevPrice) * 100).toFixed(2);
                const amount = parseFloat(fonBilgisi[symbol]);
                const totalVal = lastPrice * amount;
                
                portfolioGrandTotal += totalVal;
                
                let updateDate = '---';
                if (data.t) {
                    const dateObj = new Date(data.t[data.t.length - 1] * 1000);
                    updateDate = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                }

                currentPortfolioData.push({ symbol, amount, lastPrice, change, totalVal, updateDate });
            }
        } catch (e) { console.error(e); }
    }
}

function renderPortfolioContent(viewType) {
    const formattedTotal = portfolioGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const spinClass = isRefreshing ? 'animate-spin' : '';
    
    let contentHtml = '';

    // Görünüm Başlığı ve Yenile Butonu
    const headerHtml = `
        <div class="text-center mb-6 pt-2">
            <p class="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-1 opacity-50">Toplam Portföy Değeri</p>
            <div class="flex items-center justify-center gap-3">
                <h2 class="text-3xl font-black text-white tracking-tighter italic">₺${formattedTotal}</h2>
                <button onclick="triggerRefresh('${viewType}')" class="text-accent-teal hover:rotate-180 transition-all duration-500">
                    <span class="material-symbols-outlined font-bold text-[22px] ${spinClass}">refresh</span>
                </button>
            </div>
        </div>
    `;

    if (viewType === 'slider') {
        let cardsHtml = currentPortfolioData.map(item => {
            const colorClass = item.change >= 0 ? 'text-accent-teal' : 'text-loss-red';
            return `
                <div class="p-5 bg-white/[0.03] rounded-3xl border border-white/5 text-left min-w-[240px] m-2 shadow-xl flex-shrink-0 transition-transform hover:scale-[1.02]">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex flex-col">
                            <h3 class="text-lg font-black text-white">${item.symbol}</h3>
                            <span class="text-[9px] text-text-muted font-bold opacity-40 uppercase">${item.updateDate}</span>
                        </div>
                        <span class="${colorClass} font-bold text-xs bg-${item.change >= 0 ? 'accent-teal' : 'loss-red'}/10 px-2 py-1 rounded-lg">
                            %${item.change}
                        </span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                        <div>
                            <p class="text-text-muted text-[9px] font-bold uppercase mb-1">Adet</p>
                            <p class="text-white text-sm font-medium">${item.amount}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-text-muted text-[9px] font-bold uppercase mb-1">Piyasa Değeri</p>
                            <p class="text-white font-black text-base">₺${item.totalVal.toLocaleString('tr-TR')}</p>
                        </div>
                    </div>
                </div>`;
        }).join('');

        contentHtml = `
            <div id="slider-container" class="flex overflow-x-auto pb-4 no-scrollbar" style="scroll-snap-type: x mandatory;">${cardsHtml}</div>
            <button onclick="renderPortfolioContent('table')" class="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-bold transition-all border border-white/10 tracking-[0.2em] uppercase">
               ⚙️ Portföyü Düzenle
            </button>
        `;
    } else {
        // TABLO GÖRÜNÜMÜ - UI Optimizasyonu
        let rowsHtml = currentPortfolioData.map(item => {
            const colorClass = item.change >= 0 ? 'text-accent-teal' : 'text-loss-red';
            const arrow = item.change >= 0 ? 'trending_up' : 'trending_down';
            
            return `
                <tr class="group border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                    <td class="py-4 text-left">
                        <div class="font-black text-white text-sm">${item.symbol}</div>
                        <div class="text-[9px] text-text-muted opacity-50 font-medium">${item.updateDate}</div>
                    </td>
                    <td class="py-4">
                        <div class="flex justify-end">
                            <input type="number" value="${item.amount}" onchange="updateAmount('${item.symbol}', this.value)" 
                                class="bg-white/5 border border-white/10 rounded-xl w-20 text-center text-white text-xs px-2 py-2 outline-none focus:border-accent-teal/50 focus:bg-accent-teal/5 transition-all font-bold">
                        </div>
                    </td>
                    <td class="py-4 text-right">
                        <div class="font-bold text-white text-[13px]">₺${item.totalVal.toLocaleString('tr-TR', {maximumFractionDigits:0})}</div>
                        <div class="${colorClass} text-[10px] font-bold flex items-center justify-end gap-1">
                            <span class="material-symbols-outlined text-[12px]">${arrow}</span> %${Math.abs(item.change)}
                        </div>
                    </td>
                    <td class="py-4 text-right pl-3">
                        <button onclick="deleteSymbol('${item.symbol}')" class="w-8 h-8 flex items-center justify-center rounded-full text-loss-red/30 hover:text-loss-red hover:bg-loss-red/10 transition-all">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        contentHtml = `
            <div class="max-h-[320px] overflow-y-auto pr-1 custom-scrollbar mb-6">
                <table class="w-full">
                    <thead>
                        <tr class="text-[9px] uppercase tracking-[0.2em] text-text-muted border-b border-white/10">
                            <th class="pb-3 text-left font-bold opacity-50">Varlık</th>
                            <th class="pb-3 text-right font-bold opacity-50">Miktar</th>
                            <th class="pb-3 text-right font-bold opacity-50">Durum</th>
                            <th class="pb-3 text-right font-bold opacity-50 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            <div class="bg-white/[0.03] p-1.5 rounded-2xl flex gap-2 items-center mb-6 border border-white/5 shadow-inner group focus-within:border-accent-teal/30 transition-all">
                <input id="newSymbol" type="text" placeholder="KOD" class="bg-transparent border-none text-white text-xs w-16 focus:ring-0 uppercase font-black px-3 placeholder:text-white/20">
                <div class="w-[1px] h-4 bg-white/10"></div>
                <input id="newAmount" type="number" placeholder="Adet giriniz..." class="bg-transparent border-none text-white text-xs w-full focus:ring-0 px-2 placeholder:text-white/20 font-medium">
                <button onclick="addNewSymbol()" class="bg-accent-teal text-black h-9 w-9 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-teal/20">
                    <span class="material-symbols-outlined font-black text-[20px]">add</span>
                </button>
            </div>

            <button onclick="renderPortfolioContent('slider')" class="w-full text-text-muted hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all py-2">
                ← Portföy Özetine Dön
            </button>
        `;
    }

    Swal.fire({
        background: '#0b0f19',
        showConfirmButton: false,
        showCloseButton: true,
        width: '420px',
        padding: '1.5rem',
        customClass: { 
            popup: 'rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl',
            closeButton: 'text-white/20 hover:text-white border-none focus:outline-none'
        },
        html: headerHtml + contentHtml
    });
}



// Veri Yönetim Fonksiyonları
function updateAmount(symbol, newAmount) {
    let fonBilgisi = JSON.parse(localStorage.getItem('fon_bilgisi') || '{}');
    fonBilgisi[symbol] = parseFloat(newAmount);
    localStorage.setItem('fon_bilgisi', JSON.stringify(fonBilgisi));
    triggerRefresh('table');
}

function deleteSymbol(symbol) {
    let fonBilgisi = JSON.parse(localStorage.getItem('fon_bilgisi') || '{}');
    delete fonBilgisi[symbol];
    localStorage.setItem('fon_bilgisi', JSON.stringify(fonBilgisi));
    triggerRefresh('table');
}

function addNewSymbol() {
    const s = document.getElementById('newSymbol').value.toUpperCase();
    const a = document.getElementById('newAmount').value;
    if (!s || !a) return;
    let fb = JSON.parse(localStorage.getItem('fon_bilgisi') || '{}');
    fb[s] = parseFloat(a);
    localStorage.setItem('fon_bilgisi', JSON.stringify(fb));
    triggerRefresh('table');
}


function donut_and_init(){
  const STAFF_COLORS = [
    "#3B82F6", "#8B5CF6", "#FACC15", "#F97316", "#14B8A6"
  ];
  const NEGATIVE_COLOR = "#EF4444";

  // === YENİ: Hedef localStorage'dan yükleniyor ===
  let hedefMiktar = parseFloat(localStorage.getItem("hedef_miktar"));
  if (!hedefMiktar || isNaN(hedefMiktar) || hedefMiktar <= 0) {
    hedefMiktar = 1000;
    localStorage.setItem("hedef_miktar", hedefMiktar);
  }
  document.getElementById("total_hedef").textContent = "₺" + hedefMiktar.toLocaleString("tr-TR");

  // Test amaçlı localStorage yoksa ekleyelim
  if (!localStorage.getItem("values")) {
    localStorage.setItem("values", JSON.stringify({
      "staff_1": 103.8, "staff_2": 226.7, "staff_3": 54.2,
      "staff_4": 132.8, "staff_5": -33.7, "staff_6": -10.2, "staff_7": 0
    }));
  }

  const savedTotal = localStorage.getItem("debit_total_percent");
  if (savedTotal) {
    const total = parseFloat(savedTotal);
    const toplamborc = document.getElementById("toplam_borc");
    if (toplamborc) toplamborc.textContent = total;
  }

  // 1. Tüm staff_ değerlerini al
  const values = JSON.parse(localStorage.getItem("values") || "{}");
  const staffEntries = Object.entries(values).filter(([key, val]) => key.startsWith('staff_'));

  const absSum = staffEntries.reduce((sum, [k, v]) => sum + Math.abs(parseFloat(v)), 0);

  // 2. Donut chart
  let offset = 0;
  let circles = "";

  for (let i = 0; i < staffEntries.length; ++i) {
    const [k, v] = staffEntries[i];
    const val = parseFloat(v);
    let percent = absSum === 0 ? 0 : ((Math.abs(val) / absSum) * 100);
    let dasharray = percent.toFixed(2) + ", 100";
    let dashoffset = -offset;
    let color = val >= 0 ? STAFF_COLORS[i % STAFF_COLORS.length] : NEGATIVE_COLOR;

    if (percent > 0) {
      circles += `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"></circle>`;
    }
    offset += percent;
  }
  document.getElementById("donut-chart").innerHTML = circles;

  // 3. Orta toplam (TL)
  function tlFormat(val) {
    if (Math.abs(val) > 9999) {
      return (val < 0 ? "-₺" : "₺") + (Math.abs(val) / 1000).toFixed(1) + "K";
    }
    return (val < 0 ? "-₺" : "₺") + Math.abs(val).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  }

  const total = staffEntries.reduce((s, [k, v]) => s + parseFloat(v), 0);
  const donutTotalEl = document.getElementById("donut-total");
  if (savedTotal) {
    donutTotalEl.textContent = tlFormat(total - parseFloat(savedTotal));
  } else {
    donutTotalEl.textContent = tlFormat(total);
  }

  // === HEDEF İLE İLGİLİ GÜNCELLEME (progress bar + kalan) ===
  (function updateGoalProgress() {
    function parseTL(str) {
      if (str == null) return NaN;
      let s = String(str).trim().replace(/₺/g, '').replace(/\s/g, '');
      if (s.indexOf('.') > -1 && s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
      else if (s.indexOf(',') > -1) s = s.replace(',', '.');
      s = s.replace(/[^0-9\.\-]/g, '');
      return parseFloat(s);
    }

    const current = parseTL(donutTotalEl.textContent);
    const target = parseFloat(localStorage.getItem("hedef_miktar")) || 1000;

    const remaining = (isNaN(target) || isNaN(current)) ? 0 : (target - current);
    const percentReached = (isNaN(target) || target === 0) ? 0 : Math.min(100, (current / target) * 100);

    document.getElementById("kalan_hedef_tl").textContent = tlFormat(remaining);
    document.getElementById("kalan_hedef_yuzde").textContent = percentReached.toFixed(1) + "%";
    document.querySelector(".bg-gradient-to-r").style.width = percentReached.toFixed(1) + "%";
  })();

  // --- Bitiş ---
}


// ====================== HEDEF DÜZENLEME ======================
function editTarget() {
  const savedTarget = parseFloat(localStorage.getItem("hedef_miktar")) || 1000;

  Swal.fire({
    title: 'Yeni Hedef Tutarı',
    input: 'number',
    inputValue: savedTarget,
    inputLabel: 'Hedef (₺)',
    inputPlaceholder: 'Örn: 50000',
    showCancelButton: true,
    confirmButtonText: 'Kaydet',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#137fec',
    background: document.documentElement.classList.contains('dark') ? '#0b0f19' : '#f8fafc',
    customClass: {
      popup: 'rounded-3xl',
      confirmButton: 'rounded-2xl px-8 py-3 font-bold'
    },
    inputValidator: (value) => {
      if (!value || parseFloat(value) <= 0) {
        return 'Lütfen geçerli ve pozitif bir tutar girin!';
      }
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const newTarget = parseFloat(result.value);
      localStorage.setItem("hedef_miktar", newTarget);
      
      // Hemen güncelle
      donut_and_init();
      
      Swal.fire({
        icon: 'success',
        title: 'Hedef Güncellendi!',
        text: `Yeni hedef: ₺${newTarget.toLocaleString("tr-TR")}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  });
}



function showHistoryChart() {
  const rawData = JSON.parse(localStorage.getItem("day_data_set")) || [];
  
  // Son 15 günü al ve tarihe göre sırala
  const chartData = rawData
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-15);

  const labels = chartData.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  });
  
  const tlValues = chartData.map(d => d.turkish_lira);
  const usdValues = chartData.map(d => d.dolar);

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  Swal.fire({
    title: '<div class="flex flex-col"><span class="text-xs font-bold text-accent-teal tracking-[0.3em] uppercase opacity-60">Finansal Geçmiş</span><span class="text-xl font-black italic">15 GÜNLÜK DEĞİŞİM</span></div>',
    html: `
      <div class="w-full mt-2 bg-black/5 dark:bg-white/5 rounded-3xl p-4 border border-white/10">
        <canvas id="historyChart" style="max-height: 350px;"></canvas>
      </div>
      <div class="flex justify-around mt-4">
        <div class="text-center">
          <p class="text-[9px] text-muted uppercase font-bold">En Yüksek (TL)</p>
          <p class="text-sm font-black text-accent-teal">₺${Math.max(...tlValues).toLocaleString('tr-TR')}</p>
        </div>
        <div class="text-center">
          <p class="text-[9px] text-muted uppercase font-bold">En Düşük (TL)</p>
          <p class="text-sm font-black text-loss-red">₺${Math.min(...tlValues).toLocaleString('tr-TR')}</p>
        </div>
      </div>
    `,
    width: '600px',
    background: isDark ? '#0b0f19' : '#f8fafc',
    color: textColor,
    showConfirmButton: true,
    confirmButtonText: 'KAPAT',
    confirmButtonColor: '#137fec',
    customClass: { popup: 'rounded-[2rem] border border-white/10 shadow-3xl' },
    didOpen: () => {
      const ctx = document.getElementById('historyChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'TL Değeri',
              data: tlValues,
              borderColor: '#14B8A6',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderWidth: 4,
              pointBackgroundColor: '#14B8A6',
              pointRadius: 4,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.4,
              yAxisID: 'yTL'
            },
            {
              label: 'USD Değeri',
              data: usdValues,
              borderColor: '#3B82F6',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 2,
              fill: false,
              tension: 0.4,
              yAxisID: 'yUSD'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: isDark ? '#1a2131' : '#fff',
              titleColor: isDark ? '#fff' : '#000',
              bodyColor: isDark ? '#cbd5e1' : '#475569',
              borderColor: '#137fec',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += context.datasetIndex === 0 
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.parsed.y)
                      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            yTL: {
              type: 'linear',
              position: 'left',
              grid: { color: gridColor },
              ticks: { 
                color: '#14B8A6', 
                font: { size: 10, weight: 'bold' },
                callback: (value) => '₺' + value.toLocaleString('tr-TR')
              }
            },
            yUSD: {
              type: 'linear',
              position: 'right',
              grid: { display: false },
              ticks: { 
                color: '#3B82F6', 
                font: { size: 10, weight: 'bold' },
                callback: (value) => '$' + value
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }
  });
}


// stockkkk

const FINNHUB_KEY = 'c94i99aad3if4j50rvn0';


async function fetchStockPrice(symbol) {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        const data = await response.json();
        
        if (data.c && data.c !== 0) {
            return data.h;
        } else {
            console.warn(`${symbol} için veri bulunamadı.`);
            return 0;
        }
    } catch (error) {
        console.error("API Hatası:", error);
        return 0;
    }
}

async function showStockManager() {
    const isDark = document.documentElement.classList.contains('dark');
    let stocks = JSON.parse(localStorage.getItem("stock_portfolio")) || [];

    Swal.fire({
        title: 'Veriler Güncelleniyor...',
        html: '<div class="text-[11px] opacity-70 font-mono">Finnhub API üzerinden canlı veriler alınıyor...</div>',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // Fiyatları paralel çek
    const pricePromises = stocks.map(stock => fetchStockPrice(stock.symbol));
    const currentPrices = await Promise.all(pricePromises);

    let grandTotalValue = 0;
    let grandTotalCost = 0;

    // Kartları oluştur
    let cardsHtml = stocks.map((stock, index) => {
        const currentPrice = currentPrices[index] || 0;
        const cost = stock.amount * stock.avgPrice;
        const value = stock.amount * currentPrice;
        const profitLoss = value - cost;
        const plPercent = stock.avgPrice > 0 ? ((currentPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(2) : 0;
        const isProfit = profitLoss >= 0;

        grandTotalCost += cost;
        grandTotalValue += value;

        return `
            <div class="bg-white/[0.03] border border-white/10 rounded-3xl p-4 mb-3 transition-all hover:bg-white/[0.05] group">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="text-lg font-black text-white tracking-tight">${stock.symbol}</h3>
                        <p class="text-[10px] text-text-muted font-bold opacity-50 uppercase">Global Market</p>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-black ${isProfit ? 'bg-accent-teal/10 text-accent-teal' : 'bg-loss-red/10 text-loss-red'}">
                            ${isProfit ? '▲' : '▼'} %${Math.abs(plPercent)}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/5">
                    <div>
                        <p class="text-[8px] text-muted font-bold uppercase mb-1">Miktar</p>
                        <input type="number" value="${stock.amount}" onchange="updateStockValue('${stock.symbol}', 'amount', this.value)" 
                            class="bg-transparent text-white text-xs font-bold w-full outline-none focus:text-accent-blue">
                    </div>
                    <div>
                        <p class="text-[8px] text-muted font-bold uppercase mb-1">Maliyet</p>
                        <input type="number" value="${stock.avgPrice}" onchange="updateStockValue('${stock.symbol}', 'avgPrice', this.value)" 
                            class="bg-transparent text-white text-xs font-bold w-full outline-none focus:text-accent-blue">
                    </div>
                    <div class="text-right">
                        <p class="text-[8px] text-muted font-bold uppercase mb-1">Güncel Fiyat</p>
                        <p class="text-xs font-bold text-accent-blue">$${currentPrice.toLocaleString('en-US')}</p>
                    </div>
                </div>

                <div class="flex justify-between items-center mt-3">
                    <div>
                        <p class="text-[9px] font-bold ${isProfit ? 'text-accent-teal' : 'text-loss-red'}">
                            ${isProfit ? '+' : ''}$${profitLoss.toLocaleString('en-US', {maximumFractionDigits: 2})}
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <p class="text-sm font-black text-white">$${value.toLocaleString('en-US', {maximumFractionDigits: 2})}</p>
                        <button onclick="deleteStock('${stock.symbol}')" class="text-loss-red/20 hover:text-loss-red transition-colors">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    Swal.fire({
        title: '<div class="flex flex-col"><span class="text-[10px] font-bold text-accent-blue tracking-[0.3em] uppercase opacity-60">Global Portföy</span><span class="text-xl font-black italic uppercase">USD VARLIKLARIM</span></div>',
        width: '450px',
        background: isDark ? '#0b0f19' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl' },
        html: `
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="p-4 bg-accent-blue/10 rounded-2xl text-left border border-accent-blue/20">
                    <p class="text-[9px] font-bold text-accent-blue uppercase tracking-widest mb-1">Toplam Değer</p>
                    <p class="text-xl font-black text-white">$${grandTotalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
                <div class="p-4 bg-white/5 rounded-2xl text-left border border-white/5">
                    <p class="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Toplam Kar/Zarar</p>
                    <p class="text-xl font-black ${grandTotalValue >= grandTotalCost ? 'text-accent-teal' : 'text-loss-red'}">
                        $${(grandTotalValue - grandTotalCost).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </p>
                </div>
            </div>

            <div class="bg-white/5 p-2 rounded-2xl flex gap-2 items-center mb-6 border border-white/10">
                <input id="stock_symbol" placeholder="SEMBOLLER" class="bg-transparent text-[11px] border-none focus:ring-0 uppercase font-black px-2 w-20 text-white">
                <div class="w-[1px] h-4 bg-white/10"></div>
                <input id="stock_amount" type="number" placeholder="Adet" class="bg-transparent text-[11px] border-none focus:ring-0 px-2 w-16 text-white">
                <input id="stock_price" type="number" placeholder="Maliyet $" class="bg-transparent text-[11px] border-none focus:ring-0 px-2 w-full text-white">
                <button onclick="saveStock()" class="bg-accent-blue text-white h-9 w-12 rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-accent-blue/20">
                    <span class="material-symbols-outlined font-bold">add</span>
                </button>
            </div>

            <div class="max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                ${stocks.length > 0 ? cardsHtml : '<div class="py-10 opacity-30 text-xs italic text-center">Henüz USD varlığı eklenmedi.</div>'}
            </div>
        `
    });
}



// Yeni: Değerleri doğrudan kart üzerinden güncelleme fonksiyonu
function updateStockValue(symbol, field, newValue) {
    let stocks = JSON.parse(localStorage.getItem("stock_portfolio")) || [];
    const index = stocks.findIndex(s => s.symbol === symbol);
    if (index !== -1) {
        stocks[index][field] = parseFloat(newValue);
        localStorage.setItem("stock_portfolio", JSON.stringify(stocks));
        // UI'yı yenile (Input odağını kaybetmemesi için hafif bir delay verilebilir veya direkt çağrılabilir)
        showStockManager();
    }
}




// LocalStorage Kayıt ve Silme İşlemleri
function saveStock() {
    const symbol = document.getElementById('stock_symbol').value.toUpperCase();
    const amount = parseFloat(document.getElementById('stock_amount').value);
    const avgPrice = parseFloat(document.getElementById('stock_price').value);

    if (!symbol || isNaN(amount) || isNaN(avgPrice)) return;

    let stocks = JSON.parse(localStorage.getItem("stock_portfolio")) || [];
    stocks.push({ symbol, amount, avgPrice });
    localStorage.setItem("stock_portfolio", JSON.stringify(stocks));
    showStockManager();
}

function deleteStock(symbol) {
    let stocks = JSON.parse(localStorage.getItem("stock_portfolio")) || [];
    stocks = stocks.filter(s => s.symbol !== symbol);
    localStorage.setItem("stock_portfolio", JSON.stringify(stocks));
    showStockManager();
}

async function exportAllDataJSON() {
    const isDark = document.documentElement.classList.contains('dark');
    const keys = Object.keys(localStorage);

    if (keys.length === 0) {
        Swal.fire('Hata', 'LocalStorage içerisinde hiç veri bulunamadı.', 'info');
        return;
    }

    // --- 1. Adım: Key Listesini Göster ---
    const { value: selectedKey } = await Swal.fire({
        title: '<span class="text-sm font-black tracking-widest uppercase">Veri Kütüphanesi</span>',
        html: `
            <p class="text-[10px] opacity-50 mb-4 text-left">İşlem yapmak istediğiniz veri anahtarını seçin:</p>
            <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                ${keys.map(key => `
                    <button onclick="Swal.clickConfirm(); window.tempKey='${key}'" 
                            class="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 hover:bg-accent-blue/20 border border-white/5 rounded-xl transition-all group">
                        <span class="text-[11px] font-bold text-left group-hover:text-accent-blue">${key}</span>
                        <span class="material-symbols-outlined text-sm opacity-30">chevron_right</span>
                    </button>
                `).join('')}
            </div>
        `,
        width: '400px',
        background: isDark ? '#0b0f19' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl' }
    });

    const targetKey = window.tempKey;
    if (!targetKey) return;

    // --- 2. Adım: Seçilen Key'in İçeriğini Göster/Düzenle ---
    const rawData = localStorage.getItem(targetKey);
    let formattedData = rawData;
    
    // Eğer veri JSON formatındaysa daha güzel gösterelim
    try {
        const parsed = JSON.parse(rawData);
        formattedData = JSON.stringify(parsed, null, 4);
    } catch (e) {
        // JSON değilse düz metin olarak kalsın
    }

    Swal.fire({
        title: `<span class="text-xs font-mono text-accent-blue">${targetKey}</span>`,
        html: `
            <textarea id="jsonArea" class="w-full h-64 p-4 text-[11px] font-mono bg-black/20 dark:bg-white/5 border border-white/10 rounded-xl focus:ring-0 no-scrollbar" style="resize: none;">${formattedData}</textarea>
            <div class="mt-3 flex gap-2">
                <button onclick="copyToClipboard()" class="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest">Kopyala</button>
            </div>
        `,
        width: '550px',
        background: isDark ? '#0b0f19' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        showCancelButton: true,
        cancelButtonText: 'GERİ DÖN',
        confirmButtonText: 'DEĞİŞİKLİKLERİ KAYDET',
        confirmButtonColor: '#137fec',
        customClass: { popup: 'rounded-[2rem] border border-white/10 shadow-4xl' },
        preConfirm: () => {
            const updatedValue = document.getElementById('jsonArea').value;
            // Kaydetmeden önce JSON geçerliliğini kontrol et (opsiyonel)
            localStorage.setItem(targetKey, updatedValue);
            return targetKey;
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            exportAllDataJSON(); // Geri dönme tuşuna basılırsa listeyi tekrar aç
        } else if (result.isConfirmed) {
            Swal.fire({ icon: 'success', title: 'Güncellendi!', timer: 1000, showConfirmButton: false });
            if (targetKey === 'stock_portfolio') showStockManager(); // Eğer hisseler güncellendiyse tabloyu yenile
        }
    });
}

// Yardımcı Kopyalama Fonksiyonu
function copyToClipboard() {
    const textarea = document.getElementById("jsonArea");
    textarea.select();
    document.execCommand("copy");
    
    const btn = event.target;
    btn.innerText = "KOPYALANDI!";
    setTimeout(() => { btn.innerText = "KOPYALA"; }, 2000);
}

///// checklisttt
async function showChecklist() {
    const isDark = document.documentElement.classList.contains('dark');
    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];

    const renderList = () => {
        if (checklist.length === 0) {
            return `<div class="py-10 text-center opacity-30 text-xs italic">Henüz bir not eklenmedi.</div>`;
        }
        return checklist.map((item, index) => `
            <div class="flex items-center justify-between p-3 mb-2 bg-white/5 border border-white/5 rounded-2xl transition-all ${item.completed ? 'opacity-50' : ''}">
                <div class="flex items-center gap-3 flex-1 cursor-pointer" onclick="toggleCheckItem(${index})">
                    <span class="material-symbols-outlined text-[20px] ${item.completed ? 'text-accent-teal' : 'text-muted'}">
                        ${item.completed ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span class="text-[12px] font-medium ${item.completed ? 'line-through text-muted' : 'text-white'}">
                        ${item.text}
                    </span>
                </div>
                <div class="flex gap-2 ml-2">
                    <button onclick="editCheckItem(${index})" class="text-accent-blue opacity-50 hover:opacity-100 transition-all">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onclick="deleteCheckItem(${index})" class="text-loss-red opacity-50 hover:opacity-100 transition-all">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    };

    Swal.fire({
        title: '<div class="flex flex-col"><span class="text-[10px] font-bold text-accent-teal tracking-[0.3em] uppercase opacity-60">Kişisel Notlar</span><span class="text-xl font-black italic uppercase">CHECKLIST</span></div>',
        html: `
            <div class="flex gap-2 mb-6">
                <input id="new_check_item" placeholder="Yeni bir not veya görev yaz..." 
                    class="flex-1 bg-black/10 dark:bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[12px] focus:ring-1 focus:ring-accent-teal outline-none text-white">
                <button onclick="addCheckItem()" class="bg-accent-teal text-black rounded-xl px-4 hover:scale-105 transition-all shadow-lg shadow-accent-teal/20">
                    <span class="material-symbols-outlined font-bold">add</span>
                </button>
            </div>
            <div id="checklist_container" class="max-h-[350px] overflow-y-auto pr-2 no-scrollbar text-left">
                ${renderList()}
            </div>
        `,
        width: '500px',
        background: isDark ? '#0b0f19' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'rounded-[2.5rem] border border-white/10 shadow-4xl' }
    });
}

// --- Yardımcı Fonksiyonlar ---

function addCheckItem() {
    const input = document.getElementById('new_check_item');
    const text = input.value.trim();
    if (!text) return;

    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    checklist.push({ text: text, completed: false });
    localStorage.setItem("personal_checklist", JSON.stringify(checklist));
    updateChecklistNotification()
    showChecklist(); // Ekranı yenile
    
}

function toggleCheckItem(index) {
    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    checklist[index].completed = !checklist[index].completed;
    localStorage.setItem("personal_checklist", JSON.stringify(checklist));
    updateChecklistNotification()
    showChecklist();
    
}

async function editCheckItem(index) {
    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    const { value: newText } = await Swal.fire({
        title: 'Notu Düzenle',
        input: 'text',
        inputValue: checklist[index].text,
        showCancelButton: true,
        confirmButtonColor: '#14B8A6'
    });

    if (newText) {
        checklist[index].text = newText;
        localStorage.setItem("personal_checklist", JSON.stringify(checklist));
        updateChecklistNotification()
        showChecklist();
    }
    
}

function deleteCheckItem(index) {
    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    checklist.splice(index, 1);
    localStorage.setItem("personal_checklist", JSON.stringify(checklist));
    updateChecklistNotification()
    showChecklist();
    
}
function updateChecklistNotification() {
    const checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    
    // Bugünün tarihini Manuel Oluştur (Safari/İngiltere bölge hatasını önler)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayStr = `${day}.${month}.${year}`; // Her zaman DD.MM.YYYY formatında

    const hasTodayTask = checklist.some(item => {
        if (!item.text.includes('-')) return false;
        
        const parts = item.text.split('-');
        // Sondaki tarihi al ve hem noktaları hem bölüleri temizleyip normalize et
        let itemDate = parts[parts.length - 1].trim(); 
        
        // Eşleşme kontrolü (Tamamlanmamış notlar için)
        return itemDate === todayStr && !item.completed;
    });

    // Butonu bul (Safari için daha kapsayıcı bir seçici)
    const btn = document.querySelector('[onclick="showChecklist()"]');

    if (btn) {
        if (hasTodayTask) {
            btn.classList.add('animate-pulse-red');
            // Safari bazen sadece class eklemeyi algılamaz, zorla renk verelim
            btn.style.backgroundColor = "#ef4444"; 
        } else {
            btn.classList.remove('animate-pulse-red');
            btn.style.backgroundColor = ""; // Eski haline döner
        }
    }
}



function addCheckItem() {
    const input = document.getElementById('new_check_item');
    let text = input.value.trim();
    if (!text) return;

    // Eğer kullanıcı tarih yazmadıysa bugünün tarihini otomatik ekle
    if (!text.includes('-')) {
        const todayStr = new Date().toLocaleDateString('tr-TR');
        text = `${text} - ${todayStr}`;
    }

    let checklist = JSON.parse(localStorage.getItem("personal_checklist")) || [];
    checklist.push({ text: text, completed: false });
    localStorage.setItem("personal_checklist", JSON.stringify(checklist));
    
    updateChecklistNotification(); // Bildirimi güncelle
    showChecklist(); // Ekranı yenile
}



async function showGraphSettings() {
    const isDark = document.documentElement.classList.contains('dark');
    const values = JSON.parse(localStorage.getItem("values")) || {};
    const labels = JSON.parse(localStorage.getItem("labels")) || {
        "label_1": "Cüzdan 1", "label_2": "Cüzdan 2", "label_3": "Cüzdan 3",
        "label_4": "Cüzdan 4", "label_5": "Cüzdan 5", "label_6": "Cüzdan 6", "label_7": "Cüzdan 7"
    };

    // Renk paleti
    const colors = ["#3B82F6", "#8B5CF6", "#FACC15", "#F97316", "#14B8A6", "#EC4899", "#6366F1"];

    Swal.fire({
        title: '<div class="flex flex-col"><span class="text-[10px] font-bold text-accent-blue tracking-[0.3em] uppercase opacity-60">Grafik ve Etiketler</span><span class="text-xl font-black italic uppercase">PORTFÖY DAĞILIMI</span></div>',
        width: '800px',
        background: isDark ? '#0b0f19' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        showConfirmButton: true,
        confirmButtonText: 'DEĞİŞİKLİKLERİ UYGULA',
        confirmButtonColor: '#137fec',
        showCloseButton: true,
        customClass: {
            popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl',
            confirmButton: 'rounded-2xl px-8 py-3 font-bold'
        },
        html: `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                <div class="flex flex-col justify-center items-center bg-black/10 dark:bg-white/5 rounded-3xl p-4 border border-white/5">
                    <div id="chartContainerPop" style="height: 300px; width: 100%;"></div>
                    <div class="mt-4 text-center">
                        <p class="text-[10px] font-bold text-muted uppercase tracking-widest">Toplam Varlık</p>
                        <p class="text-2xl font-black text-white">₺${parseFloat(localStorage.getItem("all_amount") || 0).toLocaleString('tr-TR')}</p>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <p class="text-[10px] font-bold text-accent-blue uppercase tracking-widest mb-2 px-2">Cüzdan İsimlerini Düzenle</p>
                    <div class="max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                        ${[1, 2, 3, 4, 5, 6, 7].map(i => `
                            <div class="flex items-center gap-3 mb-2 bg-white/5 p-2 rounded-2xl border border-white/5 group focus-within:border-accent-blue/30 transition-all">
                                <div class="w-2 h-8 rounded-full" style="background-color: ${colors[i-1]}"></div>
                                <div class="flex-1 text-left">
                                    <p class="text-[8px] font-bold text-muted uppercase opacity-50">Cüzdan ${i}</p>
                                    <input type="text" id="edit-label-${i}" value="${labels[`label_${i}`] || ''}" 
                                        class="bg-transparent border-none p-0 text-white text-sm font-bold w-full focus:ring-0 placeholder:text-white/10"
                                        placeholder="İsim girin...">
                                </div>
                                <div class="text-right px-2">
                                    <p class="text-[10px] font-mono font-bold text-white/40">₺${(values[`staff_${i}`] || 0).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `,
        didOpen: () => {
            // CanvasJS Grafiğini Pop-up içinde render et
            const chart = new CanvasJS.Chart("chartContainerPop", {
                theme: isDark ? "dark2" : "light2",
                backgroundColor: "transparent",
                animationEnabled: true,
                data: [{
                    type: "doughnut",
                    startAngle: 180,
                    innerRadius: "70%",
                    indexLabel: "{label}: %{y}",
                    indexLabelFontSize: 10,
                    indexLabelFontColor: isDark ? "#94a3b8" : "#475569",
                    indexLabelPlacement: "outside",
                    dataPoints: [1, 2, 3, 4, 5, 6, 7].map(i => ({
                        y: Math.abs(values[`staff_${i}`] || 0),
                        label: labels[`label_${i}`],
                        color: colors[i-1]
                    }))
                }]
            });
            chart.render();
        },
        preConfirm: () => {
            // Verileri topla ve kaydet
            const newLabels = {};
            for(let i=1; i<=7; i++) {
                const val = document.getElementById(`edit-label-${i}`).value;
                newLabels[`label_${i}`] = val || `Wallet-${i}`;
                
                // Ana sayfadaki etiketleri de güncelle (varsa)
                const mainLabelEl = document.getElementById(`staff-${i}-name`);
                if(mainLabelEl) mainLabelEl.innerText = newLabels[`label_${i}`];
            }
            localStorage.setItem("labels", JSON.stringify(newLabels));
            return newLabels;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Ana grafikleri ve UI'ı yenile
            if (typeof donut_and_init === "function") donut_and_init();
            if (typeof graph === "function") graph();
            
            Swal.fire({
                icon: 'success',
                title: 'Etiketler Güncellendi',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: isDark ? '#1a2131' : '#fff',
                color: isDark ? '#fff' : '#000'
            });
        }
    });
}


// ====================== UĞUR PORTFÖYÜ SLIDER - TAM HALİ ======================
// Kategori özetleri + düzenleme + ekleme + sıralama

let ugurPortfolioData = [];

async function loadUgurPortfolio() {
  const sliderContainer = document.getElementById("ugurPortfolioSlider");
  const summaryContainer = document.getElementById("categorySummary");

  if (sliderContainer) {
    sliderContainer.innerHTML = `<div class="text-center py-12 text-accent-teal">Veriler yükleniyor...</div>`;
  }

  const raw = localStorage.getItem("ugur_portfolio_v3");
  if (!raw) {
    if (sliderContainer) sliderContainer.innerHTML = `<div class="text-center py-12 text-text-muted">ugur_portfolio_v3 verisi bulunamadı.</div>`;
    return;
  }

  try {
    const data = JSON.parse(raw);
    ugurPortfolioData = [];

    const allItems = [
      ...(data.tefas || []).map(item => ({...item, type: "TEFAS"})),
      ...(data.us || []).map(item => ({...item, type: "US"})),
      ...(data.silver || []).map(item => ({...item, type: "GÜMÜŞ"}))
    ];

    if (allItems.length === 0) {
      if (sliderContainer) sliderContainer.innerHTML = `<div class="text-center py-12 text-text-muted">Portföyde henüz varlık yok.</div>`;
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    for (const item of allItems) {
      let currentPrice = 0;
      const isUSD = item.type === "US";
      const currencySymbol = isUSD ? "$" : "₺";

      try {
        if (isUSD) {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=c94i99aad3if4j50rvn0`);
          const quote = await res.json();
          if (quote && quote.c) currentPrice = quote.c;
        } else {
          const res = await fetch(`https://gate.fintables.com/barbar/udf/history?symbol=${encodeURIComponent(item.symbol)}&resolution=D&from=1734210000&to=${now}`);
          const hist = await res.json();
          if (hist && hist.c && hist.c.length > 0) {
            currentPrice = hist.c[hist.c.length - 1];
          }
        }
      } catch (e) {
        console.warn(`Fiyat alınamadı: ${item.symbol}`);
        if (data.prices && data.prices[item.symbol]) {
          currentPrice = data.prices[item.symbol];
        }
      }

      const totalValue = currentPrice * item.amount;
      const plPercent = item.avgPrice > 0 ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100 : 0;

      ugurPortfolioData.push({
        symbol: item.symbol,
        amount: parseFloat(item.amount),
        avgPrice: parseFloat(item.avgPrice),
        currentPrice: currentPrice || 0,
        totalValue: totalValue,
        plPercent: plPercent,
        type: item.type,
        isUSD: isUSD,
        currencySymbol: currencySymbol
      });
    }

    renderCategorySummary();
    sortAndRenderUgurPortfolio();

  } catch (err) {
    console.error("loadUgurPortfolio hatası:", err);
    if (sliderContainer) sliderContainer.innerHTML = `<div class="text-center py-12 text-loss-red">Veri yüklenirken hata oluştu</div>`;
  }
}

// ====================== KATEGORİ ÖZET GÖSTERGESİ (KISA VE DENGELİ VERSİYON) ======================
function renderCategorySummary() {
  const container = document.getElementById("categorySummary");
  if (!container) return;

  const categories = {
    "TEFAS": { totalPL: 0, totalValue: 0 },
    "US":    { totalPL: 0, totalValue: 0 },
    "GÜMÜŞ": { totalPL: 0, totalValue: 0 }
  };

  ugurPortfolioData.forEach(item => {
    if (categories[item.type]) {
      categories[item.type].totalPL += (item.currentPrice - item.avgPrice) * item.amount;
      categories[item.type].totalValue += item.totalValue;
    }
  });

  let html = "";

  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    if (cat.totalValue === 0 && cat.totalPL === 0) return;

    const plPercent = cat.totalValue > 0 ? (cat.totalPL / cat.totalValue) * 100 : 0;
    const isProfit = cat.totalPL >= 0;
    const colorClass = isProfit ? "text-accent-teal" : "text-loss-red";
    const symbol = key === "US" ? "$" : "₺";

    html += `
      <div class="glass-card p-3 rounded-3xl border border-white/10 text-center hover:border-white/30 transition-all min-h-[92px] flex flex-col justify-between">
        <p class="text-[10px] uppercase tracking-widest text-text-muted">${key}</p>
        
        <!-- Toplam Değer -->
        <p class="text-base font-bold text-white mt-1 mb-1">
          ${symbol}${cat.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: key === "US" ? 0 : 0 })}
        </p>
        
        <!-- Kâr/Zarar - Kısa ve Hizalı -->
        <div class="flex items-center justify-center gap-1 text-sm">
          <span class="${colorClass} text-base leading-none mt-px">
            ${isProfit ? '▲' : '▼'}
          </span>
          <span class="${colorClass} font-medium">
            ${symbol}${Math.abs(cat.totalPL).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </span>
          <span class="text-[10px] ${colorClass} opacity-75">
            (${plPercent.toFixed(1)}%)
          </span>
        </div>
      </div>`;
  });

  if (html === "") {
    html = `<div class="col-span-3 text-center text-text-muted text-xs py-6">Henüz kategori verisi yok</div>`;
  }

  container.innerHTML = html;
}


// ====================== SIRALAMA VE RENDER ======================
function sortUgurPortfolio() {
  const sortType = document.getElementById("ugurSortSelect")?.value || "name";

  ugurPortfolioData.sort((a, b) => {
    switch (sortType) {
      case "name": return a.symbol.localeCompare(b.symbol);
      case "value": return b.totalValue - a.totalValue;
      case "plPercent": return b.plPercent - a.plPercent;
      case "type":
        const order = { "TEFAS": 1, "US": 2, "GÜMÜŞ": 3 };
        return (order[a.type] || 99) - (order[b.type] || 99) || a.symbol.localeCompare(b.symbol);
      default: return 0;
    }
  });
}

function renderUgurPortfolioSlider() {
  const container = document.getElementById("ugurPortfolioSlider");
  if (!container) return;

  if (ugurPortfolioData.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-text-muted">Portföy boş.</div>`;
    return;
  }

  let html = "";
  ugurPortfolioData.forEach(item => {
    const isProfit = item.plPercent >= 0;
    const colorClass = isProfit ? "text-accent-teal" : "text-loss-red";
    const plSign = isProfit ? "+" : "";
    const plAmount = (item.currentPrice - item.avgPrice) * item.amount;

    html += `
      <div onclick="editUgurItem('${item.symbol}')" 
           class="glass-card min-w-[198px] flex-shrink-0 p-5 rounded-3xl border border-white/10 flex flex-col cursor-pointer hover:scale-[1.04] active:scale-[0.97] transition-all duration-300">
        
        <div class="flex justify-between items-start">
          <div>
            <p class="font-black text-white text-2xl tracking-tighter">${item.symbol}</p>
            <p class="text-[10px] uppercase tracking-widest text-text-muted">${item.type}</p>
          </div>
          <span class="px-3 py-1 text-[10px] font-bold rounded-2xl ${item.isUSD ? 'bg-accent-blue/10 text-accent-blue' : item.type === 'GÜMÜŞ' ? 'bg-amber-400/10 text-amber-400' : 'bg-accent-teal/10 text-accent-teal'}">
            ${item.type}
          </span>
        </div>

        <div class="mt-5 space-y-4">
          <div class="flex justify-between">
            <div><p class="text-[10px] text-text-muted">Adet</p><p class="text-white font-semibold">${item.amount.toLocaleString('tr-TR')}</p></div>
            <div class="text-right"><p class="text-[10px] text-text-muted">Maliyet</p><p class="text-white/80">${item.currencySymbol}${item.avgPrice.toFixed(item.isUSD ? 2 : 4)}</p></div>
          </div>
          <div class="flex justify-between">
            <div><p class="text-[10px] text-text-muted">Güncel</p><p class="font-bold ${item.isUSD ? 'text-accent-blue' : 'text-white'}">${item.currencySymbol}${item.currentPrice.toFixed(item.isUSD ? 2 : 4)}</p></div>
            <div class="text-right"><p class="text-[10px] text-text-muted">Toplam</p><p class="font-black text-white">${item.currencySymbol}${item.totalValue.toLocaleString('tr-TR', {maximumFractionDigits: item.isUSD ? 0 : 0})}</p></div>
          </div>
        </div>

        <!-- KAR/ZARAR ORANI + MİKTAR -->
        <div class="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <div class="${colorClass} text-sm font-medium">
            ${isProfit ? '▲' : '▼'} %${Math.abs(item.plPercent).toFixed(2)}
          </div>
          <div class="${colorClass} text-sm font-medium">
            ${plSign}${item.currencySymbol}${Math.abs(plAmount).toLocaleString('tr-TR', {maximumFractionDigits: item.isUSD ? 0 : 0})}
          </div>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

function sortAndRenderUgurPortfolio() {
  sortUgurPortfolio();
  renderUgurPortfolioSlider();
}


async function refreshUgurPortfolio() {
  await loadUgurPortfolio();
}

// ====================== DÜZENLEME POPUP ======================
function editUgurItem(symbol) {
  const item = ugurPortfolioData.find(i => i.symbol === symbol);
  if (!item) {
    Swal.fire("Hata", "Varlık bulunamadı", "error");
    return;
  }

  Swal.fire({
    title: `${item.symbol} - Düzenle`,
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs text-text-muted mb-1">Sembol</label>
          <input id="swal-symbol" value="${item.symbol}" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white" readonly>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-text-muted mb-1">Adet</label>
            <input id="swal-amount" type="number" value="${item.amount}" step="0.000001" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Maliyet Fiyatı</label>
            <input id="swal-avgPrice" type="number" value="${item.avgPrice}" step="0.000001" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
          </div>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Tür</label>
          <select id="swal-type" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
            <option value="TEFAS" ${item.type === "TEFAS" ? "selected" : ""}>TEFAS</option>
            <option value="US" ${item.type === "US" ? "selected" : ""}>US (Dolar)</option>
            <option value="GÜMÜŞ" ${item.type === "GÜMÜŞ" ? "selected" : ""}>GÜMÜŞ</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Kaydet',
    cancelButtonText: 'İptal',
    showDenyButton: true,
    denyButtonText: 'Sil',
    denyButtonColor: '#ef4444',
    background: '#0b0f19',
    color: '#f1f5f9',
    preConfirm: () => {
      const amount = parseFloat(document.getElementById("swal-amount").value);
      const avgPrice = parseFloat(document.getElementById("swal-avgPrice").value);
      const newType = document.getElementById("swal-type").value;

      if (isNaN(amount) || isNaN(avgPrice) || amount <= 0) {
        Swal.showValidationMessage("Adet ve maliyet fiyatı geçerli olmalıdır!");
        return false;
      }
      return { amount, avgPrice, type: newType };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      saveEditedItem(symbol, result.value.amount, result.value.avgPrice, result.value.type);
    } else if (result.isDenied) {
      deleteUgurItem(symbol);
    }
  });
}

function saveEditedItem(oldSymbol, newAmount, newAvgPrice, newType) {
  let portfolio = JSON.parse(localStorage.getItem("ugur_portfolio_v3") || "{}");

  const categories = ['tefas', 'us', 'silver'];
  let found = false;

  for (let cat of categories) {
    if (portfolio[cat]) {
      const index = portfolio[cat].findIndex(item => item.symbol === oldSymbol);
      if (index !== -1) {
        const oldType = cat === 'us' ? 'US' : cat === 'silver' ? 'GÜMÜŞ' : 'TEFAS';

        if (oldType !== newType) {
          portfolio[cat].splice(index, 1);
          const targetCat = newType === 'US' ? 'us' : newType === 'GÜMÜŞ' ? 'silver' : 'tefas';
          if (!portfolio[targetCat]) portfolio[targetCat] = [];
          portfolio[targetCat].push({ symbol: oldSymbol, amount: newAmount, avgPrice: newAvgPrice });
        } else {
          portfolio[cat][index].amount = newAmount;
          portfolio[cat][index].avgPrice = newAvgPrice;
        }
        found = true;
        break;
      }
    }
  }

  if (found) {
    localStorage.setItem("ugur_portfolio_v3", JSON.stringify(portfolio));
    loadUgurPortfolio();
    Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 1200, showConfirmButton: false });
  }
}

function deleteUgurItem(symbol) {
  Swal.fire({
    title: 'Silmek istediğinden emin misin?',
    text: `${symbol} kalıcı olarak silinecek.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#ef4444'
  }).then((result) => {
    if (result.isConfirmed) {
      let portfolio = JSON.parse(localStorage.getItem("ugur_portfolio_v3") || "{}");
      ['tefas', 'us', 'silver'].forEach(cat => {
        if (portfolio[cat]) {
          portfolio[cat] = portfolio[cat].filter(item => item.symbol !== symbol);
        }
      });
      localStorage.setItem("ugur_portfolio_v3", JSON.stringify(portfolio));
      loadUgurPortfolio();
      Swal.fire('Silindi!', '', 'success');
    }
  });
}

function addNewUgurItem() {
  Swal.fire({
    title: 'Yeni Varlık Ekle',
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs text-text-muted mb-1">Sembol</label>
          <input id="new-symbol" placeholder="Örn: NVDA veya GUM" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white uppercase">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-text-muted mb-1">Adet</label>
            <input id="new-amount" type="number" step="0.000001" placeholder="Adet" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Maliyet Fiyatı</label>
            <input id="new-avgPrice" type="number" step="0.000001" placeholder="Maliyet" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
          </div>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Tür</label>
          <select id="new-type" class="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white">
            <option value="TEFAS">TEFAS</option>
            <option value="US">US (Dolar)</option>
            <option value="GÜMÜŞ">GÜMÜŞ</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Ekle',
    background: '#0b0f19',
    preConfirm: () => {
      const symbol = document.getElementById('new-symbol').value.trim().toUpperCase();
      const amount = parseFloat(document.getElementById('new-amount').value);
      const avgPrice = parseFloat(document.getElementById('new-avgPrice').value);
      const type = document.getElementById('new-type').value;

      if (!symbol || isNaN(amount) || isNaN(avgPrice)) {
        Swal.showValidationMessage('Sembol, adet ve maliyet zorunludur!');
        return false;
      }
      return { symbol, amount, avgPrice, type };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      let portfolio = JSON.parse(localStorage.getItem("ugur_portfolio_v3") || "{}");
      const targetCat = result.value.type === 'US' ? 'us' : result.value.type === 'GÜMÜŞ' ? 'silver' : 'tefas';
      if (!portfolio[targetCat]) portfolio[targetCat] = [];
      portfolio[targetCat].push({
        symbol: result.value.symbol,
        amount: result.value.amount,
        avgPrice: result.value.avgPrice
      });
      localStorage.setItem("ugur_portfolio_v3", JSON.stringify(portfolio));
      loadUgurPortfolio();
      Swal.fire({ icon: 'success', title: 'Eklendi', timer: 1400, showConfirmButton: false });
    }
  });
}

// ====================== VARLIK İŞLEMLERİM SIRALAMA ======================
function sortVarlikIslemlerim() {
  const sortType = document.getElementById("varlikSortSelect").value;
  const container = document.getElementById("varlikIslemlerimSlider");
  
  if (!container) return;

  const cards = Array.from(container.children);

  cards.sort((a, b) => {
    if (sortType === "name") {
      // İsme göre sırala
      const nameA = (a.querySelector("p[id^='staff-']") || a).textContent.trim();
      const nameB = (b.querySelector("p[id^='staff-']") || b).textContent.trim();
      return nameA.localeCompare(nameB);
    } 
    else if (sortType === "value") {
      // Değere göre sırala (büyükten küçüğe)
      const inputA = a.querySelector("input[type='number']");
      const inputB = b.querySelector("input[type='number']");
      const valA = inputA ? parseFloat(inputA.value) || 0 : 0;
      const valB = inputB ? parseFloat(inputB.value) || 0 : 0;
      return valB - valA;
    }
    return 0;
  });

  // Sıralanmış kartları yeniden yerleştir
  container.innerHTML = "";
  cards.forEach(card => container.appendChild(card));
}



// ====================== SAYFA YÜKLENDİĞİNDE ÇALIŞTIR ======================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Uğur Portföyü yükleniyor...");
  setTimeout(loadUgurPortfolio, 1500);
});
