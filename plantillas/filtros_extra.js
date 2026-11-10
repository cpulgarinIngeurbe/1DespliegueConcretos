// ===== Extras de filtros: buscador dentro de los desplegables + descarga de Excel filtrado =====
(function () {
    'use strict';

    // ---- 1) Campo de escritura dentro de cada desplegable ----
    function normalizar(s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    function agregarBuscador(dd) {
        if (dd.querySelector(':scope > .filter-search')) return;
        if (!dd.querySelector('.filter-option')) return;
        var box = document.createElement('div');
        box.className = 'filter-search';
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = 'Escribir para filtrar...';
        inp.setAttribute('autocomplete', 'off');
        inp.addEventListener('input', function () {
            var q = normalizar(inp.value.trim());
            dd.querySelectorAll('.filter-option').forEach(function (o) {
                o.style.display = !q || normalizar(o.textContent).indexOf(q) >= 0 ? '' : 'none';
            });
        });
        inp.addEventListener('click', function (e) { e.stopPropagation(); });
        box.appendChild(inp);
        dd.insertBefore(box, dd.firstChild);
    }
    document.querySelectorAll('.filter-dropdown').forEach(function (dd) {
        agregarBuscador(dd);
        // Los desplegables se reconstruyen (innerHTML) al cambiar filtros: se vuelve a poner el buscador
        new MutationObserver(function () { agregarBuscador(dd); }).observe(dd, { childList: true });
        new MutationObserver(function () {
            if (dd.classList.contains('open')) {
                var i = dd.querySelector('.filter-search input');
                if (i) { i.value = ''; i.dispatchEvent(new Event('input')); setTimeout(function () { i.focus(); }, 30); }
            }
        }).observe(dd, { attributes: true, attributeFilter: ['class'] });
    });

    // ---- 2) Botón "Descargar Excel" (respeta los filtros aplicados) ----
    var FECHAS = ['Rotura', 'Toma', 'Publicación', 'Fecha Descarga'];
    var TABS = [
        { id: 'incumplimientos', nombre: 'Incumplimientos', datos: function () { return datosActualesIncumplimientos; }, ocultas: function () { return columnasOcultasIncumplimientos; } },
        { id: 'alertas', nombre: 'Control28Dias', datos: function () { return datosActualesAlertas; }, ocultas: function () { return columnasOcultasAlertas; } },
        { id: 'consolidado', nombre: 'Consolidado', datos: function () { return datosActualesConsolidado; }, ocultas: function () { return columnasOcultasConsolidado; } }
    ];

    function cargarXLSX(cb) {
        if (window.XLSX) return cb();
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = cb;
        s.onerror = function () { alert('No se pudo cargar la librería de Excel. Revisa la conexión a internet.'); };
        document.head.appendChild(s);
    }

    function descargar(t) {
        var datos = t.datos();
        if (!datos || !datos.length) { alert('No hay registros con los filtros actuales.'); return; }
        cargarXLSX(function () {
            var headers = obtenerColumnasOrdenadas(datos, t.ocultas());
            var filas = datos.map(function (r) {
                var o = {};
                headers.forEach(function (h) {
                    var v = r[h];
                    if (FECHAS.indexOf(h) >= 0) v = formatearFecha(v);
                    o[mapearNombreColumna(h)] = v === null || v === undefined ? '' : v;
                });
                return o;
            });
            var ws = XLSX.utils.json_to_sheet(filas);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, t.nombre.slice(0, 31));
            var hoy = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, t.nombre + '_filtrado_' + hoy + '.xlsx');
        });
    }

    TABS.forEach(function (t) {
        var panel = document.getElementById(t.id);
        var sec = panel && panel.querySelector('.filter-section');
        if (!sec || sec.querySelector('.excel-btn')) return;
        var b = document.createElement('button');
        b.className = 'filter-btn excel-btn';
        b.textContent = 'Descargar Excel';
        b.title = 'Descarga los registros con los filtros aplicados';
        b.addEventListener('click', function () { descargar(t); });
        var reset = sec.querySelector('.reset-btn');
        if (reset && reset.parentNode === sec) sec.insertBefore(b, reset); else sec.appendChild(b);
    });
})();
