function init() {
    const rawLabels = localStorage.getItem('labels');
    const rawValues = localStorage.getItem('values');

    if (!rawLabels && !rawValues) {
        console.info('LocalStorage "labels" veya "values" bulunamadı.');
        return;
    }

    const labels = normalizeStoredToArray(rawLabels, 'label');
    const values = normalizeStoredToArray(rawValues, 'staff');

    // Hedef: main içindeki "Assests" / "Assets" başlığını bul
    const headings = Array.from(document.querySelectorAll('main h3'));
    const sectionHeading = headings.find(h => {
        const t = (h.textContent || '').trim().toLowerCase();
        return t.startsWith('assest') || t.startsWith('assets') || t.startsWith('assests');
    }) || headings[0];

    if (!sectionHeading) {
        console.warn('Varlık başlığı bulunamadı.');
        return;
    }

    const sectionRoot = sectionHeading.closest('.flex.flex-col.gap-4') || sectionHeading.parentElement;
    if (!sectionRoot) {
        console.warn('Varlık bölümü rootu bulunamadı.');
        return;
    }

    let itemsContainer = sectionRoot.querySelector('.flex.flex-col.gap-3');
    if (!itemsContainer) {
        // Eğer container yoksa yarat
        itemsContainer = document.createElement('div');
        itemsContainer.className = 'flex flex-col gap-3';
        sectionRoot.appendChild(itemsContainer);
    }

    const existingItems = Array.from(itemsContainer.children).filter(n => n.nodeType === 1);
    const neededCount = Math.max(labels.length, values.length);

    // Eğer mevcut öğe sayısı azsa, klonla (veya tekil template yarat)
    if (existingItems.length < neededCount) {
        let template = existingItems[existingItems.length - 1] || null;

        // Eğer hiç template yoksa, basit bir template oluştur
        if (!template) {
            template = createItemElement('Placeholder', '₺0,00');
        }

        for (let i = existingItems.length; i < neededCount; i++) {
            const clone = template.cloneNode(true);
            itemsContainer.appendChild(clone);
            existingItems.push(clone);
        }
    }

    // Güncelle
    for (let i = 0; i < neededCount; i++) {
        const item = existingItems[i];
        if (!item) continue;

        // Label için: .font-bold .text-base gibi span'ı tercih et
        let nameSpan = item.querySelector('div.flex.flex-col span.font-bold.text-base') ||
                       item.querySelector('span.font-bold');

        // Amount span: son bold span
        const boldSpans = item.querySelectorAll('span.font-bold');
        let amountSpan = (boldSpans && boldSpans.length > 1) ? boldSpans[boldSpans.length - 1] : null;

        if (!amountSpan) {
            // fallback: son span çocuk
            const spans = item.querySelectorAll('span');
            amountSpan = spans[spans.length - 1] || null;
        }

        const labelVal = labels[i] != null ? String(labels[i]) : null;
        const valueVal = values[i] != null ? values[i] : null;

        if (labelVal != null && nameSpan) {
            nameSpan.textContent = labelVal;
        }

        if (valueVal != null && amountSpan) {
            amountSpan.textContent = formatToTRY(valueVal);
        }
    }

    // --- Helper functions ---

    function normalizeStoredToArray(raw, prefix) {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) return parsed.map(normalizeValue);

            if (parsed && typeof parsed === 'object') {
                // object with keys like label_1, label_2 or staff_1...
                const entries = [];
                Object.keys(parsed).forEach(k => {
                    const m = k.match(new RegExp('^' + prefix + '_(\\d+)$'));
                    if (m) {
                        entries.push({ idx: Number(m[1]), val: parsed[k] });
                    }
                });
                entries.sort((a, b) => a.idx - b.idx);
                return entries.map(e => normalizeValue(e.val));
            }
        } catch (e) {
            // devam et
        }

        // fallback: virgül ayrılmış veya tek string
        return String(raw)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(normalizeValue);
    }

    function normalizeValue(v) {
        if (typeof v === 'string') {
            const sTrim = v.trim();
            if ((sTrim.startsWith('{') && sTrim.endsWith('}')) || (sTrim.startsWith('[') && sTrim.endsWith(']'))) {
                try {
                    return JSON.parse(sTrim);
                } catch (e) { /* ignore */ }
            }
        }
        return v;
    }

    function createItemElement(name, amount) {
        const el = document.createElement('div');
        el.className = 'group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-card-dark shadow-sm border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer';
        el.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="size-12 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span class="material-symbols-outlined">payments</span>
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-slate-900 dark:text-white text-base">${escapeHtml(name)}</span>
                </div>
            </div>
            <span class="font-bold text-slate-900 dark:text-white">${escapeHtml(amount)}</span>
        `;
        return el;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function parseNumberFlexible(v) {
        if (v == null) return NaN;
        if (typeof v === 'number') return v;

        let s = String(v).trim();
        s = s.replace(/[^\d.,\-]/g, '');
        if (s === '') return NaN;

        const hasComma = s.includes(',');
        const hasDot = s.includes('.');

        if (hasComma && !hasDot) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (!hasComma && hasDot) {
            const dotCount = (s.match(/\./g) || []).length;
            if (dotCount > 1) s = s.replace(/\./g, '');
        } else if (hasComma && hasDot) {
            const lastComma = s.lastIndexOf(',');
            const lastDot = s.lastIndexOf('.');
            if (lastComma > lastDot) {
                s = s.replace(/\./g, '').replace(',', '.');
            } else {
                s = s.replace(/,/g, '');
            }
        }

        const n = parseFloat(s);
        return isFinite(n) ? n : NaN;
    }

    function formatToTRY(v) {
        if (v === '-' || v === null || v === undefined) return String(v);

        const n = parseNumberFlexible(v);
        if (isNaN(n)) {
            const s = String(v);
            return s.startsWith('₺') ? s : '₺' + s;
        }

        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(n);
    }
}

        document.addEventListener('DOMContentLoaded', () => {
            // Chart.js yüklü mü kontrol et
            if (typeof Chart === 'undefined') {
                console.error('Chart.js bulunamadı. CDN scriptinin yüklendiğinden emin olun.');
                return;
            }

            // Canvas elementini güvenli şekilde al
            const canvas = document.getElementById('chart-canvas');
            if (!canvas) {
                console.error("Canvas bulunamadı: id='chart-canvas' yok. HTML'de canvas id'sinin doğru olduğundan emin olun.");
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Canvas context alınamadı.');
                return;
            }

            // Helper: TL para birimi formatı
            const formatTL = v => Number(v).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            // localStorage'dan veri oku
            let raw = localStorage.getItem('day_data_set');
            let data;
            try {
                data = raw ? JSON.parse(raw) : null;
            } catch (e) {
                data = null;
                console.warn('day_data_set parse error', e);
            }

            // Veri yoksa veya geçersizse fallback veri kullan
            if (!Array.isArray(data) || data.length === 0) {
                data = [
                    { "date": "2025-10-14", "turkish_lira": 360.99999999999994, "dolar": 8.6351 },
                    { "date": "2025-10-15", "turkish_lira": 447.6, "dolar": 10.7008 },
                    { "date": "2025-10-16", "turkish_lira": 420.2, "dolar": 9.8 },
                    { "date": "2025-10-17", "turkish_lira": 480.7, "dolar": 11.2 },
                    { "date": "2025-10-18", "turkish_lira": 452.5, "dolar": 10.6 }
                ];
            }

            // Tarihe göre artan sırada sırala
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            const all_amount = document.getElementById("total_amount")
            console.log(data[data.length-1].turkish_lira)
            all_amount.innerHTML = formatTL(data[data.length-1].turkish_lira) + "₺";
            // X ekseni etiketleri (örneğin: 14 Eki)
            const labels = data.map(d => {
                return new Date(d.date).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'short'
                });
            });

            // Y ekseni değerleri (TL miktarı)
            const values = data.map(d => Number(d.turkish_lira ?? d.tl ?? 0));

            // Büyüme değerini güncelle (son değer - ilk değer)
            const growthEl = document.getElementById('treading_up');
            if (growthEl) {
                const growth = data.length > 1 ? ((data[data.length-1].turkish_lira - data[0].turkish_lira) /  data[0].turkish_lira ) * 100 : 0;
                growthEl.innerHTML = "%"+formatTL(growth);
            }

            // Alt kısımda hafta günü etiketleri (Paz, Sal, vs.)
            const labelsEl = document.getElementById('chart-xlabels');
            if (labelsEl) {
                const weekdayLabels = data.map(d =>
                    new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' })
                );
                labelsEl.innerHTML = weekdayLabels.map(l => `<span>${l}</span>`).join('');
            }

            // Mevcut chart instance varsa yok et
            if (window.__dayChartInstance) {
                try {
                    window.__dayChartInstance.destroy();
                } catch (e) {
                    // ignore
                }
                window.__dayChartInstance = null;
            }

            // Dark mode tespiti
            const isDark = document.body.classList.contains('dark') ||
                (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

            // Renk tanımlamaları
            const lineColor = '#13ec5b';
            const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2,6,23,0.06)';
            const tooltipBg = isDark ? '#0f1724' : '#0b1220';

            // Chart.js konfigürasyonu
            const config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Turkish Lira',
                        data: values,
                        borderColor: lineColor,
                        borderWidth: 3,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: function (context) {
                            const idx = context.dataIndex;
                            if (idx > 0 && values[idx] < values[idx - 1]) {
                                return '#ff6b6b'; // düşüşte nokta kırmızı
                            }
                            return lineColor;
                        },
                        fill: true,
                        backgroundColor: function (context) {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;

                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(19,236,91,0.22)');
                            gradient.addColorStop(0.6, 'rgba(19,236,91,0.08)');
                            gradient.addColorStop(1, 'rgba(19,236,91,0.02)');
                            return gradient;
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 600,
                        easing: 'easeOutCubic'
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: tooltipBg,
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: ctx => '₺' + formatTL(ctx.parsed.y)
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#475569',
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 7
                            }
                        },
                        y: {
                            grid: {
                                color: gridColor,
                                drawBorder: false
                            },
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#475569',
                                callback: value => '₺' + formatTL(Number(value)),
                                maxTicksLimit: 5
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        intersect: false
                    }
                }
            };

            // Chart'ı oluştur
            const chartInstance = new Chart(ctx, config);
            window.__dayChartInstance = chartInstance;

            // Container boyutu değişirse chart'ı yeniden boyutlandır
            const resizeObserver = new ResizeObserver(() => {
                chartInstance.resize();
            });
            resizeObserver.observe(canvas.parentElement || canvas);
        });

init()
