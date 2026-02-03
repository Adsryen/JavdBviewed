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
  function setText(id, text){
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function fmtPct(x){ if (typeof x !== 'number' || !isFinite(x)) return '-'; return (x*100).toFixed(1) + '%'; }
  function trendWord(slope){ if (typeof slope !== 'number') return '-'; if (slope > 0.1) return '上升'; if (slope < -0.1) return '回落'; return '平稳'; }
  function renderKpis(stats){
    try{
      var m = (stats && stats.metrics) || {};
      setText('kpi-top3', fmtPct(m.concentrationTop3));
      setText('kpi-hhi', (typeof m.hhi==='number' && isFinite(m.hhi)) ? m.hhi.toFixed(4) : '-');
      setText('kpi-entropy', (typeof m.entropy==='number' && isFinite(m.entropy)) ? m.entropy.toFixed(2) : '-');
      setText('kpi-trend', trendWord(m.trendSlope));
    } catch{}
  }
  function renderRanking(stats){
    try{
      var body = document.getElementById('ranking-body');
      var top = (stats && (stats.tagsTop || stats.topTags)) || [];
      if (!body){ return; }
      var hasStatic = !!(body.innerHTML && body.innerHTML.trim().length);
      if (!top.length){
        // 若无可用数据，但模板已渲染静态行，则保留，不隐藏
        if (!hasStatic){
          var sec = document.getElementById('ranking');
          if (sec) sec.style.display = 'none';
        }
        return;
      }
      var total = (stats.metrics && stats.metrics.totalAll) || top.reduce(function(s, t){ return s + (t.count||0); }, 0) || 1;
      body.innerHTML = '';
      top.forEach(function(t, i){
        var tr = document.createElement('tr');
        var ratio = (typeof t.ratio === 'number') ? t.ratio : (t.count/total);
        tr.innerHTML = '<td>'+(i+1)+'</td><td>'+String(t.name||'')+'</td><td>'+(t.count||0)+'</td><td>'+fmtPct(ratio)+'</td>';
        body.appendChild(tr);
      });
    } catch{}
  }
  function renderCharts(stats) {
    var echarts = safeEcharts();
    if (!stats) { renderFallback(); return; }
    // KPI & 排行优先渲染（不依赖 ECharts）
    renderKpis(stats);
    renderRanking(stats);
    // 图表部分缺少 ECharts 时仅回退图表占位
    if (!echarts) { renderFallback(); return; }
    try {
      // Pie: tagsTop
      var pieEl = document.getElementById('tags-pie');
      var topArr = (stats && (stats.tagsTop || stats.topTags)) || [];
      if (pieEl && topArr.length) {
        var pie = echarts.init(pieEl);
        pie.setOption({
          title: { text: '标签占比', left: 'center' },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie', radius: '60%',
            data: topArr.map(function(t){ return { name: t.name, value: t.count }; })
          }]
        });
      } else { if (pieEl) pieEl.style.display='none'; }
      // Bar: topN
      var barEl = document.getElementById('tags-top-bar');
      if (barEl && topArr.length) {
        var bar = echarts.init(barEl);
        var cats = topArr.map(function(t){ return t.name; });
        var vals = topArr.map(function(t){ return t.count; });
        bar.setOption({
          title: { text: 'Top 标签计数', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: cats },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: vals }]
        });
      } else { if (barEl) barEl.style.display='none'; }
      // Line: trend
      var lineEl = document.getElementById('trend-line');
      if (lineEl && (stats.trend||[]).length) {
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
      } else { if (lineEl) lineEl.style.display='none'; }
    } catch (e) {
      renderFallback();
    }
  }
  try {
    onReady(function(){
      waitForEcharts(5000).then(function(){
        var s = parseStats();
        if (!s) s = { tagsTop: [], trend: [] };
        renderCharts(s);
      });
    });
  } catch {}
})();
