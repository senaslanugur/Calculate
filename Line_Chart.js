function graph(){

if(localStorage.getItem("labels") === null){
	const labels = {
	 "label_1":"label_1",
	 "label_2":"label_2",
	 "label_3":"label_3",
	 "label_4":"label_4",
	 "label_5":"label_5",
	 "label_6":"label_6",
	}
	localStorage.setItem("labels",JSON.stringify(labels))
	graph()
}else{

	var values = JSON.parse(localStorage.getItem("values"))
	var labels = JSON.parse(localStorage.getItem("labels"))
	var chart = new CanvasJS.Chart("chartContainer", {
		theme: "light2", // "light1", "light2", "dark1", "dark2"
		exportEnabled: true,
		animationEnabled: true,
		explodeOnClick: true,
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
			click: function(){
				Swal.fire({
				  title: "Staff Label Settings",
				  html: '<input type="text" class="form-control item" id="label-1" placeholder="Label-1">'+
								'<input type="text" class="form-control item" id="label-2" placeholder="Label-2">'+
								'<input type="text" class="form-control item" id="label-3" placeholder="Label-3">'+
								'<input type="text" class="form-control item" id="label-4" placeholder="Label-4">'+
								'<input type="text" class="form-control item" id="label-5" placeholder="Label-5">'+
								'<input type="text" class="form-control item" id="label-6" placeholder="Label-6">',
				  confirmButtonText: "<b>Save</b>",
				}).then((result) => {

						var label_1 = document.getElementById("label-1").value
						var label_2 = document.getElementById("label-2").value
						var label_3 = document.getElementById("label-3").value
						var label_4 = document.getElementById("label-4").value
						var label_5 = document.getElementById("label-5").value
						var label_6 = document.getElementById("label-6").value

						const labels = {
						 "label_1":label_1,
						 "label_2":label_2,
						 "label_3":label_3,
						 "label_4":label_4,
						 "label_5":label_5,
						 "label_6":label_6,
						}
						if(label_1===""){
								Swal.fire({
									title:"Closing"
								})
						}else{
							localStorage.setItem("labels",JSON.stringify(labels))
							graph()
						}

				})
	  	},
			type: "doughnut",
			startAngle: 180,
			toolTipContent: "<b>{label}</b>: {y}%",
			showInLegend: "true",
			legendText: "{label}",
			indexLabelFontSize: 11,
			indexLabel: "{label} - {y}%",
			dataPoints: [
				{ y: values.staff_1, label: labels.label_1 },
				{ y: values.staff_2, label: labels.label_2 },
				{ y: values.staff_3, label: labels.label_3 },
				{ y: values.staff_4, label: labels.label_4 },
				{ y: values.staff_5, label: labels.label_5 },
				{ y: values.staff_6, label: labels.label_6 }
			]
		}]
	});
	chart.render();
}
}
