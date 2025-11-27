function barGraph() {
    // Div'i temizle
    let container = document.getElementById('chartContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'barChartContainer';
        document.getElementById('chartContainer').insertAdjacentElement('afterend', container);
    }
    container.innerHTML = '';
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.justifyContent = "flex-start";
    container.style.alignItems = "flex-start";
    container.style.width = "100%";
    container.style.minHeight = "50px";
    container.style.boxSizing = "border-box";
    container.style.marginTop = "16px";

    // LocalStorage
    const rawLabels = localStorage.getItem('labels');
    const rawValues = localStorage.getItem('values');
    if (!rawLabels || !rawValues) {
        container.innerHTML = '<p style="color:#b71c1c;font-family:Inter,sans-serif;font-size:13px;">Grafik için gerekli veriler yok.</p>';
        return;
    }

    let labelsObj, valuesObj;
    try {
        labelsObj = JSON.parse(rawLabels);
        valuesObj = JSON.parse(rawValues);
    } catch (e) {
        container.innerHTML = '<p style="color:#b71c1c;font-family:Inter,sans-serif;font-size:13px;">labels/values formatı hatalı.</p>';
        return;
    }

    // Veri hazırlama
    const borc_bilgisi = "debit_total_percent";
    const total_borc = localStorage.getItem(borc_bilgisi);
    

    const data = [];
    let toplam = 0;
    if (total_borc){
        toplam = toplam - total_borc
    }
    for (let i = 1; i <= 7; i++) {
        const label = labelsObj['label_' + i];
        const val = valuesObj['staff_' + i];
        if (label && label.trim() && val !== undefined && val !== null && label !== "") {
            toplam = toplam + val;
            data.push({
                label,
                value: +val
            });
        }
    }
    if (data.length === 0) {
        container.innerHTML = '<p style="color:#b71c1c;font-family:Inter,sans-serif;font-size:13px;">Bar grafik için veri yok.</p>';
        return;
    }

    // Responsive genişlik
    const width = container.offsetWidth > 0 ? container.offsetWidth : 400;
    // Bar arası yükseklik ve svg yüksekliği ayarlanıyor (barlar arası boşluk için padding: 0.36)
    const barHeight = 19;
    const barPadding = 11;
    const height = data.length * (barHeight + barPadding) + 48;

    // Daha sola yaklaşmak için margin.left küçültüldü
    const margin = {
        top: 28,
        right: 18,
        bottom: 28,
        left: 95
    };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .style("display", "block")
        .style("max-width", "100%")
        .style("height", height + "px")
        .append("g")
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Renk
    const color = d => d.value >= 0 ? "#388e3c" : "#e53935";
    // Scale
    const xExtent = [Math.min(0, d3.min(data, d => d.value)), d3.max(data, d => d.value)];
    const x = d3.scaleLinear().domain(xExtent).range([0, w]).nice();
    const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, h]).padding(0.36);

    // Izgara (görünürlük için hafif)
    svg.append("g")
        .attr("stroke", "#f1f1f1")
        .attr("stroke-width", 1)
        .call(
            d3.axisBottom(x)
            .tickSize(h)
            .tickFormat("")
        )
        .attr("transform", `translate(0,0)`);

    // Barlar
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', d => y(d.label))
        .attr('height', y.bandwidth())
        .attr('x', d => x(Math.min(0, d.value)))
        .attr('width', d => Math.abs(x(d.value) - x(0)))
        .attr('fill', color)
        .style("filter", "drop-shadow(0 1px 4px rgba(0,0,0,0.09))");

    // Label'lar (küçük font, en sola)
    svg.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('x', -12)
        .attr('y', d => y(d.label) + y.bandwidth() / 2 + 3)
        .attr('text-anchor', 'end')
        .text(d => d.label)
        .style('font-family', 'Inter,sans-serif')
        .style('font-size', '10px')
        .style('fill', '#f2f2f2')
        .style('font-weight', 500);

    // Bar değerleri (küçük font)
    svg.selectAll(".valLabel")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => d.value >= 0 ? x(d.value) + 7 : x(d.value) + 100)
        .attr("y", d => y(d.label) + y.bandwidth() / 2 + 3)
        .attr("text-anchor", d => d.value >= 0 ? "start" : "end")
        .text(d => d.value.toLocaleString('tr-TR'))
        .style("font-family", "Inter,sans-serif")
        .style("font-size", "10px")
        .style("font-weight", 500)
        .style("fill", d => d.value >= 0 ? "#388e3c" : "#e53935");

    // X Axis değeri
    svg.append('g')
        .attr('transform', `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => d.toLocaleString('tr-TR')))
        .selectAll("text")
        .style("font-family", "Inter,sans-serif")
        .style("font-size", "10px")
        .style("fill", "#f2f2f2");

    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(() => ""))
        .selectAll("text").remove();

    // Başlık
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", -13)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#fff")
        .style("font-family", "Inter, sans-serif")
        .text("Portföy Dağılımı - Toplam: " + toplam);
}