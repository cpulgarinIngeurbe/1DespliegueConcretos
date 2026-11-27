// ===== Estadística de baja resistencia: barras agrupadas por proyecto =====
(function () {
    'use strict';
    var contador = document.getElementById('analyticsCountIncumplimientos');
    var wrapper = contador && contador.closest('.analytics-wrapper');
    if (!wrapper) return;
    var caja = document.createElement('div');
    caja.className = 'br-card';
    caja.style.display = 'none';
    wrapper.appendChild(caja);

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }

    function dibujar() {
        var filas = datosActualesIncumplimientos || [];
        if (!filas.length) { caja.style.display = 'none'; return; }
        var ahora = new Date();
        var haceMes = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate()).getTime();
        var g = {};
        filas.forEach(function (r) {
            var p = r['Proyecto'] || 'Sin proyecto';
            var x = g[p] = g[p] || { total: 0, mes: 0, suma: 0, n: 0 };
            x.total++;
            if (typeof r['Toma'] === 'number' && r['Toma'] >= haceMes && r['Toma'] <= ahora.getTime()) x.mes++;
            var pct = parseFloat(r['Resistencia (%)']);
            if (isFinite(pct)) { x.suma += pct; x.n++; }
        });
        var nombres = Object.keys(g).sort(function (a, b) { return g[b].total - g[a].total; });
        var max = g[nombres[0]].total;
        var totalMes = nombres.reduce(function (s, p) { return s + g[p].mes; }, 0);

        var barra = function (clase, valor, i) {
            return '<div class="br-col"><b>' + valor.toLocaleString('es-CO') + '</b><i class="' + clase + '" style="height:' +
                (valor ? Math.max(3, valor / max * 100) : 0) + '%;animation-delay:' + (i * 0.06) + 's"></i></div>';
        };
        caja.innerHTML =
            '<div class="br-head"><span class="br-title">Muestras con baja resistencia</span><div class="br-legend">' +
            '<span><i class="br-a"></i>Consolidado <b>' + filas.length.toLocaleString('es-CO') + '</b></span>' +
            '<span><i class="br-b"></i>Último mes (por fecha de toma) <b>' + totalMes.toLocaleString('es-CO') + '</b></span></div></div>' +
            '<div class="br-plot">' + nombres.map(function (p, i) {
                var x = g[p];
                var tip = p + '\nConsolidado: ' + x.total + '\nÚltimo mes: ' + x.mes + (x.n ? '\nResultado promedio: ' + (x.suma / x.n).toFixed(1) + '%' : '');
                return '<div class="br-group" title="' + esc(tip) + '"><div class="br-bars">' + barra('br-a', x.total, i) + barra('br-b', x.mes, i) +
                    '</div><span class="br-name">' + esc(p) + '</span></div>';
            }).join('') + '</div>';
        caja.style.display = 'block';
    }

    // el contador se reescribe cada vez que se renderiza la tabla filtrada
    new MutationObserver(dibujar).observe(contador, { childList: true, characterData: true, subtree: true });
    // si no quedan filas, el código original oculta las tarjetas: se oculta también el gráfico
    var tarjeta = document.getElementById('analyticsCardIncumplimientos');
    new MutationObserver(dibujar).observe(tarjeta, { attributes: true, attributeFilter: ['style'] });
})();
