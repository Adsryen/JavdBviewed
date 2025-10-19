(function () {
  function parseStats() {
    try {
      var tpl = document.getElementById('insights-data');
      if (!tpl) return null;
      var text = tpl.textContent || '';
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) { return null; }
  }
  function safeEcharts() {
    try { return window.echarts; } catch { return undefined; }
  }
  function waitForEcharts(ms) {
    var timeout = typeof ms === 'number' ? ms : 4000;
    var start = Date.now();
    return new Promise(function(resolve){
      (function loop(){
        var e = safeEcharts();
        if (e) return resolve(e);
        if (Date.now() - start >= timeout) return resolve(null);
        setTimeout(loop, 50);
      })();
    });
  }
  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      try { document.addEventListener('DOMContentLoaded', fn); } catch { setTimeout(fn, 0);} 
    }
  }
  function renderFallback() {
    try {
      var charts = ['tags-pie','tags-top-bar','trend-line'];
      charts.forEach(function(id){
        var el = document.getElementById(id);
        if (el) {
          var p = document.createElement('div');
          p.style.color = '#888';
          p.style.fontSize = '12px';
          p.textContent = '图表未启用（缺少 ECharts 或数据为空）。';
          el.appendChild(p);
        }
      });
    } catch {}
  }
  function renderCharts(stats) {
    var echarts = safeEcharts();
    if (!echarts || !stats) { renderFallback(); return; }
    try {
      // Pie: tagsTop
      var pieEl = document.getElementById('tags-pie');
      if (pieEl) {
        var pie = echarts.init(pieEl);
        pie.setOption({
          title: { text: '标签占比', left: 'center' },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie', radius: '60%',
            data: (stats.tagsTop||[]).map(function(t){ return { name: t.name, value: t.count }; })
          }]
        });
      }
      // Bar: topN
      var barEl = document.getElementById('tags-top-bar');
      if (barEl) {
        var bar = echarts.init(barEl);
        var cats = (stats.tagsTop||[]).map(function(t){ return t.name; });
        var vals = (stats.tagsTop||[]).map(function(t){ return t.count; });
        bar.setOption({
          title: { text: 'Top 标签计数', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: cats },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: vals }]
        });
      }
      // Line: trend
      var lineEl = document.getElementById('trend-line');
      if (lineEl) {
        var line = echarts.init(lineEl);
        var x = (stats.trend||[]).map(function(p){ return p.date; });
        var y = (stats.trend||[]).map(function(p){ return p.total; });
        line.setOption({
          title: { text: '每日标签总计趋势', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: x },
          yAxis: { type: 'value' },
          series: [{ type: 'line', data: y, smooth: true }]
        });
      }
    } catch (e) {
      renderFallback();
    }
  }
  try {
    onReady(function(){
      waitForEcharts(5000).then(function(e){
        if (!e) { renderFallback(); return; }
        var s = parseStats();
        if (!s) s = { tagsTop: [], trend: [] };
        renderCharts(s);
      });
    });
  } catch {}
})();
