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
