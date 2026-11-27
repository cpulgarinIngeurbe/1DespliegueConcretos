// ===== Tema visual: encabezado con titular animado e indicadores =====
(function () {
    'use strict';
    var header = document.querySelector('.app-header');
    var title = header && header.querySelector('.app-header-title');
    if (!title || header.querySelector('.ig-kpis')) return;

    // Titular letra por letra (el texto completo queda en aria-label)
    var texto = title.textContent.trim(), n = 0;
    title.setAttribute('aria-label', texto);
    var palabras = texto.split(/\s+/);
    title.textContent = '';
    palabras.forEach(function (p, i) {
        var w = document.createElement('span');
        w.className = 'ig-word' + (/concretos/i.test(p) ? ' ig-accent' : '');
        w.setAttribute('aria-hidden', 'true');
        Array.from(p).forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'ig-ch';
            s.textContent = c;
            s.style.animationDelay = (0.08 + n++ * 0.025) + 's';
            w.appendChild(s);
        });
        title.appendChild(w);
        if (i < palabras.length - 1) title.appendChild(document.createTextNode(' '));
    });

    // Barra superior: logo + fecha de los datos
    var top = document.createElement('div');
    top.className = 'ig-top';
    var logo = header.querySelector('.app-header-logo');
    if (logo) top.appendChild(logo);
    header.insertBefore(top, title);

    if (typeof datosConsolidado === 'undefined') return;
    var primera = datosConsolidado[0] && datosConsolidado[0]['Fecha Descarga'];
    if (primera && typeof formatearFecha === 'function') {
        var f = document.createElement('span');
        f.className = 'ig-date';
        f.textContent = 'Datos al ' + formatearFecha(primera);
        top.appendChild(f);
    }

    // Indicadores (totales sin filtros)
    var proyectos = {};
    datosConsolidado.forEach(function (r) { if (r['Proyecto']) proyectos[r['Proyecto']] = 1; });
    var items = [[datosConsolidado.length, 'Ensayos'], [Object.keys(proyectos).length, 'Proyectos']];
    if (typeof datosIncumplimientos !== 'undefined') items.push([datosIncumplimientos.length, 'Registros en alerta']);
    var box = document.createElement('div');
    box.className = 'ig-kpis';
    items.forEach(function (it) {
        var d = document.createElement('div'), b = document.createElement('b'), s = document.createElement('span');
        d.className = 'ig-kpi';
        b.textContent = it[0].toLocaleString('es-CO');
        s.textContent = it[1];
        d.appendChild(b);
        d.appendChild(s);
        box.appendChild(d);
    });
    header.appendChild(box);
})();
