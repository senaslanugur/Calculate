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

    // Veriyi tarihe göre sırala (bisector için gerekli)
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

    // Seçim değiştiğinde göstergeyi güncelle ve grafikte vurgula
    function showValuesForISO(isoStr, svg, x, y) {
        const found = getDataByISO(isoStr);
        if (!found) {
            displayDiv.html(`<span style="color:#ffa726">Seçilen tarihte veri yok</span>`);
            // vurguyu kaldır
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
        const svgSelection = svg.append("g").attr("class", "selected-dot");
        svgSelection.append("circle")
            .attr("cx", x(found.date))
            .attr("cy", y(found.turkish_lira))
            .attr("r", 7)
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))");
        svgSelection.append("circle")
            .attr("cx", x(found.date))
            .attr("cy", y(found.turkish_lira))
            .attr("r", 4)
            .attr("fill", "#ffd54f")
            .attr("stroke", "transparent");
    }

    // İlk gösterimi yap (grafik çizildikten sonra çağrılacak)
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

    // Çizgi
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.turkish_lira))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1565c0")
        .attr("stroke-width", 3)
        .attr("d", line)
        .style("shape-rendering", "geometricPrecision");

    // Maksimum değeri bul
    const maxDatum = data.reduce((max, d) => (d.turkish_lira > max.turkish_lira ? d : max), data[0]);

    // Noktalar (MAX hariç)
    const normalDotsData = data.filter(d => d !== maxDatum);

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

    // Maksimum nokta
    if (maxDatum) {
        svg.append("circle")
            .attr("class", "max-dot")
            .attr("cx", x(maxDatum.date))
            .attr("cy", y(maxDatum.turkish_lira))
            .attr("r", 6)
            .attr("fill", "#e53935")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.18))");

        svg.append("text")
            .attr("x", x(maxDatum.date))
            .attr("y", y(maxDatum.turkish_lira) - 12)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#ffdddd")
            .style("font-family", "Inter, sans-serif")
            .style("font-weight", "600")
            .text(maxDatum.turkish_lira.toLocaleString('tr-TR') + " ₺");
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

        if (!isNaN(prevVal) && prevVal !== 0 && !isNaN(todayVal)) {
            const dailyChange = ((todayVal - prevVal) / prevVal) * 100;
            const dailyText = dailyChange.toFixed(2).replace('.', ',') + '%';
            const dailyUp = dailyChange >= 0;
            const dailyColor = dailyUp ? "#43a047" : "#e53935";
            const dailyArrow = dailyUp ? "▲" : "▼";

            // DOM elementini güncelle (varsa)
            if (gunlukElem) {
                gunlukElem.classList.remove("text-green-500", "text-red-500");
                if (dailyUp) {
                    gunlukElem.classList.add("text-green-500");
                } else {
                    gunlukElem.classList.add("text-red-500");
                }
                gunlukElem.innerHTML = `${dailyArrow}${dailyText}`;
            }
        } else {

            if (gunlukElem) {
                gunlukElem.classList.remove("text-green-500", "text-red-500");
                gunlukElem.innerHTML = '—';
            }
        }
    } else {
        // Yeterli veri yoksa varsa DOM elemanını temizle
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

    // Datepicker event: grafikteki svg ve ölçekler hazır olduğu için burada çağrılabilir
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
}