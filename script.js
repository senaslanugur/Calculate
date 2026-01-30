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

  const borc_bilgisi = "debit_total_percent";
  const total_borc = parseFloat(localStorage.getItem(borc_bilgisi)) || 0;

  let all_amount = staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6 + staff_7;
  all_amount = all_amount - total_borc;

  const old_amount = parseFloat(localStorage.getItem("all_amount")) || 0;
  localStorage.setItem("all_amount", all_amount);

  const values = {
    "staff_1": staff_1, "staff_2": staff_2, "staff_3": staff_3,
    "staff_4": staff_4, "staff_5": staff_5, "staff_6": staff_6, "staff_7": staff_7,
  };

  localStorage.setItem("values", JSON.stringify(values));

  const url = `https://api.frankfurter.app/latest?amount=${all_amount}&from=TRY&to=USD`;
  const isDark = document.documentElement.classList.contains('dark');

  $.ajax({
    url: url,
    async: false,
    success: function(result) {
      const isIncreased = all_amount >= old_amount;
      const diff = all_amount - old_amount;

      Swal.fire({
        title: `<span style="font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.02em;">
                  ${isIncreased ? 'VARLIKLAR ARTTI' : 'VARLIKLAR AZALDI'}
                </span>`,
        html: `
          <div class="flex flex-col gap-4 p-2 font-display">
            <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p class="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 text-center">Güncel Toplam (TRY)</p>
              <p class="text-3xl font-black text-white text-center">₺${parseFloat(result.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <p class="text-[9px] font-bold text-muted uppercase mb-1">Dolar Karşılığı</p>
                <p class="text-sm font-bold text-accent-blue">$${result.rates.USD.toFixed(2)}</p>
              </div>
              <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <p class="text-[9px] font-bold text-muted uppercase mb-1">Değişim</p>
                <p class="text-sm font-bold ${isIncreased ? 'text-accent-teal' : 'text-loss-red'}">
                  ${isIncreased ? '+' : ''}₺${diff.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            ${!isIncreased ? `
            <div class="text-[11px] text-text-muted text-center mt-2 italic">
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

      addDayDate(result.amount, result.rates.USD);
    }
  });

  get();
  donut_and_init()
  lineGraph()
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




function get_all_info(){

   const al_date = localStorage.getItem("day_data_set")

        Swal.fire({
          title: "Tüm Veriler Güncellemeyi Yapınız.",
          html: '<textarea id="all_db" name="all_db" id="all_db" rows="4" cols="50"> '+
                    al_date+
                '</textarea>',
          icon: "info",
          button: "Kapat",
        }).then((result) => {

          const all_db = document.getElementById("all_db").value
          localStorage.setItem("day_data_set",all_db)

        })


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

    // Görünüm Başlığı ve Yenile Butonu (Ortak Kısım)
    const headerHtml = `
        <div class="text-center mb-8 pt-4 relative">
            <p class="text-text-muted text-[10px] font-bold tracking-[0.3em] uppercase mb-2 opacity-60">Toplam Portföy</p>
            <div class="flex items-center justify-center gap-3">
                <h2 class="text-4xl font-black text-white tracking-tighter italic">₺${formattedTotal}</h2>
                <button onclick="triggerRefresh('${viewType}')" class="text-accent-teal hover:text-white transition-colors">
                    <span class="material-symbols-outlined font-bold text-[24px] ${spinClass}">refresh</span>
                </button>
            </div>
        </div>
    `;

    if (viewType === 'slider') {
        let cardsHtml = currentPortfolioData.map(item => {
            const colorClass = item.change >= 0 ? 'text-accent-teal' : 'text-loss-red';
            return `
                <div class="p-5 bg-card-dark rounded-3xl border border-white/5 text-left min-w-[260px] m-2 shadow-2xl flex-shrink-0">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-black text-white">${item.symbol}</h3>
                        <span class="${colorClass} font-bold text-sm">%${item.change}</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-between">
                        <div><p class="text-text-muted text-[10px] font-bold uppercase">Adet</p><p class="text-white">${item.amount}</p></div>
                        <div class="text-right"><p class="text-text-muted text-[10px] font-bold uppercase">Değer</p><p class="text-white font-bold">₺${item.totalVal.toLocaleString('tr-TR')}</p></div>
                    </div>
                </div>`;
        }).join('');

        contentHtml = `
            <div id="slider-container" class="flex overflow-x-auto pb-4 no-scrollbar" style="scroll-snap-type: x mandatory;">${cardsHtml}</div>
            <button onclick="renderPortfolioContent('table')" class="mt-4 px-6 py-2 bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal rounded-full text-[11px] font-bold transition-all border border-accent-teal/20 tracking-widest uppercase">⚙️ Portföy Yönetimi</button>
        `;
   } else {
        // TABLO GÖRÜNÜMÜ - % Değişim Kolonu Eklendi
        let rowsHtml = currentPortfolioData.map(item => {
            const colorClass = item.change >= 0 ? 'text-accent-teal' : 'text-loss-red';
            const arrow = item.change >= 0 ? '▲' : '▼';
            
            return `
                <tr class="border-b border-white/5 text-xs">
                    <td class="py-3 font-bold text-white text-left tracking-tight">
                        ${item.symbol}
                        <div class="text-[9px] opacity-40 font-normal mt-0.5">${item.updateDate}</div>
                    </td>
                    <td class="py-3 text-right">
                        <input type="number" value="${item.amount}" onchange="updateAmount('${item.symbol}', this.value)" 
                            class="bg-white/5 border border-white/10 rounded-lg w-16 text-right text-white text-[11px] px-2 py-1 outline-none focus:border-accent-teal/50 transition-all">
                    </td>
                    <td class="py-3 text-right">
                        <div class="font-bold text-white text-[11px]">₺${item.totalVal.toLocaleString('tr-TR', {maximumFractionDigits:0})}</div>
                        <div class="${colorClass} text-[10px] font-medium flex items-center justify-end gap-0.5">
                            ${arrow} %${Math.abs(item.change)}
                        </div>
                    </td>
                    <td class="py-3 text-right">
                        <button onclick="deleteSymbol('${item.symbol}')" class="text-loss-red/40 hover:text-loss-red transition-colors">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        contentHtml = `
            <div class="max-h-[300px] overflow-y-auto pr-2 no-scrollbar mb-4">
                <table class="w-full text-text-muted">
                    <thead>
                        <tr class="text-[9px] uppercase tracking-[0.2em] border-b border-white/10 opacity-50">
                            <th class="pb-3 text-left">Fon / Tarih</th>
                            <th class="pb-3 text-right">Adet</th>
                            <th class="pb-3 text-right">Değer & Değişim</th>
                            <th class="pb-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/[0.02]">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            <div class="bg-white/[0.03] p-2 rounded-2xl flex gap-2 items-center mb-6 border border-white/5 shadow-inner">
                <input id="newSymbol" type="text" placeholder="SEM" class="bg-transparent border-none text-white text-xs w-16 focus:ring-0 uppercase font-bold px-3">
                <div class="w-[1px] h-4 bg-white/10"></div>
                <input id="newAmount" type="number" placeholder="Adet Girin" class="bg-transparent border-none text-white text-xs w-full focus:ring-0 px-2">
                <button onclick="addNewSymbol()" class="bg-accent-teal text-black h-8 w-8 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-teal/20">
                    <span class="material-symbols-outlined font-bold text-[20px]">add</span>
                </button>
            </div>

            <button onclick="renderPortfolioContent('slider')" class="mt-2 text-text-muted hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">
                ← Kart Görünümüne Dön
            </button>
        `;
    }


    Swal.fire({
        background: '#0b0f19',
        showConfirmButton: false,
        showCloseButton: true,
        width: '400px',
        customClass: { popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl' },
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
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#FACC15", // yellow
    "#F97316", // orange
    "#14B8A6"  // teal
  ];
  const NEGATIVE_COLOR = "#EF4444"; // Kırmızı!

  // Test amaçlı localStorage yoksa ekleyelim
  if (!localStorage.getItem("values")) {
    localStorage.setItem(
      "values",
      JSON.stringify({
        "staff_1": 103.8,
        "staff_2": 226.7,
        "staff_3": 54.2,
        "staff_4": 132.8,
        "staff_5": -33.7,
        "staff_6": -10.2,
        "staff_7": 0
      })
    );
  }

  const savedTotal = localStorage.getItem("debit_total_percent");
  if (savedTotal) {
    const total = parseFloat(savedTotal);
    const toplamborc = document.getElementById("toplam_borc");
    toplamborc.textContent = total;
  }

  // 1. Tüm staff_ değerlerini al
  const values = JSON.parse(localStorage.getItem("values") || "{}");
  const staffEntries = Object.entries(values).filter(([key, val]) => key.startsWith('staff_'));
  // orijinal değerleri ve onların mutlak değer toplamını bul
  const absSum = staffEntries.reduce((sum, [k, v]) => sum + Math.abs(parseFloat(v)), 0);

  // 2. Oranları hesapla ve svg donut chart yarat
  let offset = 0;
  let circles = "";

  for (let i = 0; i < staffEntries.length; ++i) {
    const [k, v] = staffEntries[i];
    const val = parseFloat(v);

    // Tüm segment oranlarını mutlak değerle dağıtıyoruz
    let percent = absSum === 0 ? 0 : ((Math.abs(val) / absSum) * 100);
    let dasharray = percent.toFixed(2) + ", 100";
    let dashoffset = -offset; // eksiyle başlamalı
    let color = val >= 0
      ? STAFF_COLORS[i % STAFF_COLORS.length]
      : NEGATIVE_COLOR; // Negatif değerler kırmızı!

    if (percent > 0) {
      circles += `<circle
                cx="18" cy="18" r="15.9155" fill="none"
                stroke="${color}"
                stroke-width="2.5"
                stroke-dasharray="${dasharray}"
                stroke-dashoffset="${dashoffset}"
            ></circle>`;
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
  if (savedTotal) {
    document.getElementById("donut-total").textContent = tlFormat(total - savedTotal);
  } else {
    document.getElementById("donut-total").textContent = tlFormat(total);
  }

  // --- Başlangıç: Hedef/kalan hesaplaması ve progress güncelleme ---
  (function updateGoalProgress() {
    // format fonksiyonu (sayısal değeri TL biçimine çeviren mevcut fonksiyonunuzla uyumlu)
    function tlFormat(val) {
      if (isNaN(val)) return "₺0";
      if (Math.abs(val) > 9999) {
        return (val < 0 ? "-₺" : "₺") + (Math.abs(val) / 1000).toFixed(1) + "K";
      }
      return (val < 0 ? "-₺" : "₺") + Math.abs(val).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
    }

    // daha güvenli string -> number parser (₺, . ve , ve K kısaltmasını da ele alır)
    function parseTL(str) {
      if (str == null) return NaN;
      let s = String(str).trim();
      if (s === "") return NaN;

      // Eğer "K" içeriyorsa örn "₺1.2K"
      const kMatch = s.match(/-?[\d\.,]+K/i);
      if (kMatch) {
        let num = kMatch[0].replace(/K/i, '').replace(/₺/g, '').trim();
        num = num.replace(/\./g, '').replace(',', '.'); // güvenli dönüştürme
        return parseFloat(num) * 1000;
      }

      // Temizleme: para sembollerini vs kaldır
      s = s.replace(/₺/g, '').replace(/\s/g, '');
      // Eğer hem nokta hem virgül varsa (tr formatı: bin ayracı . , ondalık ,) noktaları kaldır, virgülü noktayla değiştir
      if (s.indexOf('.') > -1 && s.indexOf(',') > -1) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.indexOf(',') > -1 && s.indexOf('.') === -1) {
        s = s.replace(',', '.');
      } else {
        // sadece noktalar varsa (ör. 1000.50), bırak
      }
      // Son olarak sayısal olmayanları temizle
      s = s.replace(/[^0-9\.\-]/g, '');
      return parseFloat(s);
    }

    // DOM elemanları
    const donutTotalEl = document.getElementById("donut-total");
    const targetEl = document.getElementById("total_hedef");
    const kalanTLel = document.getElementById("kalan_hedef_tl");
    const kalanYuzdeEl = document.getElementById("kalan_hedef_yuzde");
    // progress çubuğunun iç div'ini al (ilk bulunan .bg-gradient-to-r kullanıldı)
    const progressInner = document.querySelector(".bg-gradient-to-r");

    if (!donutTotalEl || !targetEl || !kalanTLel || !kalanYuzdeEl || !progressInner) {
      // Gerekli elemanlardan biri yoksa çık
      return;
    }

    // Mevcut toplam değeri (ekrana yazılan değerden ya da script'te hesaplanan total/savedTotal farkından alma)
    // Eğer donutTotal zaten formatlanmış string ise parse et
    let current = parseTL(donutTotalEl.textContent);

    // Eğer current NaN ise (ör: script'ten variable 'total' kullanılabilir), deneyelim:
    if (isNaN(current)) {
      try {
        // total ve savedTotal değişkenleri aynı scope'ta varsa kullan
        if (typeof total !== "undefined") {
          const saved = (typeof savedTotal !== "undefined" && savedTotal !== null) ? parseFloat(savedTotal) : 0;
          current = isNaN(saved) ? total : (total - saved);
        }
      } catch (e) {
        current = NaN;
      }
    }

    const target = parseTL(targetEl.textContent);

    // Hesaplamalar
    const remaining = (isNaN(target) || isNaN(current)) ? NaN : (target - current);
    const percentReached = (isNaN(target) || target === 0 || isNaN(current)) ? 0 : (current / target) * 100;
    const percentForWidth = Math.max(0, Math.min(100, percentReached)); // görsel için 0-100 aralığı

    // Güncellemeler
    kalanTLel.textContent = isNaN(remaining) ? "₺0" : tlFormat(remaining);
    kalanYuzdeEl.textContent = (isNaN(percentReached) ? 0 : percentReached).toFixed(1) + "%";
    progressInner.style.width = percentForWidth.toFixed(1) + "%";

  })();
  // --- Bitiş ---
}