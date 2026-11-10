// ===== Pestaña "Seguimiento": un solo gráfico (f'c × edad → promedio RESULTADO %), una curva por proyecto =====
(function () {
    'use strict';
    var EDADES = [7, 14, 28, 56];
    var PALETA = ['#4B7C2D', '#C2410C', '#1D6FA5', '#B8860B', '#7B3FA0', '#0E8F8F', '#B4433A', '#5B6770', '#8A9A1B', '#A0527C'];
    var COLOR_CONSOLIDADO = '#4B4F1D';

    var root = document.getElementById('seguimiento');
    var chartEl = document.getElementById('sgChart');
    if (!root || !chartEl || typeof datosConsolidado === 'undefined') return;
    var btn = document.getElementById('sgBtnProyectos');
    var dd = document.getElementById('sgDropdown');
    var tagsEl = document.getElementById('sgTags');
    var resumenEl = document.getElementById('sgResumen');
    var btnCons = document.getElementById('sgBtnConsolidar');
    var btnReset = document.getElementById('sgBtnReset');

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }
    function num(v) { var n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : null; }
    function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

    // ---- datos: filas por proyecto, color fijo por proyecto ----
    var porProyecto = {};
    datosConsolidado.forEach(function (r) {
        var p = r['Proyecto']; if (!p) return;
        (porProyecto[p] = porProyecto[p] || []).push(r);
    });
    var proyectos = Object.keys(porProyecto).sort();
    var color = {};
    proyectos.forEach(function (p, i) { color[p] = PALETA[i % PALETA.length]; });
    var seleccion = {};          // por defecto, todos los proyectos activos
    proyectos.forEach(function (p) { seleccion[p] = true; });
    var consolidar = false;

    function activos() { return proyectos.filter(function (p) { return seleccion[p]; }); }

    // Agrega filas -> { lanes:[f'c asc], cells:{f'c:{edad:{n,sum}}}, total }
    function agregar(filas) {
        var cells = {}, total = 0;
        filas.forEach(function (r) {
            var edad = num(r['Edad (días)']), llave = num(r['Resistencia nominal (MPa) llave']), pct = num(r['Resistencia (%)']);
            if (EDADES.indexOf(edad) < 0 || llave === null || pct === null) return;
            cells[llave] = cells[llave] || {};
            var c = cells[llave][edad] = cells[llave][edad] || { n: 0, sum: 0 };
            c.n++; c.sum += pct; total++;
        });
        return { cells: cells, total: total };
    }

    function series() {
        var act = activos();
        if (!act.length) return [];
        if (consolidar) {
            var filas = [];
            act.forEach(function (p) { filas = filas.concat(porProyecto[p]); });
            var a = agregar(filas);
            return [{ nombre: act.length === proyectos.length ? 'Todos los proyectos' : 'Consolidado (' + act.length + ' proy.)', color: COLOR_CONSOLIDADO, agg: a }];
        }
        return act.map(function (p) { return { nombre: p, color: color[p], agg: agregar(porProyecto[p]) }; });
    }

    // ---- gráfico ----
    function dibujar() {
        var ss = series();
        var tot = ss.reduce(function (s, x) { return s + x.agg.total; }, 0);
        resumenEl.textContent = ss.length ? (ss.length + (ss.length === 1 ? ' curva · ' : ' curvas · ') + tot.toLocaleString('es-CO') + ' muestras') : '';
        var lanesSet = {};
        ss.forEach(function (s) { Object.keys(s.agg.cells).forEach(function (k) { lanesSet[k] = true; }); });
        var lanes = Object.keys(lanesSet).map(Number).sort(function (a, b) { return a - b; });
        if (!ss.length || !lanes.length) {
            chartEl.innerHTML = '<div class="sg-empty">' + (ss.length ? 'Sin muestras de 7, 14, 28 o 56 días.' : 'Selecciona al menos un proyecto.') + '</div>';
            return;
        }
        var L = lanes.length, n = ss.length;
        var W = 1000, left = 64, right = 24, top = 30, laneH = 78, bottom = 46;
        var H = top + L * laneH + bottom;
        var step = (W - left - right) / EDADES.length;
        var xs = EDADES.map(function (e, i) { return left + step * (i + 0.5); });
        var yBase = function (i) { return top + (L - 1 - i) * laneH + laneH / 2; };
        var gap = Math.min(15, (laneH - 16) / Math.max(n, 1));
        var mostrarEtq = gap >= 12;
        var o = [];
        o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Seguimiento de resistencia por f\'c y edad">');
        for (var i = 0; i < L; i++) {
            if (i % 2 === 0) o.push('<rect x="' + left + '" y="' + (top + (L - 1 - i) * laneH) + '" width="' + (W - left - right) + '" height="' + laneH + '" fill="#f6f8ee" opacity=".7"/>');
            o.push('<path d="M' + left + ' ' + yBase(i) + ' H' + (W - right) + '" stroke="#A3C610" stroke-opacity=".35" stroke-dasharray="3 5"/>');
        }
        xs.forEach(function (x) { o.push('<path d="M' + x + ' ' + top + ' V' + (top + L * laneH) + '" stroke="#A3C610" stroke-opacity=".25" stroke-dasharray="3 5"/>'); });
        o.push('<path d="M' + left + ' ' + top + ' V' + (top + L * laneH) + ' H' + (W - right) + '" stroke="#4B4F1D" stroke-opacity=".5" fill="none" stroke-linecap="round"/>');
        o.push('<text x="' + left + '" y="' + (top - 12) + '" font-size="10" font-weight="700" fill="#4B4F1D">f\'c (MPa)</text>');
        lanes.forEach(function (ll, i) { o.push('<text x="' + (left - 10) + '" y="' + (yBase(i) + 4) + '" text-anchor="end" font-size="12" font-weight="700" fill="#4B4F1D">' + ll + '</text>'); });
        EDADES.forEach(function (e, j) { o.push('<text x="' + xs[j] + '" y="' + (top + L * laneH + 20) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#4B4F1D">' + e + '</text>'); });
        o.push('<text x="' + (left + (W - left - right) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#4B4F1D" opacity=".8">Edad (días)</text>');

        ss.forEach(function (s, k) {
            var dy = (k - (n - 1) / 2) * gap;
            var g = ['<g class="sg-serie" data-k="' + k + '">'];
            lanes.forEach(function (ll, i) {
                var y = yBase(i) + dy, pts = [];
                EDADES.forEach(function (e, j) { if (s.agg.cells[ll] && s.agg.cells[ll][e]) pts.push([xs[j], e]); });
                if (pts.length > 1) g.push('<polyline points="' + pts.map(function (p) { return p[0] + ',' + y; }).join(' ') + '" fill="none" stroke="' + s.color + '" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>');
                pts.forEach(function (p) {
                    var c = s.agg.cells[ll][p[1]], prom = c.sum / c.n, txt = prom.toFixed(1) + '%';
                    g.push('<g><title>' + esc(s.nombre + "\nf'c " + ll + ' MPa · ' + p[1] + ' días\nPromedio: ' + txt + '\nMuestras: ' + c.n) + '</title>' +
                        '<circle cx="' + p[0] + '" cy="' + y + '" r="4.5" fill="' + s.color + '" stroke="#fff" stroke-width="1.5"/>' +
                        '<g class="sg-lbl"><rect x="' + (p[0] + 8) + '" y="' + (y - 6.5) + '" width="42" height="13" rx="3" fill="#fff" fill-opacity=".92" stroke="' + s.color + '" stroke-opacity=".6" stroke-width=".8"/>' +
                        '<text x="' + (p[0] + 29) + '" y="' + (y + 3.4) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="' + s.color + '">' + txt + '</text></g></g>');
                });
            });
            g.push('</g>');
            o.push(g.join(''));
        });
        o.push('</svg>');
        chartEl.innerHTML = o.join('');
        chartEl.classList.toggle('sg-hide-lbl', !mostrarEtq);
        // resaltar una curva al pasar el cursor
        chartEl.querySelectorAll('.sg-serie').forEach(function (g) {
            g.addEventListener('mouseenter', function () { chartEl.classList.add('sg-chart-focus'); g.classList.add('sg-on'); });
            g.addEventListener('mouseleave', function () { chartEl.classList.remove('sg-chart-focus'); g.classList.remove('sg-on'); });
        });
    }

    // ---- controles ----
    function tags() {
        var act = activos();
        tagsEl.innerHTML = consolidar && act.length
            ? '<span class="sg-tag" style="cursor:default"><i class="sg-sw" style="background:' + COLOR_CONSOLIDADO + '"></i>Curva consolidada de ' + act.length + ' proyecto(s)</span>'
            : act.map(function (p) {
                return '<span class="sg-tag" data-p="' + esc(p) + '"><i class="sg-sw" style="background:' + color[p] + '"></i>' + esc(p) + ' <b>&times;</b></span>';
            }).join('');
        tagsEl.querySelectorAll('.sg-tag[data-p]').forEach(function (t) {
            t.addEventListener('click', function () { seleccion[t.getAttribute('data-p')] = false; refrescar(); });
        });
    }
    function sincronizarChecks() {
        dd.querySelectorAll('input[data-p]').forEach(function (i) { i.checked = !!seleccion[i.getAttribute('data-p')]; });
        var todos = dd.querySelector('input[data-all]');
        if (todos) todos.checked = activos().length === proyectos.length;
    }
    function refrescar() { tags(); sincronizarChecks(); btnCons.classList.toggle('active', consolidar); dibujar(); }

    function construirDropdown() {
        var h = '<div class="sg-search"><input type="text" placeholder="Escribir para filtrar..." autocomplete="off"></div>';
        h += '<div class="sg-opt sg-all"><input type="checkbox" id="sgChkAll" data-all="1"><label for="sgChkAll">Seleccionar todos</label></div>';
        proyectos.forEach(function (p, i) {
            h += '<div class="sg-opt" data-name="' + esc(p) + '"><input type="checkbox" id="sgChk' + i + '" data-p="' + esc(p) + '" checked>' +
                '<label for="sgChk' + i + '"><i class="sg-sw" style="background:' + color[p] + '"></i>' + esc(p) + '</label></div>';
        });
        dd.innerHTML = h;
        dd.querySelector('input[data-all]').addEventListener('change', function (e) {
            proyectos.forEach(function (p) { seleccion[p] = e.target.checked; });
            refrescar();
        });
        dd.querySelectorAll('input[data-p]').forEach(function (i) {
            i.addEventListener('change', function () { seleccion[i.getAttribute('data-p')] = i.checked; refrescar(); });
        });
        var inp = dd.querySelector('.sg-search input');
        inp.addEventListener('input', function () {
            var q = norm(inp.value.trim());
            dd.querySelectorAll('.sg-opt[data-name]').forEach(function (o) {
                o.style.display = !q || norm(o.getAttribute('data-name')).indexOf(q) >= 0 ? '' : 'none';
            });
        });
    }

    btn.addEventListener('click', function () {
        dd.classList.toggle('open');
        if (dd.classList.contains('open')) { var i = dd.querySelector('.sg-search input'); if (i) { i.value = ''; i.dispatchEvent(new Event('input')); setTimeout(function () { i.focus(); }, 30); } }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#seguimiento .sg-bar')) dd.classList.remove('open'); });
    btnCons.addEventListener('click', function () { consolidar = !consolidar; refrescar(); });
    btnReset.addEventListener('click', function () {
        proyectos.forEach(function (p) { seleccion[p] = true; }); consolidar = false; refrescar();
    });
    var tabBtn = document.querySelector('[data-tab="seguimiento"]');
    if (tabBtn) tabBtn.addEventListener('click', dibujar);

    construirDropdown();
    refrescar();
})();
