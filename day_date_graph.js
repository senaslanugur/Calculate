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

    // Veriyi tarihe göre sırala (bisector için gerekli) - ascending for scales
    data.sort((a, b) => a.date - b.date);

    // Boyutlar
    const container = document.getElementById('chartContainer');
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 370;
    const margin = {
        top: 40,
        right: 40,
        bottom: 80,
        left: 60
    };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Temizle (önceki tooltipleri vs. kaldır)
    d3.select("#chartContainer").selectAll("*").remove();
    d3.selectAll(".tooltip").remove();

    // --- Stil ekle: max-row ve pulse animasyonu (hafif, rahatsız etmeyecek) ---
    const styleId = 'chartContainer-custom-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Maksimum satır vurgusu */
            #dataTable tbody tr.max-row td {
                background: linear-gradient(90deg, rgba(255,213,79,0.06), rgba(255,213,79,0.02));
                color: #fff;
                font-weight: 700;
                border-left: 4px solid rgba(255,213,79,0.9);
            }
            /* Hafif pulse (düşük opaklık, yavaş) */
            @keyframes subtlePulse {
                0% { box-shadow: 0 0 0 0 rgba(255,213,79,0.00); }
                50% { box-shadow: 0 0 12px 4px rgba(255,213,79,0.08); }
                100% { box-shadow: 0 0 0 0 rgba(255,213,79,0.00); }
            }
            #dataTable tbody tr.max-row {
                animation: subtlePulse 2.5s ease-in-out infinite;
            }
            /* Küçük responsive iyileştirmeler */
            #dataTable { border-collapse: collapse; }
            #dataTable thead th { padding: 6px 8px; font-weight:700; color:#ddd; border-bottom:1px solid rgba(255,255,255,0.06); }
            #dataTable tbody td { border-bottom: 1px solid rgba(255,255,255,0.03); }
        `;
        document.head.appendChild(style);
    }

    // Kontroller: nokta göster/gizle ve tarih seçimleri (sadece datepicker)
    const controlDiv = d3.select("#chartContainer")
        .append("div")
        .style("display", "flex")
        .style("justify-content", "flex-end")
        .style("align-items", "center")
        .style("margin", "6px 0")
        .style("gap", "12px");

    // Nokta toggle
    controlDiv.append("input")
        .attr("type", "checkbox")
        .attr("id", "toggleDots")
        .property("checked", true)
        .on("change", function () {
            const show = d3.select(this).property("checked");
            d3.select("#chartContainer").selectAll(".dot").style("display", show ? null : "none");
        });

    controlDiv.append("label")
        .attr("for", "toggleDots")
        .style("margin-left", "8px")
        .style("color", "#f2f2f2")
        .style("font-family", "Inter, sans-serif")
        .style("font-size", "13px")
        .text("Noktalar");

    // Yardımcı: tarihi yyyy-mm-dd şeklinde döndürür (input[type=date] uyumlu)
    function formatDateISO(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatDateDisplay(d) {
        return d.toLocaleDateString('tr-TR');
    }

    // Datepicker (input[type=date])
    const datePicker = controlDiv.append("input")
        .attr("type", "date")
        .attr("id", "datePicker")
        .style("padding", "6px 8px")
        .style("border-radius", "6px")
        .style("border", "1px solid rgba(255,255,255,0.12)")
        .style("background", "#0b1116")
        .style("color", "#fff");

    // Display alanı: seçilen tarihin değerlerini gösterecek
    const displayDiv = d3.select("#chartContainer")
        .append("div")
        .attr("id", "dateValueDisplay")
        .style("margin-top", "6px")
        .style("color", "#f2f2f2")
        .style("font-family", "Inter, sans-serif")
        .style("font-size", "14px")
        .style("padding", "8px 12px")
        .style("border-radius", "8px")
        .style("background", "rgba(16,25,36,0.8)")
        .style("display", "inline-block");

    // Varsayılan olarak son tarihi seç
    if (data.length > 0) {
        const lastIso = formatDateISO(data[data.length - 1].date);
        datePicker.property("value", lastIso);
    }

    // Seçilen tarihe göre veriyi bulan fonksiyon
    function getDataByISO(isoStr) {
        return data.find(dd => formatDateISO(dd.date) === isoStr);
    }

    // USD alanı farklı isimlerde olabilir; uygun alanı kontrol et
    function extractUsdValue(datum) {
        if (!datum) return null;
        return datum.usd ?? datum.usd_value ?? datum.dollar ?? datum.usd_price ?? datum.dolar ?? null;
    }

    // Y ekseni aralığını veriye göre akıllıca ayarla
    const minValue = d3.min(data, d => d.turkish_lira);
    const maxValue = d3.max(data, d => d.turkish_lira);
    const padding = (maxValue - minValue) * 0.2;
    const yMin = Math.max(0, minValue - padding);
    const yMax = maxValue + padding;

    // X ve Y ölçekler
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, plotWidth]);

    const y = d3.scaleLinear()
        .domain([yMin, yMax])
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

    // Izgara çizgileri
    svg.append("g")
        .attr("class", "grid")
        .attr("stroke", "#eeeeee")
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1)
        .call(d3.axisLeft(y)
            .ticks(6)
            .tickSize(-plotWidth)
            .tickFormat("")
        );

    // X ekseni
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).ticks(Math.min(7, data.length)));

    xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "13px")
        .style("fill", "#f2f2f2")
        .style("font-weight", 500);

    xAxis.select(".domain").remove();

    // Y ekseni (TL formatında)
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(6)
            .tickFormat(d => d.toLocaleString("tr-TR") + " ₺"))
        .selectAll("text")
        .style("font-size", "13px")
        .style("fill", "#f2f2f2")
        .style("font-weight", 500);

    svg.select(".domain").remove();

    // Çizgi fonksiyonu (orijinal x ile)
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.turkish_lira))
        .curve(d3.curveMonotoneX);

    // --- Çizgiyi değişkene bağla (class ile) ---
    const linePath = svg.append("path")
        .datum(data)
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", "#1565c0")
        .attr("stroke-width", 3)
        .attr("d", line)
        .style("shape-rendering", "geometricPrecision");

    // Maksimum değeri bul (tüm veri için)
    const maxDatum = data.reduce((max, d) => (d.turkish_lira > max.turkish_lira ? d : max), data[0]);

    // Noktalar (MAX hariç)
    const normalDotsData = data.filter(d => d !== maxDatum);

    // Noktaları değişkenlere bağla
    const dots = svg.selectAll(".dot")
        .data(normalDotsData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.turkish_lira))
        .attr("r", 4)
        .attr("fill", "#ff7043")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0)
        .style("filter", "drop-shadow(0 2.5px 5px rgba(0,0,0,0.13))");

    // Maksimum nokta ve etiket
    const maxDot = svg.append("circle")
        .attr("class", "max-dot")
        .attr("cx", x(maxDatum.date))
        .attr("cy", y(maxDatum.turkish_lira))
        .attr("r", 6)
        .attr("fill", "#e53935")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))");

    const maxLabel = svg.append("text")
        .attr("x", x(maxDatum.date))
        .attr("y", y(maxDatum.turkish_lira) - 12)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#ffdddd")
        .style("font-family", "Inter, sans-serif")
        .style("font-weight", "600")
        .text(maxDatum.turkish_lira.toLocaleString('tr-TR') + " ₺");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#101924")
        .style("color", "#fff")
        .style("padding", "10px 16px")
        .style("border-radius", "8px")
        .style("font-size", "15px")
        .style("font-family", "Inter, sans-serif")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 6px 18px rgba(0,0,0,0.18)")
        .style("z-index", "9999");

    // Fare etkileşimi (overlay)
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
            if (!d) return;
            tooltip
                .html(`
        <span style="color:#ffa726"><b>Tarih:</b></span> ${d.date.toLocaleDateString('tr-TR')}<br>
        <span style="color:#ffee58"><b>Değer:</b></span> ${d.turkish_lira.toLocaleString('tr-TR')} ₺
    `)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 36) + "px");
        });

    // Başlık
    svg.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "17px")
        .style("font-weight", "700")
        .style("fill", "#fff")
        .style("font-family", "Inter, sans-serif")
        .text("Günlük Türk Lirası Değeri");

    // % DEĞİŞİM GÖSTERGESİ
    const first = data[0];
    const last = data[data.length - 1];
    const change = ((last.turkish_lira - first.turkish_lira) / first.turkish_lira) * 100;
    const changeText = change.toFixed(2).replace('.', ',') + "%";
    const up = change >= 0;
    const indicatorColor = up ? "#43a047" : "#e53935";
    const arrow = up ? "▲" : "▼";
    const kar_zarar = document.getElementById('kar_zarar');
    svg.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", 2)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-family", "Inter, sans-serif")
        .style("font-weight", "bold")
        .style("fill", indicatorColor)
        .text(`${arrow} ${changeText}`);

    if (kar_zarar) {
        if (up) {
            kar_zarar.classList.remove("text-red-500");
            kar_zarar.classList.add("text-green-500");
        } else {
            kar_zarar.classList.add("text-red-500");
            kar_zarar.classList.remove("text-green-500");
        }
        kar_zarar.innerHTML = arrow + changeText;
    }

    // GÜNLÜK % DEĞİŞİM (son iki turkish_lira üzerinden)
    if (data.length >= 2) {
        const prevDatum = data[data.length - 2];
        const prevVal = Number(prevDatum.turkish_lira);
        const todayVal = Number(last.turkish_lira);

        const gunlukElem = document.getElementById('gunluk_kar_zarar');
        const gunlukElem_amount = document.getElementById('gunluk_kar_zarar_amount');

        if (!isNaN(prevVal) && prevVal !== 0 && !isNaN(todayVal)) {
            const dailyChange = ((todayVal - prevVal) / prevVal) * 100;
            if (gunlukElem_amount) {
                gunlukElem_amount.innerHTML = (todayVal - prevVal).toFixed(2).replace('.', ',') + '₺';
            }
            const dailyText = dailyChange.toFixed(2).replace('.', ',') + '%';
            const dailyUp = dailyChange >= 0;

            if (gunlukElem) {
                gunlukElem.classList.remove("text-green-500", "text-red-500");
                if (dailyUp) {
                    gunlukElem.classList.add("text-green-500");
                } else {
                    gunlukElem.classList.add("text-red-500");
                }
                gunlukElem.innerHTML = `${dailyUp ? "▲" : "▼"}${dailyText}`;
            }
        } else {
            if (gunlukElem) {
                gunlukElem.classList.remove("text-green-500", "text-red-500");
                gunlukElem.innerHTML = '—';
            }
        }
    } else {
        const gunlukElem = document.getElementById('gunluk_kar_zarar');
        if (gunlukElem) {
            gunlukElem.classList.remove("text-green-500", "text-red-500");
            gunlukElem.innerHTML = '—';
        }
    }

    // Eksen etiketleri
    svg.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + 65)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#f2f2f2")
        .style("font-family", "Inter, sans-serif")
        .text("Tarih");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#f2f2f2")
        .style("font-family", "Inter, sans-serif")
        .text("Türk Lirası (₺)");

    // --- TABLO OLUŞTURMA (sayfada yoksa) ---
    if (!document.getElementById('dataTable')) {
        const tableHtml = `
            <table id="dataTable" style="width:100%;margin-top:10px;color:#f2f2f2;font-family:Inter, sans-serif;">
                <thead><tr><th style="text-align:left">Tarih</th><th style="text-align:right">TL</th><th style="text-align:right">USD</th></tr></thead>
                <tbody></tbody>
            </table>`;
        d3.select("#chartContainer").append("div").html(tableHtml);
    }

    // Tablo güncelleme fonksiyonu - tarih en üstte (yeniden sıralama: newest first) ve maksimum satırı vurgula
    function updateTable(filteredData) {
        // Ensure we show newest date at top: sort descending by date
        const sortedDesc = filteredData.slice().sort((a, b) => b.date - a.date);

        // Determine maximum by turkish_lira within filteredData (if any)
        let maxInFiltered = null;
        if (filteredData.length > 0) {
            maxInFiltered = filteredData.reduce((m, d) => (Number(d.turkish_lira) > Number(m.turkish_lira) ? d : m), filteredData[0]);
        }

        const tbody = d3.select('#dataTable tbody');
        const rows = tbody.selectAll('tr').data(sortedDesc, d => d.date.toISOString());
        rows.exit().remove();
        const newRows = rows.enter().append('tr');
        newRows.append('td').style('padding','6px 8px').style('font-size','13px');
        newRows.append('td').style('padding','6px 8px').style('font-size','13px').style('text-align','right');
        newRows.append('td').style('padding','6px 8px').style('font-size','13px').style('text-align','right');
        const all = newRows.merge(rows);

        // Update cell contents
        all.select('td:nth-child(1)').html(d => d.date.toLocaleDateString('tr-TR'));
        all.select('td:nth-child(2)').html(d => (Number(d.turkish_lira).toLocaleString('tr-TR') + ' ₺'));
        all.select('td:nth-child(3)').html(d => {
            const usd = extractUsdValue(d);
            return usd != null ? (Number(usd).toLocaleString('en-US') + ' $') : '—';
        });

        // Remove any previous max-row classes then set on current max (if exists)
        tbody.selectAll('tr').classed('max-row', false);
        if (maxInFiltered) {
            // Find the row corresponding to maxInFiltered and add class
            tbody.selectAll('tr')
                .filter(d => d && d.date && (new Date(d.date)).getTime() === (new Date(maxInFiltered.date)).getTime())
                .classed('max-row', true);
        }
    }

    // --- ZOOM VE TABLO GÜNCELLEME ---
    const clipId = 'clip-' + Math.random().toString(36).slice(2);
    svg.append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    // apply clip to path and dots so they don't overflow
    linePath.attr("clip-path", `url(#${clipId})`);
    svg.selectAll('.dot').attr("clip-path", `url(#${clipId})`);
    maxDot.attr("clip-path", `url(#${clipId})`);

    const zoom = d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[0, 0], [plotWidth, plotHeight]])
        .extent([[0, 0], [plotWidth, plotHeight]])
        .on("zoom", zoomed);

    // attach zoom to an overlay rect on top of plot area
    svg.append("rect")
        .attr("class", "zoom-pane")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .style("cursor", "move")
        .attr("transform", "translate(0,0)")
        .call(zoom);

    // showValuesForISO artık xScale parametresi alıyor (rescale edilmiş x ile çalışmak için)
    function showValuesForISO(isoStr, svgRef, xScale, yScale) {
        const found = getDataByISO(isoStr);
        if (!found) {
            displayDiv.html(`<span style="color:#ffa726">Seçilen tarihte veri yok</span>`);
            d3.select("#chartContainer").selectAll(".selected-dot").remove();
            return;
        }
        const tl = found.turkish_lira ?? found.tl ?? found.turkish ?? null;
        const usd = extractUsdValue(found);

        const tlText = tl != null ? (Number(tl).toLocaleString('tr-TR') + ' ₺') : 'TL bilgisi yok';
        const usdText = usd != null ? (Number(usd).toLocaleString('en-US') + ' $') : 'USD bilgisi yok';

        displayDiv.html(`<b>${formatDateDisplay(found.date)}</b><br><span style="color:#ffee58">TL:</span> ${tlText} &nbsp; <span style="color:#90caf9">USD:</span> ${usdText}`);

        // Grafikte vurgulama: önce kaldır, sonra ekle
        d3.select("#chartContainer").selectAll(".selected-dot").remove();
        const svgSelection = svgRef.append("g").attr("class", "selected-dot");
        svgSelection.append("circle")
            .attr("cx", xScale(found.date))
            .attr("cy", yScale(found.turkish_lira))
            .attr("r", 7)
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))");
        svgSelection.append("circle")
            .attr("cx", xScale(found.date))
            .attr("cy", yScale(found.turkish_lira))
            .attr("r", 4)
            .attr("fill", "#ffd54f")
            .attr("stroke", "transparent");
    }

    function zoomed(event) {
        const t = event.transform;
        const rescaleX = t.rescaleX(x);

        // update x axis
        xAxis.call(d3.axisBottom(rescaleX).ticks(Math.min(7, data.length)));
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .style("font-size", "13px")
            .style("fill", "#f2f2f2")
            .style("font-weight", 500);

        // update line path with new x accessor
        const newLine = d3.line()
            .x(d => rescaleX(d.date))
            .y(d => y(d.turkish_lira))
            .curve(d3.curveMonotoneX);

        linePath.attr("d", newLine(data));

        // update dots positions
        svg.selectAll(".dot").attr("cx", d => rescaleX(d.date)).attr("cy", d => y(d.turkish_lira));

        // update max dot and label
        maxDot.attr("cx", rescaleX(maxDatum.date)).attr("cy", y(maxDatum.turkish_lira));
        maxLabel.attr("x", rescaleX(maxDatum.date)).attr("y", y(maxDatum.turkish_lira) - 12);

        // remove and re-add selected-dot to avoid stale positions
        d3.select("#chartContainer").selectAll(".selected-dot").remove();
        const currentIso = datePicker.property("value");
        if (currentIso) {
            showValuesForISO(currentIso, svg, rescaleX, y);
        }

        // Determine visible domain and update table
        const visibleDomain = rescaleX.domain(); // [minDate, maxDate]
        const filtered = data.filter(d => d.date >= visibleDomain[0] && d.date <= visibleDomain[1]);
        // UpdateTable now expects newest first; updateTable will sort descending internally and highlight max
        updateTable(filtered);

        // Optionally update datePicker to newest visible date (tarih en üstte olacak şekilde)
        if (filtered.length > 0) {
            // newest is max date in filtered
            const newest = filtered.reduce((a,b) => (a.date > b.date ? a : b));
            const newestIso = formatDateISO(newest.date);
            datePicker.property("value", newestIso);
            // update displayDiv as well
            showValuesForISO(newestIso, svg, rescaleX, y);
        }
    }

    // Datepicker event: grafikteki svg ve ölçekler hazır olduğu için burada çağrılabilir
    datePicker.on("change", function () {
        const val = this.value;
        if (!val) return;
        // show with current x scale (no zoom => original x)
        showValuesForISO(val, svg, x, y);
    });

    // İlk tablo doldurma (tam veriyle) - tabloyu newest-first gösterecek şekilde çağır
    updateTable(data);

    // İlk gösterimi yap
    if (data.length > 0) {
        const initialISO = formatDateISO(data[data.length - 1].date);
        showValuesForISO(initialISO, svg, x, y);
    } else {
        displayDiv.html('Veri yok');
    }
}
