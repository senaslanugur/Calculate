function graph(){

var values = JSON.parse(localStorage.getItem("values"))
var chart = new CanvasJS.Chart("chartContainer", {
	theme: "light2", // "light1", "light2", "dark1", "dark2"
	exportEnabled: true,
	animationEnabled: true,
	title: {
		text: "Amount Rates",
    fontSize: 20,
	},
  subtitles: [{
    text: "Amount "+localStorage.getItem("all_amount"),
    backgroundColor: "#2eacd1",
    fontSize: 14,
    fontColor: "white",
    padding: 5
  }],
	data: [{
		type: "doughnut",
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
