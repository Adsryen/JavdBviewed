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
  function loadScriptOnce(src, id) {
    return new Promise(function(resolve){
      try {
        if (id && document.getElementById(id)) { resolve(true); return; }
        var s = document.createElement('script');
        if (id) s.id = id;
        s.src = src;
        s.async = false;
        s.onload = function(){ resolve(true); };
        s.onerror = function(){ resolve(false); };
        (document.head || document.body || document.documentElement).appendChild(s);
      } catch { resolve(false); }
    });
  }
  function waitForEcharts(ms) {
    var timeout = typeof ms === 'number' ? ms : 8000;
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
  function hydrateDOM(payload){
    try {
      if (!payload) return;
      var base = document.querySelector('base');
      if (payload.baseHref && base) base.setAttribute('href', payload.baseHref);
      var setText = function(id, text){ try { var el = document.getElementById(id); if (el) el.textContent = text || ''; } catch {} };
      var setHTML = function(id, html){ try { var el = document.getElementById(id); if (el) el.innerHTML = html || ''; } catch {} };
      setText('report-title', payload.reportTitle || '');
      setText('period-text', payload.periodText || '');
      setText('summary-text', payload.summary || '');
      setHTML('insights', payload.insightList || '');
      setText('methodology-text', payload.methodology || '');
      var footer = '生成时间：' + (payload.generatedAt||'') + ' · 版本：' + (payload.version||'');
      setText('footer-text', footer);
      if (payload.statsJSON) {
        var tpl = document.getElementById('insights-data');
        if (tpl) tpl.textContent = payload.statsJSON;
      }
    } catch {}
  }
  function renderCharts(stats) {
    var echarts = safeEcharts();
    if (!echarts || !stats) { renderFallback(); return; }
    try {
      var pieEl = document.getElementById('tags-pie');
      if (pieEl) {
        var pie = echarts.init(pieEl);
        pie.setOption({
          title: { text: '标签占比', left: 'center' },
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: '60%', data: (stats.tagsTop||[]).map(function(t){ return { name: t.name, value: t.count }; }) }]
        });
      }
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
    } catch (e) { renderFallback(); }
  }
  onReady(function(){
    var proceed = function(payload){
      try { hydrateDOM(payload); } catch {}
      var stats = parseStats();
      if (!stats && payload && payload.statsJSON) { try { stats = JSON.parse(payload.statsJSON); } catch {} }
      if (!safeEcharts()) {
        loadScriptOnce('assets/templates/echarts.min.js', 'echarts-script').then(function(){
          waitForEcharts(12000).then(function(e){ if (!e) { renderFallback(); return; } renderCharts(stats || { tagsTop: [], trend: [] }); });
        });
      } else {
        renderCharts(stats || { tagsTop: [], trend: [] });
      }
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.storage.local.get) {
        chrome.storage.local.get('insights_preview_payload', function(res){ proceed(res && res.insights_preview_payload); });
      } else {
        proceed(null);
      }
    } catch { proceed(null); }
  });
})();
