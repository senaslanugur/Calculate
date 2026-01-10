function lineGraph() {

    const raw = localStorage.getItem("day_data_set");
    if (!raw) return;

    const data = JSON.parse(raw).map(d => ({
        date: new Date(d.date),
        tl: +d.turkish_lira,
        usd: +(d.usd ?? d.dolar ?? d.usd_value ?? null)
    })).sort((a, b) => a.date - b.date);

    const container = d3.select("#chartContainer");
    container.selectAll("*").remove();

    /* ---------------- HELPERS ---------------- */
    function smartDateFormat(domain) {
        const diffDays = (domain[1] - domain[0]) / (1000 * 60 * 60 * 24);
        if (diffDays <= 14) return d3.timeFormat("%d %b");   // 01 Oca
        if (diffDays <= 90) return d3.timeFormat("%b %Y");  // Oca 2025
        return d3.timeFormat("%Y");                          // 2025
    }

    function hideOverlappingLabels(selection) {
        let lastX = -Infinity;
        selection.each(function () {
            const el = d3.select(this);
            const x = this.getBoundingClientRect().x;
            if (x - lastX < 40) {
                el.style("display", "none");
            } else {
                el.style("display", null);
                lastX = x;
            }
        });
    }

    /* ---------------- DIMENSIONS ---------------- */
    const width = container.node().clientWidth;
    const height = 420;
    const miniHeight = 70;

    const margin = { top: 40, right: 60, bottom: 120, left: 70 };
    const marginMini = { top: height - 80, right: 60, bottom: 30, left: 70 };

    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    /* ---------------- SVG ---------------- */
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "#0b1116");

    const main = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const mini = svg.append("g")
        .attr("transform", `translate(${marginMini.left},${marginMini.top})`);

    /* ---------------- SCALES ---------------- */
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, w]);

    const xMini = d3.scaleTime().domain(x.domain()).range([0, w]);

    const yTL = d3.scaleLinear()
        .domain(d3.extent(data, d => d.tl)).nice()
        .range([h, 0]);

    const yUSD = d3.scaleLinear()
        .domain(d3.extent(data, d => d.usd)).nice()
        .range([h, 0]);

    const yMini = d3.scaleLinear()
        .domain(yTL.domain())
        .range([miniHeight, 0]);

    /* ---------------- WEEKEND BACKGROUND ---------------- */
    main.selectAll(".weekend-bg")
        .data(data.filter(d => d.date.getDay() === 0 || d.date.getDay() === 6))
        .enter()
        .append("rect")
        .attr("class", "weekend-bg")
        .attr("x", d => x(d.date))
        .attr("y", 0)
        .attr("width", w / data.length)
        .attr("height", h)
        .attr("fill", "#ffffff")
        .attr("opacity", 0.035);

    /* ---------------- GRADIENT ---------------- */
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient")
        .attr("id", "areaGrad")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    grad.append("stop").attr("offset", "0%")
        .attr("stop-color", "#42a5f5").attr("stop-opacity", 0.45);
    grad.append("stop").attr("offset", "100%")
        .attr("stop-color", "#42a5f5").attr("stop-opacity", 0);

    /* ---------------- AXES ---------------- */
    const tickCount = Math.max(4, Math.floor(w / 120));

    let xAxis = d3.axisBottom(x)
        .ticks(tickCount)
        .tickFormat(smartDateFormat(x.domain()));

    const xAxisG = main.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${h})`)
        .call(xAxis);

    xAxisG.selectAll("text")
        .style("fill", "#ccc")
        .style("font-size", "12px")
        .style("text-anchor", "end")
        .attr("dx", "-0.6em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-30)");

    hideOverlappingLabels(xAxisG.selectAll("text"));
    xAxisG.select(".domain").remove();

    main.append("g")
        .call(d3.axisLeft(yTL).tickFormat(d => d.toLocaleString("tr-TR") + " ₺"))
        .selectAll("text").style("fill", "#ccc");

    main.append("g")
        .attr("transform", `translate(${w},0)`)
        .call(d3.axisRight(yUSD).tickFormat(d => "$" + d))
        .selectAll("text").style("fill", "#ccc");

    /* ---------------- LINE & AREA ---------------- */
    const lineTL = d3.line()
        .x(d => x(d.date))
        .y(d => yTL(d.tl))
        .curve(d3.curveMonotoneX);

    const areaTL = d3.area()
        .x(d => x(d.date))
        .y0(h)
        .y1(d => yTL(d.tl))
        .curve(d3.curveMonotoneX);

    main.append("path")
        .datum(data)
        .attr("fill", "url(#areaGrad)")
        .attr("d", areaTL);

    const path = main.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1e88e5")
        .attr("stroke-width", 3)
        .attr("d", lineTL);

    /* ---------------- ANIMATION ---------------- */
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len + " " + len)
        .attr("stroke-dashoffset", len)
        .transition().duration(1200)
        .attr("stroke-dashoffset", 0);

    /* ---------------- TOOLTIP ---------------- */
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#101924")
        .style("color", "#fff")
        .style("padding", "10px 14px")
        .style("border-radius", "8px")
        .style("opacity", 0);

    const focus = main.append("g").style("display", "none");
    focus.append("circle").attr("r", 5).attr("fill", "#fff");
    focus.append("line")
        .attr("y1", 0).attr("y2", h)
        .attr("stroke", "#aaa")
        .attr("stroke-dasharray", "4 4");

    const bisect = d3.bisector(d => d.date).left;

    main.append("rect")
        .attr("width", w)
        .attr("height", h)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", (e) => {
            const xm = x.invert(d3.pointer(e)[0]);
            const i = bisect(data, xm, 1);
            const d = data[i] || data[i - 1];
            if (!d) return;

            focus.style("display", null)
                .attr("transform", `translate(${x(d.date)},${yTL(d.tl)})`);

            tooltip.html(`
                <b>${d.date.toLocaleDateString("tr-TR")}</b><br>
                TL: ${d.tl.toLocaleString("tr-TR")} ₺<br>
                USD: ${d.usd ?? "—"}
            `)
                .style("left", e.pageX + 12 + "px")
                .style("top", e.pageY - 30 + "px")
                .style("opacity", 1);
        })
        .on("mouseout", () => {
            focus.style("display", "none");
            tooltip.style("opacity", 0);
        });

    /* ---------------- MINI BRUSH ---------------- */
    const areaMini = d3.area()
        .x(d => xMini(d.date))
        .y0(miniHeight)
        .y1(d => yMini(d.tl));

    mini.append("path")
        .datum(data)
        .attr("fill", "#90caf9")
        .attr("d", areaMini);

    const brush = d3.brushX()
        .extent([[0, 0], [w, miniHeight]])
        .on("brush end", ({ selection }) => {
            if (!selection) return;
            const [x0, x1] = selection.map(xMini.invert);
            x.domain([x0, x1]);

            main.selectAll("path").attr("d", areaTL);

            xAxis.tickFormat(smartDateFormat(x.domain()));
            main.select(".x-axis").call(xAxis);
            hideOverlappingLabels(main.select(".x-axis").selectAll("text"));
        });

    mini.append("g").call(brush);

    /* ---------------- TITLE ---------------- */
    main.append("text")
        .attr("x", w / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "#fff")
        .style("font-weight", "700")
        .text("TL / USD Dinamik Zaman Grafiği");
}
