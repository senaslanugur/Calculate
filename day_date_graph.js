function lineGraph(){
    const data = JSON.parse(localStorage.getItem("day_data_set")) || [];

    const dataPointsTL = [];
    const dataPointsUSD = [];

    data.forEach(entry => {
        const date = new Date(entry.date);
        dataPointsTL.push({ x: date, y: entry.turkish_lira });
       // dataPointsUSD.push({ x: date, y: entry.dolar*10 });
    });

    const chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2", // Gölgeli tema, daha yumuşak bir görünüm sağlar
        title: {
            text: "Türk Lirası ve Dolar Değerleri",
            fontSize: 24
        },
        axisX: {
            title: "Tarihler",
            valueFormatString: "DD MMM YYYY", // Daha okunabilir tarih formatı
            interval: 1,     // Günlük aralık
            intervalType: "day",
            gridThickness: 1 // Şebeke çizgisi kalınlığı
        },
        axisY: {
            title: "Değer",
            suffix: " TL-$",
            includeZero: true,
            gridThickness: 1 // Şebeke çizgisi kalınlığı
        },
        data: [{
            type: "line",
            name: "Türk Lirası",
            showInLegend: true,
            markerSize: 5,
            dataPoints: dataPointsTL,
            color: "#FF5733", // Renk seçimi
            lineThickness: 2 // Çizgi kalınlığı
        }
       // {
          //  type: "line",
          //  name: "Dolar",
          //  showInLegend: true,
          //  markerSize: 5,
          //  dataPoints: dataPointsUSD,
           // color: "#33C3FF", // Renk seçimi
           // lineThickness: 2 // Çizgi kalınlığı
        //}
          ]
    });

    chart.render();

}
