// ===== Pestaña "Seguimiento": un solo gráfico (f'c × edad → promedio RESULTADO %), una curva por proyecto =====
(function () {
    'use strict';
    var EDADES = [7, 14, 28, 56];
    var root = document.getElementById('seguimiento');
    var chartEl = document.getElementById('sgChart');
    if (!root || !chartEl || typeof datosConsolidado === 'undefined') return;
    var btn = document.getElementById('sgBtnProyectos');
    var dd = document.getElementById('sgDropdown');
    var tagsEl = document.getElementById('sgTags');
    var resumenEl = document.getElementById('sgResumen');
    var btnFilas = document.getElementById('sgBtnFilas');
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
    var porFilas = 'fc';         // filas del gráfico: f'c o proyecto

    function activos() { return proyectos.filter(function (p) { return proyectosSeleccionados.indexOf(p) >= 0; }); }

    // ---- estadística ----
    var VERDE = '#a9cf7a', VERDE_OSC = '#5c8a2e', AMBAR = '#d98e00';

    function percentil(v, q) {
        var i = (v.length - 1) * q, a = Math.floor(i), b = Math.ceil(i);
        return v[a] + (v[b] - v[a]) * (i - a);
    }
    function resumir(filas) {
        var v = [], teo = 0, nt = 0, suma = 0;
        filas.forEach(function (r) {
            var pct = num(r['Resistencia (%)']);
            if (pct === null) return;
            v.push(pct); suma += pct;
            var t = num(r['Resistencia Teórica (MPa)']), nom = num(r['Resistencia nominal (MPa)']);
            if (t !== null && nom) { teo += t / nom * 100; nt++; }
        });
        if (!v.length) return null;
        v.sort(function (a, b) { return a - b; });
        return { n: v.length, prom: suma / v.length, p10: percentil(v, 0.1), p25: percentil(v, 0.25), p75: percentil(v, 0.75), p90: percentil(v, 0.9), esperado: nt ? teo / nt : null };
    }

    // ---- gráfico: un panel por edad; filas = f'c o proyecto ----
    function dibujar() {
        var filas = filtrarPorProyectosUnidadesYMuestras(datosConsolidado, proyectosSeleccionados, unidadesEstructuralesSeleccionadas, muestrasSeleccionadas)
            .filter(function (r) { return EDADES.indexOf(num(r['Edad (días)'])) >= 0 && num(r['Resistencia (%)']) !== null; });
        var nProy = new Set(filas.map(function (r) { return r['Proyecto']; })).size;
        resumenEl.textContent = filas.length ? nProy + ' proyecto(s) · ' + filas.length.toLocaleString('es-CO') + ' muestras' : '';
        if (!filas.length) {
            chartEl.innerHTML = '<div class="sg-empty">' + (activos().length ? 'Sin muestras de 7, 14, 28 o 56 días con los filtros actuales.' : 'Selecciona al menos un proyecto.') + '</div>';
            return;
        }
        var clave = porFilas === 'fc'
            ? function (r) { return num(r['Resistencia nominal (MPa) llave']); }
            : function (r) { return r['Proyecto']; };
        var grupos = {};
        filas.forEach(function (r) {
            var k = clave(r);
            if (k === null) return;
            (grupos[k] = grupos[k] || []).push(r);
        });
        var claves = Object.keys(grupos).sort(porFilas === 'fc'
            ? function (a, b) { return b - a; }
            : function (a, b) { return resumir(grupos[b]).prom - resumir(grupos[a]).prom; });

        var celdas = EDADES.map(function (e) {
            return claves.map(function (k) { return resumir(grupos[k].filter(function (r) { return num(r['Edad (días)']) === e; })); });
        });
        var generales = EDADES.map(function (e) { return resumir(filas.filter(function (r) { return num(r['Edad (días)']) === e; })); });
        var min = Infinity, max = -Infinity;
        celdas.forEach(function (col) {
            col.forEach(function (c) { if (c) { min = Math.min(min, c.p10, c.prom); max = Math.max(max, c.p90, c.prom); } });
        });
        min = Math.floor(min / 20) * 20;
        max = Math.max(min + 40, Math.ceil(max / 20) * 20);
        var paso = max - min > 120 ? 40 : 20;

        var W = 1200, izq = porFilas === 'fc' ? 150 : 230, der = 18, sep = 44, top = 58, alto = 44, abajo = 34;
        var H = top + claves.length * alto + abajo;
        var ancho = (W - izq - der - sep * 3) / 4;
        var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Distribución del resultado porcentual por edad">'];
        claves.forEach(function (k, i) {
            var y = top + i * alto + alto / 2;
            var nombre = porFilas === 'fc' ? "f'c " + k + ' MPa' : k;
            o.push('<text x="' + (izq - 14) + '" y="' + y + '" text-anchor="end" font-size="12" fill="#3f3f3a">' + esc(nombre) + '</text>');
            o.push('<text x="' + (izq - 14) + '" y="' + (y + 13) + '" text-anchor="end" font-size="9.5" fill="#9a9a90">n=' + grupos[k].length.toLocaleString('es-CO') + '</text>');
        });
        EDADES.forEach(function (e, j) {
            var x0 = izq + j * (ancho + sep);
            var X = function (v) { return x0 + (v - min) / (max - min) * ancho; };
            var g = generales[j];
            o.push('<text x="' + x0 + '" y="18" font-size="13" font-weight="700" fill="#2d5a3d">' + e + ' días</text>');
            for (var t = min; t <= max; t += paso) {
                o.push('<path d="M' + X(t) + ' ' + top + ' V' + (H - abajo) + '" stroke="#e8e8e2"/>');
                o.push('<text x="' + X(t) + '" y="' + (H - abajo + 18) + '" text-anchor="middle" font-size="10" fill="#8a8a80">' + t + '%</text>');
            }
            if (!g) {
                o.push('<text x="' + (x0 + ancho / 2) + '" y="' + (top + 24) + '" text-anchor="middle" font-size="11" fill="#9a9a90">sin muestras</text>');
                return;
            }
            o.push('<path d="M' + X(g.prom) + ' ' + (top - 12) + ' V' + (H - abajo) + '" stroke="#8f8f86" stroke-dasharray="4 4"/>');
            o.push('<text x="' + X(g.prom) + '" y="' + (top - 18) + '" text-anchor="middle" font-size="10" font-style="italic" fill="#77776e">promedio ' + g.prom.toFixed(1) + '%</text>');
            claves.forEach(function (k, i) {
                var c = celdas[j][i];
                if (!c) return;
                var y = top + i * alto + alto / 2 + 4;
                var bajo = c.esperado !== null && c.prom < c.esperado;
                var col = bajo ? AMBAR : VERDE;
                var tip = (porFilas === 'fc' ? "f'c " + k + ' MPa' : k) + ' · ' + e + ' días\nPromedio: ' + c.prom.toFixed(1) + '%\nP25–P75: ' + c.p25.toFixed(1) + '% – ' + c.p75.toFixed(1) +
                    '%\nP10–P90: ' + c.p10.toFixed(1) + '% – ' + c.p90.toFixed(1) + '%\nMuestras: ' + c.n + (c.esperado !== null ? '\nEsperado: ' + c.esperado.toFixed(1) + '%' : '');
                o.push('<g class="sg-pt"><title>' + esc(tip) + '</title>' +
                    '<path d="M' + X(c.p10) + ' ' + y + ' H' + X(c.p90) + '" stroke="' + col + '" stroke-opacity=".45" stroke-width="1.5"/>' +
                    '<path d="M' + X(c.p25) + ' ' + y + ' H' + X(c.p75) + '" stroke="' + col + '" stroke-width="5" stroke-linecap="round"/>' +
                    '<circle cx="' + X(c.prom) + '" cy="' + y + '" r="5.5" fill="' + (bajo ? AMBAR : VERDE_OSC) + '" stroke="#fff" stroke-width="1.8"/>' +
                    '<text x="' + X(c.prom) + '" y="' + (y - 11) + '" text-anchor="middle" font-size="11" font-weight="' + (bajo ? 700 : 600) + '" fill="' + (bajo ? AMBAR : '#3f3f3a') +
                    '" stroke="#fff" stroke-width="3" paint-order="stroke">' + c.prom.toFixed(1) + '%</text></g>');
            });
        });
        o.push('</svg>');
        chartEl.innerHTML = o.join('');
    }

    // ---- controles ----
    function tags() {
        var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        var lista = [];
        var agregar = function (valores, quitar, texto) {
            valores.forEach(function (v) { var t = texto ? texto(v) : v; lista.push({ texto: t, quitar: function () { quitar(v, t); } }); });
        };
        agregar(proyectosSeleccionados, function (v) { removerProyecto(v); });
        agregar(unidadesEstructuralesSeleccionadas, function (v) { removerUnidadEstructural(v); });
        agregar(muestrasSeleccionadas, function (v) { removerMuestra(v); });
        agregar(mesesSeleccionados, function (v) { removerMes(v); }, function (m) { var x = m.split('-'); return MESES[parseInt(x[1], 10) - 1] + '-' + x[0]; });
        agregar(fcSeleccionados, function (v, t) { removerFcPorFormato(t); }, function (f) { return f + ' MPa'; });
        tagsEl.innerHTML = lista.map(function (x, i) {
            return '<span class="sg-tag" data-i="' + i + '">' + esc(x.texto) + ' <b>&times;</b></span>';
        }).join('');
        tagsEl.querySelectorAll('.sg-tag').forEach(function (t) {
            t.addEventListener('click', function () { lista[+t.getAttribute('data-i')].quitar(); });
        });
    }
    function sincronizarChecks() {
        dd.querySelectorAll('input[data-p]').forEach(function (i) { i.checked = proyectosSeleccionados.indexOf(i.getAttribute('data-p')) >= 0; });
        var todos = dd.querySelector('input[data-all]');
        if (todos) todos.checked = activos().length === proyectos.length;
    }
    function refrescar() {
        tags();
        sincronizarChecks();
        btnFilas.textContent = porFilas === 'fc' ? 'Ver por proyecto' : "Ver por f'c";
        dibujar();
    }

    function aplicarProyectos(lista) {
        proyectosSeleccionados = lista;
        actualizarTodosFiltros();
    }

    function construirDropdown() {
        var h = '<div class="sg-search"><input type="text" placeholder="Escribir y pulsar Enter..." autocomplete="off"></div>';
        h += '<div class="sg-opt sg-all"><input type="checkbox" id="sgChkAll" data-all="1"><label for="sgChkAll">Seleccionar todos</label></div>';
        proyectos.forEach(function (p, i) {
            h += '<div class="sg-opt" data-name="' + esc(p) + '"><input type="checkbox" id="sgChk' + i + '" data-p="' + esc(p) + '">' +
                '<label for="sgChk' + i + '">' + esc(p) + '</label></div>';
        });
        dd.innerHTML = h;
        dd.querySelector('input[data-all]').addEventListener('change', function (e) {
            aplicarProyectos(e.target.checked ? proyectos.slice() : []);
        });
        dd.querySelectorAll('input[data-p]').forEach(function (i) {
            i.addEventListener('change', function () {
                var p = i.getAttribute('data-p');
                aplicarProyectos(proyectosSeleccionados.filter(function (q) { return q !== p; }).concat(i.checked ? [p] : []));
            });
        });
        var inp = dd.querySelector('.sg-search input');
        var visibles = function () {
            return Array.from(dd.querySelectorAll('.sg-opt[data-name]')).filter(function (o) { return o.style.display !== 'none'; });
        };
        inp.addEventListener('input', function () {
            var q = norm(inp.value.trim());
            dd.querySelectorAll('.sg-opt[data-name]').forEach(function (o) {
                o.style.display = !q || norm(o.getAttribute('data-name')).indexOf(q) >= 0 ? '' : 'none';
            });
        });
        inp.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            var nombres = visibles().map(function (o) { return o.getAttribute('data-name'); });
            if (!nombres.length) return;
            dd.classList.remove('open');
            aplicarProyectos(Array.from(new Set(proyectosSeleccionados.concat(nombres))));
        });
    }

    btn.addEventListener('click', function () {
        dd.classList.toggle('open');
        sincronizarChecks();
        if (dd.classList.contains('open')) { var i = dd.querySelector('.sg-search input'); if (i) { i.value = ''; i.dispatchEvent(new Event('input')); setTimeout(function () { i.focus(); }, 30); } }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#seguimiento .sg-bar')) { dd.classList.remove('open'); sincronizarChecks(); } });
    btnFilas.addEventListener('click', function () { porFilas = porFilas === 'fc' ? 'proyecto' : 'fc'; refrescar(); });
    btnReset.addEventListener('click', function () {
        porFilas = 'fc'; restablecerFiltros();
    });
    var tabBtn = document.querySelector('[data-tab="seguimiento"]');
    if (tabBtn) tabBtn.addEventListener('click', refrescar);

    var uiOriginal = window.actualizarUIInmediata;
    window.actualizarUIInmediata = function () {
        uiOriginal.apply(this, arguments);
        refrescar();
    };

    construirDropdown();
    refrescar();
})();
