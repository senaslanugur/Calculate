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



function calculate(){

  const staff_1 = parseFloat(document.getElementById("staff-1").value);
  const staff_2 = parseFloat(document.getElementById("staff-2").value);
  const staff_3 = parseFloat(document.getElementById("staff-3").value);
  const staff_4 = parseFloat(document.getElementById("staff-4").value);
  const staff_5 = parseFloat(document.getElementById("staff-5").value);
  const staff_6 = parseFloat(document.getElementById("staff-6").value);
  const staff_7 = parseFloat(document.getElementById("staff-7").value);

  const borc_bilgisi = "debit_total_percent";
  const total_borc = localStorage.getItem(borc_bilgisi);

  let all_amount = staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6 + staff_7
  if(total_borc){
     all_amount = all_amount - total_borc
  }


   
  old_amount = parseFloat(localStorage.getItem("all_amount"))

  localStorage.setItem("all_amount",all_amount)

  const values = {
   "staff_1":staff_1,
   "staff_2":staff_2,
   "staff_3":staff_3,
   "staff_4":staff_4,
   "staff_5":staff_5,
   "staff_6":staff_6,
   "staff_7":staff_7,

  }

  localStorage.setItem("values",JSON.stringify(values))

  console.log(values)
  const url = "https://api.frankfurter.app/latest?amount="+all_amount+"&from=TRY&to=USD"

  $.ajax({url: url, async:false, success: function(result){

      if( old_amount < all_amount || old_amount == all_amount){
        Swal.fire({
          title: "Total Amount, increased",
          html: "<b>USD: </b>"+ result.rates.USD + "<br><b>TRY: </b>" +  parseFloat(result.amount),
          icon: "success",
          button: "Kapat",
        })
      } else {
        Swal.fire({
          title: "Total Amount, decreased",
          html: "<b>USD: </b>"+ result.rates.USD + "<br><b>TRY: </b>" +  parseFloat(result.amount) + "<br><b>PrevAmount: </b>" + old_amount,
          icon: "warning",
          button: "Kapat",
        })
      }
      addDayDate(result.amount, result.rates.USD)
  }});

  get()
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

// Global değişkenler (Geçişleri yönetmek için)
let currentPortfolioData = [];
let portfolioGrandTotal = 0;

async function showPortfolioSlider() {
    const fonBilgisi = JSON.parse(localStorage.getItem('fon_bilgisi') || '{}');
    const symbols = Object.keys(fonBilgisi);

    if (symbols.length === 0) {
        Swal.fire({ title: 'Hata', text: 'Fon bulunamadı.', icon: 'error', background: '#0b0f19', color: '#fff' });
        return;
    }

    Swal.fire({
        title: 'Veriler Güncelleniyor...',
        background: '#0b0f19',
        color: '#fff',
        didOpen: () => { Swal.showLoading(); }
    });

    currentPortfolioData = [];
    portfolioGrandTotal = 0;
    const now = Math.floor(Date.now() / 1000);

    // Veri toplama aşaması
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

                currentPortfolioData.push({
                    symbol, amount, lastPrice, change, totalVal, updateDate
                });
            }
        } catch (e) { console.error(e); }
    }

    renderPortfolioContent('slider'); // İlk açılış slider olsun
}

function renderPortfolioContent(viewType) {
    const formattedTotal = portfolioGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    
    let contentHtml = '';

    if (viewType === 'slider') {
        let cardsHtml = currentPortfolioData.map(item => {
            const colorClass = item.change >= 0 ? 'text-accent-teal' : 'text-loss-red';
            const arrow = item.change >= 0 ? '▲' : '▼';
            return `
                <div class="p-5 bg-card-dark rounded-3xl border border-white/5 text-left min-w-[260px] m-2 shadow-2xl flex-shrink-0">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-black text-white">${item.symbol}</h3>
                        <div class="text-right">
                            <span class="${colorClass} font-bold text-sm">${arrow} %${Math.abs(item.change)}</span>
                            <p class="text-[10px] text-text-muted">Son: ${item.updateDate}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-between">
                        <div><p class="text-text-muted text-[10px] font-bold">ADET</p><p class="text-white">${item.amount}</p></div>
                        <div class="text-right"><p class="text-text-muted text-[10px] font-bold">DEĞER</p><p class="text-white font-bold">₺${item.totalVal.toLocaleString('tr-TR')}</p></div>
                    </div>
                </div>`;
        }).join('');

        contentHtml = `
            <div id="slider-container" class="flex overflow-x-auto pb-4 no-scrollbar" style="scroll-snap-type: x mandatory;">${cardsHtml}</div>
            <button onclick="renderPortfolioContent('table')" class="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold transition-all border border-white/10">📊 Tablo Görünümüne Geç</button>
        `;
    } else {
        let rowsHtml = currentPortfolioData.map(item => `
            <tr class="border-b border-white/5 text-xs">
                <td class="py-3 font-bold text-white text-left">${item.symbol}</td>
                <td class="py-3 text-right">${item.amount}</td>
                <td class="py-3 text-right font-bold text-accent-teal">₺${item.totalVal.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                <td class="py-3 text-right ${item.change >= 0 ? 'text-accent-teal' : 'text-loss-red'}">%${item.change}</td>
            </tr>
        `).join('');

        contentHtml = `
            <div class="max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                <table class="w-full text-text-muted">
                    <thead><tr class="text-[10px] uppercase tracking-widest border-b border-white/10"><th class="pb-2 text-left">Fon</th><th class="pb-2 text-right">Adet</th><th class="pb-2 text-right">Toplam</th><th class="pb-2 text-right">Değişim</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            <button onclick="renderPortfolioContent('slider')" class="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold transition-all border border-white/10">🎴 Kart Görünümüne Geç</button>
        `;
    }

    Swal.fire({
        background: '#0b0f19',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        customClass: { popup: 'rounded-[2rem] border border-white/10' },
        html: `
            <div class="text-center mb-6">
                <p class="text-text-muted text-xs font-bold tracking-widest uppercase mb-1">Toplam Portföy</p>
                <h2 class="text-4xl font-black text-white">₺${formattedTotal}</h2>
            </div>
            ${contentHtml}
        `
    });
}


