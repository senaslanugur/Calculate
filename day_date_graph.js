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

    // Helper: önceki tarihli kaydı bul (tam veri kümesinde)
    function getPreviousDatum(currentDate) {
        let prev = null;
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (d.date < currentDate) {
                if (!prev || d.date > prev.date) prev = d;
            }
        }
        return prev;
    }

    // Helper: verilen dizi içinde numeric olarak en büyük turkish_lira değerine sahip datum'u döndür
    function findMaxByTL(arr) {
        if (!arr || arr.length === 0) return null;
        let max = null;
        for (let i = 0; i < arr.length; i++) {
            const d = arr[i];
            const val = Number(d.turkish_lira);
            if (!isFinite(val)) continue;
            if (!max || Number(max.turkish_lira) < val) {
                max = d;
            }
        }
        return max;
    }

    // Boyutlar (container genişliğini al ve SVG'yi container'a sığacak şekilde ayarla)
    const container = document.getElementById('chartContainer');
    const rect = container.getBoundingClientRect();
    // Eğer rect.width 0 ise fallback
    const width = rect.width > 0 ? rect.width : Math.min(window.innerWidth - 32, 900);
    const height = 370;
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Temizle (önceki tooltipleri vs. kaldır)
    d3.select("#chartContainer").selectAll("*").remove();
    d3.selectAll(".tooltip").remove();

    // Stil (popup tablolar için inline stiller eklenir; sayfa içi tablo kaldırıldı)
    const styleId = 'chartContainer-custom-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .change-badge { display:inline-flex; align-items:center; gap:6px; font-size:13px; }
            .change-arrow { font-size:12px; line-height:1; }
            .swal-table { width:100%; border-collapse:collapse; font-family:Inter, sans-serif; color:#f2f2f2; }
            .swal-table thead th { text-align:left; padding:8px; font-weight:700; color:#ddd; border-bottom:1px solid rgba(255,255,255,0.06); }
            .swal-table tbody td { padding:8px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); }
            .swal-table td.right { text-align:right; }
            .swal-max-row td { background: linear-gradient(90deg, rgba(255,213,79,0.06), rgba(255,213,79,0.02)); font-weight:700; border-left:4px solid rgba(255,213,79,0.9); }
            .change-up { color:#43a047; font-weight:600; }
            .change-down { color:#e53935; font-weight:600; }
            .change-neutral { color:#bdbdbd; font-weight:600; }
            .swal-scroll { max-height:420px; overflow:auto; margin-top:8px; }
            /* Buton stili */
            .table-toggle-btn {
                padding: 6px 10px;
                border-radius: 6px;
                background: linear-gradient(180deg,#1f2937,#111827);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.06);
                font-family: Inter, sans-serif;
                font-size: 13px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    // Kontroller: nokta göster/gizle, datepicker ve popup butonu
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

    // Datepicker (input[type=date])
    const datePicker = controlDiv.append("input")
        .attr("type", "date")
        .attr("id", "datePicker")
        .style("padding", "6px 8px")
        .style("border-radius", "6px")
        .style("border", "1px solid rgba(255,255,255,0.12)")
        .style("background", "#0b1116")
        .style("color", "#fff");

    // Popup butonu (sadece popup açar)
    const popupBtn = controlDiv.append("button")
        .attr("type", "button")
        .attr("class", "table-toggle-btn")
        .text("Tablo")
        .on("click", function () {
            const { filtered } = getVisibleFilteredData();
            const html = buildSwalTableHtml(filtered);
            Swal.fire({
                title: 'Tablo',
                html: html,
                width: Math.min(1000, Math.max(700, Math.round(window.innerWidth * 0.9))),
                showCloseButton: true,
                showCancelButton: false,
                confirmButtonText: 'Kapat',
        background:'#1a2131',
        color: '#f1f5f9',
        confirmButtonText: 'TAMAM',
        confirmButtonColor: '#137fec',
        customClass: {
          popup: 'rounded-3xl border border-white/10 shadow-2xl',
          confirmButton: 'rounded-xl px-10 py-3 font-bold tracking-wide'
        },
                didOpen: () => {
                    const scroll = document.querySelector('.swal-scroll');
                    if (scroll) scroll.scrollTop = 0;
                }
            });
        });

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

    // Yardımcı fonksiyonlar
    function formatDateISO(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    function formatDateDisplay(d) {
        return d.toLocaleDateString('tr-TR');
    }
    function getDataByISO(isoStr) {
        return data.find(dd => formatDateISO(dd.date) === isoStr);
    }
    function extractUsdValue(datum) {
        if (!datum) return null;
        return datum.usd ?? datum.usd_value ?? datum.dollar ?? datum.usd_price ?? datum.dolar ?? null;
    }

    // X ve Y ölçekler
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, plotWidth]);

    const y = d3.scaleLinear()
        .domain([Math.max(0, d3.min(data, d => Number(d.turkish_lira)) - (d3.max(data, d => Number(d.turkish_lira)) - d3.min(data, d => Number(d.turkish_lira))) * 0.2),
                 d3.max(data, d => Number(d.turkish_lira)) + (d3.max(data, d => Number(d.turkish_lira)) - d3.min(data, d => Number(d.turkish_lira))) * 0.2])
        .range([plotHeight, 0]);

    // SVG - genişliği container'a göre ayarla (ekrana sığmama sorununu çözmek için)
    const svg = d3.select("#chartContainer")
        .append("svg")
        .attr("width", width) // container genişliğine sabit
        .attr("height", height)
        .style("max-width", "100%") // responsive
        .style("height", "auto")
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
        .call(d3.axisLeft(y).ticks(6).tickSize(-plotWidth).tickFormat(""));

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
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toLocaleString("tr-TR") + " ₺"))
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

    // Çizgiyi değişkene bağla
    const linePath = svg.append("path")
        .datum(data)
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", "#1565c0")
        .attr("stroke-width", 3)
        .attr("d", line)
        .style("shape-rendering", "geometricPrecision");

    // Global maksimum (grafikte ayrıca görünür aralıkta yeniden hesaplanacak)
    let globalMaxDatum = findMaxByTL(data);

    // Noktalar (global max hariç)
    const normalDotsData = data.filter(d => !(globalMaxDatum && d.date.getTime() === globalMaxDatum.date.getTime() && Number(d.turkish_lira) === Number(globalMaxDatum.turkish_lira)));

    // Noktaları çiz
    svg.selectAll(".dot")
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

    // Maksimum nokta ve etiket (başlangıçta global max)
    let maxDot = null;
    let maxLabel = null;
    if (globalMaxDatum) {
        maxDot = svg.append("circle")
            .attr("class", "max-dot")
            .attr("cx", x(globalMaxDatum.date))
            .attr("cy", y(globalMaxDatum.turkish_lira))
            .attr("r", 6)
            .attr("fill", "#e53935")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))");

        maxLabel = svg.append("text")
            .attr("class", "max-label")
            .attr("x", x(globalMaxDatum.date))
            .attr("y", y(globalMaxDatum.turkish_lira) - 12)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#ffdddd")
            .style("font-family", "Inter, sans-serif")
            .style("font-weight", "600")
            .text(Number(globalMaxDatum.turkish_lira).toLocaleString('tr-TR') + " ₺");
    }

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
        <span style="color:#ffee58"><b>Değer:</b></span> ${Number(d.turkish_lira).toLocaleString('tr-TR')} ₺
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
    const change = ((Number(last.turkish_lira) - Number(first.turkish_lira)) / Number(first.turkish_lira)) * 100;
    const changeText = isFinite(change) ? change.toFixed(2).replace('.', ',') + "%" : '—';
    const up = isFinite(change) ? change >= 0 : true;
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

    // --- ZOOM (sadece yatay) ---
    const clipId = 'clip-' + Math.random().toString(36).slice(2);
    svg.append("clipPath").attr("id", clipId).append("rect").attr("width", plotWidth).attr("height", plotHeight);
    linePath.attr("clip-path", `url(#${clipId})`);
    svg.selectAll('.dot').attr("clip-path", `url(#${clipId})`);
    if (maxDot) maxDot.attr("clip-path", `url(#${clipId})`);

    const zoom = d3.zoom()
        .scaleExtent([1, 50])
        .translateExtent([[0, 0], [plotWidth, plotHeight]])
        .extent([[0, 0], [plotWidth, plotHeight]])
        .on("zoom", zoomed);

    svg.append("rect")
        .attr("class", "zoom-pane")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .style("cursor", "move")
        .attr("transform", "translate(0,0)")
        .call(zoom);

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

        // Determine visible domain and recompute visible max
        const visibleDomain = rescaleX.domain();
        const filtered = data.filter(d => d.date >= visibleDomain[0] && d.date <= visibleDomain[1]);

        const visibleMax = findMaxByTL(filtered);
        if (visibleMax) {
            if (!maxDot) {
                maxDot = svg.append("circle")
                    .attr("class", "max-dot")
                    .attr("r", 6)
                    .attr("fill", "#e53935")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))")
                    .attr("clip-path", `url(#${clipId})`);
            }
            if (!maxLabel) {
                maxLabel = svg.append("text")
                    .attr("class", "max-label")
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("fill", "#ffdddd")
                    .style("font-family", "Inter, sans-serif")
                    .style("font-weight", "600");
            }
            maxDot.attr("cx", rescaleX(visibleMax.date)).attr("cy", y(visibleMax.turkish_lira));
            maxLabel.attr("x", rescaleX(visibleMax.date)).attr("y", y(visibleMax.turkish_lira) - 12)
                .text(Number(visibleMax.turkish_lira).toLocaleString('tr-TR') + " ₺");
        } else {
            if (maxDot) { maxDot.remove(); maxDot = null; }
            if (maxLabel) { maxLabel.remove(); maxLabel = null; }
        }

        // remove and re-add selected-dot to avoid stale positions
        d3.select("#chartContainer").selectAll(".selected-dot").remove();
        const currentIso = datePicker.property("value");
        if (currentIso) {
            showValuesForISO(currentIso, svg, rescaleX, y);
        }

        // Optionally update datePicker to newest visible date and display
        if (filtered.length > 0) {
            const newest = filtered.reduce((a,b) => (a.date > b.date ? a : b));
            const newestIso = formatDateISO(newest.date);
            datePicker.property("value", newestIso);
            showValuesForISO(newestIso, svg, rescaleX, y);
        }
    }

    // Datepicker event
    datePicker.on("change", function () {
        const val = this.value;
        if (!val) return;
        showValuesForISO(val, svg, x, y);
    });

    // İlk gösterimi yap
    if (data.length > 0) {
        const initialISO = formatDateISO(data[data.length - 1].date);
        showValuesForISO(initialISO, svg, x, y);
    } else {
        displayDiv.html('Veri yok');
    }

    // --- Popup tablo için yardımcılar (sadece popup, sayfa içi tablo kaldırıldı) ---
    function getVisibleFilteredData() {
        const zoomPane = svg.select(".zoom-pane").node();
        let transform = d3.zoomTransform(zoomPane);
        const rescaleX = transform.rescaleX(x);
        const domain = rescaleX.domain();
        const filtered = data.filter(d => d.date >= domain[0] && d.date <= domain[1]);
        filtered.sort((a, b) => a.date - b.date);
        return { filtered, rescaleX };
    }

    function buildSwalTableHtml(filteredData) {
        const maxInFiltered = findMaxByTL(filteredData);
        const tableStyle = `
            <style>
                .swal-table { width:100%; border-collapse:collapse; font-family:Inter, sans-serif; color:#f2f2f2; }
                .swal-table thead th { text-align:left; padding:8px; font-weight:700; color:#ddd; border-bottom:1px solid rgba(255,255,255,0.06); }
                .swal-table tbody td { padding:8px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); }
                .swal-table td.right { text-align:right; }
                .swal-max-row td { background: linear-gradient(90deg, rgba(255,213,79,0.06), rgba(255,213,79,0.02)); font-weight:700; border-left:4px solid rgba(255,213,79,0.9); }
                .change-up { color:#43a047; font-weight:600; }
                .change-down { color:#e53935; font-weight:600; }
                .change-neutral { color:#bdbdbd; font-weight:600; }
                .change-badge { display:inline-flex; align-items:center; gap:6px; }
                .change-arrow { font-size:12px; line-height:1; }
                .swal-scroll { max-height:420px; overflow:auto; margin-top:8px; }
            </style>
        `;

        const rows = filteredData.slice().sort((a,b) => b.date - a.date).map(d => {
            const prev = getPreviousDatum(d.date);
            let changeHtml = '—';
            let changeClass = 'change-neutral';
            if (prev && !isNaN(Number(prev.turkish_lira)) && !isNaN(Number(d.turkish_lira))) {
                const prevVal = Number(prev.turkish_lira);
                const curVal = Number(d.turkish_lira);
                if (prevVal !== 0) {
                    const diff = curVal - prevVal;
                    const pct = (diff / prevVal) * 100;
                    const arrow = diff >= 0 ? '▲' : '▼';
                    const cls = diff >= 0 ? 'change-up' : 'change-down';
                    changeHtml = `<span class="change-badge ${diff >= 0 ? 'up' : 'down'}"><span class="change-arrow">${arrow}</span><span>${(pct >= 0 ? '+' : '') + pct.toFixed(2).replace('.', ',')} %</span>&nbsp;<span style="opacity:0.85">(${(diff >= 0 ? '+' : '') + diff.toFixed(2).replace('.', ',')} ₺)</span></span>`;
                    changeClass = cls;
                }
            }
            const isMax = maxInFiltered && (new Date(d.date)).getTime() === (new Date(maxInFiltered.date)).getTime() && Number(d.turkish_lira) === Number(maxInFiltered.turkish_lira);
            return `<tr class="${isMax ? 'swal-max-row' : ''}">
                        <td>${d.date.toLocaleDateString('tr-TR')}</td>
                        <td class="right">${Number(d.turkish_lira).toLocaleString('tr-TR')} ₺</td>
                        <td class="right">${(extractUsdValue(d) != null) ? (Number(extractUsdValue(d)).toLocaleString('en-US') + ' $') : '—'}</td>
                        <td class="right ${changeClass}">${changeHtml}</td>
                    </tr>`;
        }).join('');

        const header = `
            <table class="swal-table">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th class="right">TL</th>
                        <th class="right">USD</th>
                        <th class="right">Değişim (₺ / %)</th>
                    </tr>
                </thead>
            </table>
        `;

        const tableHtml = `
            ${tableStyle}
            <div style="font-family:Inter, sans-serif; color:#fff; font-size:14px;">
                ${header}
                <div class="swal-scroll">
                    <table class="swal-table"><tbody>
                        ${rows || '<tr><td colspan="4" style="padding:8px;color:#bdbdbd">Görünür aralıkta veri yok</td></tr>'}
                    </tbody></table>
                </div>
            </div>
        `;
        return tableHtml;
    }
}
