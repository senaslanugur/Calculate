function calculate(){

  const staff_1 = parseFloat(document.getElementById("staff-1").value);
  const staff_2 = parseFloat(document.getElementById("staff-2").value);
  const staff_3 = parseFloat(document.getElementById("staff-3").value);
  const staff_4 = parseFloat(document.getElementById("staff-4").value);
  const staff_5 = parseFloat(document.getElementById("staff-5").value);
  const staff_6 = parseFloat(document.getElementById("staff-6").value);
  const staff_7 = parseFloat(document.getElementById("staff-7").value);


  const all_amount = staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6 + staff_7

  const old_amount = parseFloat(localStorage.getItem("all_amount"))

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
          html: "<b>USD: </b>"+ result.rates.USD + "<br><b>TRY: </b>" +  parseInt(result.amount),
          icon: "success",
          button: "Kapat",
        })
      } else {
        Swal.fire({
          title: "Total Amount, decreased",
          html: "<b>USD: </b>"+ result.rates.USD + "<br><b>TRY: </b>" +  parseInt(result.amount) + "<br><b>PrevAmount: </b>" + old_amount,
          icon: "warning",
          button: "Kapat",
        })
      }
  }});

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
