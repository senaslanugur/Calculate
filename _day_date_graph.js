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
 [{"date":"2025-10-14","turkish_lira":360.99999999999994,"dolar":8.6351},{"date":"2025-10-15","turkish_lira":447.6,"dolar":10.7008},{"date":"2025-10-16","turkish_lira":466.4,"dolar":11.1438},{"date":"2025-10-17","turkish_lira":475.79999999999995,"dolar":11.3681},{"date":"2025-10-20","turkish_lira":485.6,"dolar":11.5758},{"date":"2025-10-21","turkish_lira":475.5,"dolar":11.3328},{"date":"2025-10-22","turkish_lira":485.70000000000005,"dolar":11.5733},{"date":"2025-10-23","turkish_lira":486.0999999999999,"dolar":11.5714},{"date":"2025-10-24","turkish_lira":483.90000000000003,"dolar":11.5272},{"date":"2025-10-25","turkish_lira":484.59999999999997,"dolar":11.5441},{"date":"2025-10-26","turkish_lira":484.59999999999997,"dolar":11.5441},{"date":"2025-10-27","turkish_lira":490.6,"dolar":11.6871},{"date":"2025-10-28","turkish_lira":492.3,"dolar":11.7437},{"date":"2025-10-30","turkish_lira":492.5,"dolar":11.7413},{"date":"2025-11-03","turkish_lira":482.49999999999994,"dolar":11.4749},{"date":"2025-11-04","turkish_lira":484.6,"dolar":11.5247},{"date":"2025-11-05","turkish_lira":482.5,"dolar":11.4647},{"date":"2025-11-06","turkish_lira":493.4,"dolar":11.7219},{"date":"2025-11-07","turkish_lira":497.4,"dolar":11.8092},{"date":"2025-11-08","turkish_lira":496.5,"dolar":11.7619},{"date":"2025-11-10","turkish_lira":493.99999999999994,"dolar":11.7027},{"date":"2025-11-11","turkish_lira":496.7,"dolar":11.7632},{"date":"2025-11-12","turkish_lira":494.40000000000003,"dolar":11.7058},{"date":"2025-11-13","turkish_lira":495.40000000000003,"dolar":11.7272},{"date":"2025-11-14","turkish_lira":493.09999999999997,"dolar":11.6488},{"date":"2025-11-15","turkish_lira":492.8999999999999,"dolar":11.6442},{"date":"2025-11-17","turkish_lira":495.59999999999997,"dolar":11.7079},{"date":"2025-11-18","turkish_lira":500.2000000000001,"dolar":11.8147},{"date":"2025-11-19","turkish_lira":630.8,"dolar":14.8927},{"date":"2025-11-20","turkish_lira":634.6,"dolar":14.9775},{"date":"2025-11-21","turkish_lira":635.6999999999999,"dolar":14.9774},{"date":"2025-11-22","turkish_lira":635.0999999999999,"dolar":14.9631},{"date":"2025-11-23","turkish_lira":635.0999999999999,"dolar":14.9631},{"date":"2025-11-24","turkish_lira":638.4,"dolar":15.0752},{"date":"2025-11-25","turkish_lira":639,"dolar":15.0895},{"date":"2025-11-26","turkish_lira":643.5999999999999,"dolar":15.1611},{"date":"2025-11-27","turkish_lira":646.8,"dolar":15.2402},{"date":"2025-11-28","turkish_lira":649.7,"dolar":15.2886},{"date":"2025-11-29","turkish_lira":649.7,"dolar":15.2886},{"date":"2025-11-30","turkish_lira":649.7,"dolar":15.2886},{"date":"2025-12-01","turkish_lira":656.73,"dolar":15.4538},{"date":"2025-12-02","turkish_lira":659.03,"dolar":15.5229},{"date":"2025-12-03","turkish_lira":666.13,"dolar":15.7854},{"date":"2025-12-04","turkish_lira":669.53,"dolar":15.7743},{"date":"2025-12-05","turkish_lira":674.23,"dolar":15.8592},{"date":"2025-12-06","turkish_lira":674.8300000000002,"dolar":15.8732},{"date":"2025-12-08","turkish_lira":680.23,"dolar":16.0004},{"date":"2025-12-09","turkish_lira":685.6299999999999,"dolar":16.1072},{"date":"2025-12-10","turkish_lira":688.9000000000001,"dolar":16.1776},{"date":"2025-12-11","turkish_lira":690.2,"dolar":16.1958},{"date":"2025-12-12","turkish_lira":690.1000000000001,"dolar":16.1934},{"date":"2025-12-13","turkish_lira":683,"dolar":16.0443},{"date":"2025-12-15","turkish_lira":685.8999999999999,"dolar":16.0638},{"date":"2025-12-16","turkish_lira":682.0999999999999,"dolar":15.9744},{"date":"2025-12-17","turkish_lira":681.8,"dolar":15.9618},{"date":"2025-12-18","turkish_lira":675.8,"dolar":15.8141},{"date":"2025-12-19","turkish_lira":679.9999999999999,"dolar":15.9125},{"date":"2025-12-20","turkish_lira":685.4999999999999,"dolar":16.0128}]