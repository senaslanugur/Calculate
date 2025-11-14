function lineGraph() {
    // localStorage'dan veri al
    const rawData = localStorage.getItem('day_data_set');
    if (!rawData) {
        Swal.fire({
            icon: 'warning',
            title: 'Veri Yok',
            text: 'Lütfen localStorage\'a "day_data_set" anahtarıyla veri ekleyin.',
            confirmButtonText: 'Tamam'
        });
        return;
    }

    let day_data_set;
    try {
        day_data_set = JSON.parse(rawData);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Hatalı JSON',
            text: 'localStorage\'daki veri geçersiz.',
            confirmButtonText: 'Tamam'
        });
        return;
    }

    const data = day_data_set.map(d => ({
        ...d,
        date: new Date(d.date)
    }));

    // Boyutlar
    const container = document.getElementById('chartContainer');
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 370;
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Temizle
    d3.select("#chartContainer").selectAll("*").remove();

    // Y ekseni aralığını veriye göre akıllıca ayarla
    const minValue = d3.min(data, d => d.turkish_lira);
    const maxValue = d3.max(data, d => d.turkish_lira);

    // Aralık küçükse, alt ve üst boşluk ekleyerek daha net görün
    const padding = (maxValue - minValue) * 0.2; // %20 padding
    const yMin = Math.max(0, minValue - padding); // Negatif olmaz
    const yMax = maxValue + padding;

    // X ve Y ölçekler
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, plotWidth]);

    const y = d3.scaleLinear()
        .domain([yMin, yMax]) // Dinamik aralık
        .range([plotHeight, 0]);

    // SVG
    const svg = d3.select("#chartContainer")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Izgara çizgileri (arka plan)
    svg.append("g")
        .attr("class", "grid")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1)
        .call(d3.axisLeft(y)
            .ticks(6)
            .tickSize(-plotWidth)
            .tickFormat("")
        );

    // X ekseni
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).ticks(Math.min(5, data.length)));

    xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "12px")
        .style("fill", "#555");

    xAxis.select(".domain").remove();

    // Y ekseni (TL formatında)
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(6)
            .tickFormat(d => d.toLocaleString("tr-TR") + " ₺"))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#555");

    svg.select(".domain").remove();

    // Çizgi
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.turkish_lira))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1a73e8")
        .attr("stroke-width", 3)
        .attr("d", line)
        .style("shape-rendering", "geometricPrecision");

        
    // Noktalar
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.turkish_lira))
        .attr("r", 5)
        .attr("fill", "#1a73e8")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.2))");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(30, 30, 30, 0.95)")
        .style("color", "#fff")
        .style("padding", "10px 14px")
        .style("border-radius", "8px")
        .style("font-size", "14px")
        .style("font-family", "Inter, sans-serif")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");

    // Fare etkileşimi
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => tooltip.style("opacity", 1))
        .on("mouseout", () => tooltip.style("opacity", 0))
        .on("mousemove", function (event) {
            const mouseX = d3.pointer(event)[0];
            const bisect = d3.bisector(d => d.date).left;
            const date = x.invert(mouseX);
            const i = bisect(data, date, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            let d = d0;

            if (d1 && (!d0 || Math.abs(date - d0.date) > Math.abs(date - d1.date))) {
                d = d1;
            }

            tooltip
                .html(`
                    <b style="color:#a8d8ea">Tarih:</b> ${d.date.toLocaleDateString('tr-TR')}<br>
                    <b style="color:#ffd966">Değer:</b> ${d.turkish_lira.toLocaleString('tr-TR')} ₺
                `)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 32) + "px");
        });

    // Başlık
    svg.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .style("fill", "#333")
        .style("font-family", "Inter, sans-serif")
        .text("Günlük Türk Lirası Değeri");

    // Eksen etiketleri
    svg.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + 65)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", "#666")
        .style("font-family", "Inter, sans-serif")
        .text("Tarih");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", "#666")
        .style("font-family", "Inter, sans-serif")
        .text("Türk Lirası (₺)");
        
}

