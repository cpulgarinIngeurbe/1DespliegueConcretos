// ===== Pestaña "Seguimiento": tableros gráficos (f'c × edad → promedio RESULTADO %) =====
(function () {
    'use strict';
    var EDADES = [7, 14, 28, 56];
    var TOLERANCIA = 5; // puntos porcentuales bajo lo esperado que se consideran "cerca"
    var COLORES = { ok: 'var(--sg-ok)', warn: 'var(--sg-warn)', bad: 'var(--sg-bad)', neutral: 'var(--sg-neutral)' };

    var root = document.getElementById('seguimiento');
    var boardsEl = document.getElementById('sgBoards');
    var selectEl = document.getElementById('sgProyecto');
    var legendEl = document.getElementById('sgLegend');
    if (!root || !boardsEl || typeof datosConsolidado === 'undefined') return;

    var referencia = 'teorico';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function num(v) {
        var n = typeof v === 'number' ? v : parseFloat(v);
        return isFinite(n) ? n : null;
    }

    // Agrega filas -> { lanes:[llave asc], cells:{llave:{edad:{n,sum,sumTeo,nTeo}}}, total }
    function agregar(filas) {
        var cells = {}, total = 0;
        filas.forEach(function (r) {
            var edad = num(r['Edad (días)']);
            var llave = num(r['Resistencia nominal (MPa) llave']);
            var pct = num(r['Resistencia (%)']);
            if (EDADES.indexOf(edad) < 0 || llave === null || pct === null) return;
            var nom = num(r['Resistencia nominal (MPa)']);
            var teo = num(r['Resistencia Teórica (MPa)']);
            cells[llave] = cells[llave] || {};
            var c = cells[llave][edad] = cells[llave][edad] || { n: 0, sum: 0, sumTeo: 0, nTeo: 0 };
            c.n++; c.sum += pct; total++;
            if (teo !== null && nom !== null && nom > 0) { c.sumTeo += (teo / nom) * 100; c.nTeo++; }
        });
        var lanes = Object.keys(cells).map(Number).sort(function (a, b) { return a - b; });
        return { lanes: lanes, cells: cells, total: total };
    }

    function estado(c) {
        var prom = c.sum / c.n;
        var esperado = referencia === 'cien' ? 100 : (c.nTeo > 0 ? c.sumTeo / c.nTeo : null);
        if (esperado === null) return { k: 'neutral', prom: prom, esperado: null };
        var d = prom - esperado;
        return { k: d >= 0 ? 'ok' : (d >= -TOLERANCIA ? 'warn' : 'bad'), prom: prom, esperado: esperado };
    }

    function svgTablero(agg) {
        var L = agg.lanes.length;
        var W = 640, left = 82, right = 26, top = 30, laneH = 58, bottom = 46;
        var H = top + L * laneH + bottom;
        var step = (W - left - right) / EDADES.length;
        var xs = EDADES.map(function (e, i) { return left + step * (i + 0.5); });
        var yLane = function (i) { return top + (L - 1 - i) * laneH + laneH / 2; };
        var out = [];
        out.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Promedio de resultado porcentual por f&#39;c y edad">');
        out.push('<defs><linearGradient id="sgFade" x1="0" x2="1"><stop offset="0" stop-color="var(--gw-accent)" stop-opacity=".25"/><stop offset="1" stop-color="var(--gw-accent)" stop-opacity=".6"/></linearGradient></defs>');
        // cuadrícula: líneas de carril y de edad (punteadas, como en el componente original)
        for (var i = 0; i < L; i++) {
            out.push('<path d="M' + left + ' ' + yLane(i) + ' H' + (W - right) + '" stroke="currentColor" opacity=".13" stroke-dasharray="3 5"/>');
        }
        xs.forEach(function (x) {
            out.push('<path d="M' + x + ' ' + top + ' V' + (top + L * laneH) + '" stroke="currentColor" opacity=".09" stroke-dasharray="3 5"/>');
        });
        // ejes
        out.push('<path d="M' + left + ' ' + top + ' V' + (top + L * laneH) + ' H' + (W - right) + '" stroke="currentColor" opacity=".35" fill="none" stroke-linecap="round"/>');
        out.push('<text x="' + left + '" y="' + (top - 12) + '" font-size="10" font-weight="700" fill="currentColor" opacity=".7">f&#39;c (MPa)</text>');
        agg.lanes.forEach(function (llave, i) {
            out.push('<text x="' + (left - 12) + '" y="' + (yLane(i) + 4) + '" text-anchor="end" font-size="13" font-weight="800" fill="currentColor">' + esc(llave) + '</text>');
        });
        EDADES.forEach(function (e, i) {
            out.push('<text x="' + xs[i] + '" y="' + (top + L * laneH + 20) + '" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + e + '</text>');
        });
        out.push('<text x="' + (left + (W - left - right) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" opacity=".7">Edad (días)</text>');

        // series por carril: línea + puntos con su porcentaje
        var orden = 0;
        agg.lanes.forEach(function (llave, i) {
            var y = yLane(i), pts = [];
            EDADES.forEach(function (e, j) { if (agg.cells[llave][e]) pts.push(xs[j]); });
            if (pts.length > 1) {
                out.push('<polyline points="' + pts.map(function (x) { return x + ',' + y; }).join(' ') + '" fill="none" stroke="url(#sgFade)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');
            }
            EDADES.forEach(function (e, j) {
                var c = agg.cells[llave][e];
                if (!c) { out.push('<circle cx="' + xs[j] + '" cy="' + y + '" r="3" fill="currentColor" opacity=".18"/>'); return; }
                var st = estado(c), col = COLORES[st.k];
                var txt = st.prom.toFixed(1) + '%';
                var detalle = "f'c " + llave + ' MPa · ' + e + ' días\nPromedio: ' + txt + '\nMuestras: ' + c.n +
                    (st.esperado !== null ? '\nEsperado: ' + st.esperado.toFixed(1) + '%' : '\nSin referencia teórica');
                out.push('<g class="sg-pt sg-reveal" style="--i:' + (orden++ % 14) + '"><title>' + esc(detalle) + '</title>' +
                    '<circle cx="' + xs[j] + '" cy="' + y + '" r="5.5" fill="' + col + '" stroke="#fff" stroke-width="1.5"/>' +
                    '<rect x="' + (xs[j] - 29) + '" y="' + (y - 30) + '" width="58" height="19" rx="9.5" fill="#ffffffc8" stroke="' + col + '" stroke-opacity=".55"/>' +
                    '<text x="' + xs[j] + '" y="' + (y - 17) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + col + '">' + txt + '</text></g>');
            });
        });
        out.push('</svg>');
        return out.join('');
    }

    function tablero(titulo, agg, ancho, idx) {
        var cuerpo = agg.lanes.length
            ? svgTablero(agg)
            : '<div class="sg-empty">Sin muestras de 7, 14, 28 o 56 días para este proyecto.</div>';
        return '<section class="sg-board sg-glass sg-reveal' + (ancho ? ' sg-wide' : '') + '" style="--i:' + idx + '">' +
            '<div class="sg-board-head"><h3>' + esc(titulo) + '</h3><span class="sg-chip">' + agg.total + ' muestras</span></div>' + cuerpo + '</section>';
    }

    function leyenda() {
        var ref = referencia === 'cien' ? "100 % de f'c" : 'la curva teórica de cada edad';
        legendEl.innerHTML =
            '<span><i style="background:' + COLORES.ok + '"></i>Alcanza o supera ' + ref + '</span>' +
            '<span><i style="background:' + COLORES.warn + '"></i>Hasta ' + TOLERANCIA + ' pts por debajo</span>' +
            '<span><i style="background:' + COLORES.bad + '"></i>Más de ' + TOLERANCIA + ' pts por debajo</span>' +
            (referencia === 'teorico' ? '<span><i style="background:' + COLORES.neutral + '"></i>Sin referencia teórica</span>' : '');
    }

    function poblarProyectos() {
        var vistos = {};
        datosConsolidado.forEach(function (r) { if (r['Proyecto']) vistos[r['Proyecto']] = true; });
        var nombres = Object.keys(vistos).sort();
        selectEl.innerHTML = '<option value="__todos__">Todos los proyectos</option>' +
            nombres.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
    }

    function render() {
        leyenda();
        var sel = selectEl.value || '__todos__';
        var html = '';
        if (sel === '__todos__') {
            html += tablero('Todos los proyectos', agregar(datosConsolidado), true, 1);
            var porProyecto = {};
            datosConsolidado.forEach(function (r) {
                var p = r['Proyecto']; if (!p) return;
                (porProyecto[p] = porProyecto[p] || []).push(r);
            });
            Object.keys(porProyecto).sort().forEach(function (p, i) {
                html += tablero(p, agregar(porProyecto[p]), false, i + 2);
            });
        } else {
            html += tablero(sel, agregar(datosConsolidado.filter(function (r) { return r['Proyecto'] === sel; })), true, 1);
        }
        boardsEl.innerHTML = html;
    }

    selectEl.addEventListener('change', render);
    root.querySelectorAll('.sg-seg button').forEach(function (b) {
        b.addEventListener('click', function () {
            root.querySelectorAll('.sg-seg button').forEach(function (x) { x.classList.remove('active'); });
            b.classList.add('active');
            referencia = b.getAttribute('data-ref');
            render();
        });
    });
    var boton = document.querySelector('[data-tab="seguimiento"]');
    if (boton) boton.addEventListener('click', render);
    poblarProyectos();
})();
