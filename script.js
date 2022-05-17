function calculate(){

  const staff_1 = parseFloat(document.getElementById("staff-1").value);
  const staff_2 = parseFloat(document.getElementById("staff-2").value);
  const staff_3 = parseFloat(document.getElementById("staff-3").value);
  const staff_4 = parseFloat(document.getElementById("staff-4").value);
  const staff_5 = parseFloat(document.getElementById("staff-5").value);
  const staff_6 = parseFloat(document.getElementById("staff-6").value);

  const all_amount = staff_1 + staff_2 + staff_3 + staff_4 + staff_5 + staff_6

  const old_amount = parseFloat(localStorage.getItem("all_amount"))

  localStorage.setItem("all_amount",all_amount)

  const values = {
   "staff_1":staff_1,
   "staff_2":staff_2,
   "staff_3":staff_3,
   "staff_4":staff_4,
   "staff_5":staff_5,
   "staff_6":staff_6,
  }

  localStorage.setItem("values",JSON.stringify(values))

  console.log(values)
  const url = "https://api.frankfurter.app/latest?amount="+all_amount+"&from=TRY&to=USD"

  $.ajax({url: url, async:false, success: function(result){

      if( old_amount < all_amount || old_amount == all_amount){
        swal({
          title: "Total Amount, increased",
          text: "USD: "+ result.rates.USD + " TRY: " + result.amount,
          icon: "success",
          button: "Kapat",
        })
      } else {
        swal({
          title: "Total Amount, decreased",
          text: "USD: "+ result.rates.USD + " TRY: " + result.amount,
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

}
get()


function graph(){

var values = JSON.parse(localStorage.getItem("values"))
var chart = new CanvasJS.Chart("chartContainer", {
	theme: "light2", // "light1", "light2", "dark1", "dark2"
	exportEnabled: true,
	animationEnabled: true,
	title: {
		text: "Last Amount Rates"
	},
	data: [{
		type: "pie",
		startAngle: 180,
		toolTipContent: "<b>{label}</b>: {y}%",
		showInLegend: "true",
		legendText: "{label}",
		indexLabelFontSize: 11,
		indexLabel: "{label} - {y}%",
		dataPoints: [
			{ y: values.staff_1, label: "Staff-1" },
			{ y: values.staff_2, label: "Staff-2" },
			{ y: values.staff_3, label: "Staff-3" },
			{ y: values.staff_4, label: "Staff-4" },
			{ y: values.staff_5, label: "Staff-5" },
			{ y: values.staff_6, label: "Staff-6" }
		]
	}]
});
chart.render();


}
