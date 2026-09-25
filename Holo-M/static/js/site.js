// Shared behaviour for every version: synchronized pairs, lazy loading, speed switch, tabs, mosaic filter and lightbox.
(function(){
  function play(v){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }
  function ensureSrc(v){ if(!v.src && v.dataset.src){ v.src=v.dataset.src; v.load(); } }
  // pairs
  var pairs=Array.prototype.slice.call(document.querySelectorAll('[data-pair]'));
  pairs.forEach(function(p){
    var a=p.querySelector('video.main'), bs=Array.prototype.slice.call(p.querySelectorAll('video.follower')); if(!a) return;
    function follow(){ bs.forEach(function(b){ if(Math.abs(a.currentTime-b.currentTime)>0.12) b.currentTime=a.currentTime; }); }
    a.addEventListener('play', function(){ bs.forEach(function(b){ ensureSrc(b); }); follow(); bs.forEach(play); });
    a.addEventListener('pause', function(){ bs.forEach(function(b){ b.pause(); }); follow(); });
    a.addEventListener('seeked', follow); a.addEventListener('ratechange', function(){ bs.forEach(function(b){ b.playbackRate=a.playbackRate; }); });
    setInterval(function(){ if(!a.paused && a.duration) follow(); }, 1500);
    bs.forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); if(a.paused) play(a); else a.pause(); }); });
    if(!a.hasAttribute('controls')) a.addEventListener('click', function(){ if(a.paused) play(a); else a.pause(); });
    p._start=function(){ ensureSrc(a); bs.forEach(ensureSrc); var g=p.closest('[data-group]'); var r=g? +(g.dataset.rate||1):1; a.playbackRate=r; bs.forEach(function(b){ b.playbackRate=r; }); play(a); };
    p._stop=function(){ a.pause(); };
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var p=e.target; if(e.isIntersecting){ if(p._start) p._start(); } else { if(p._stop) p._stop(); } }); }, {rootMargin:'300px 0px', threshold:0.05});
    pairs.forEach(function(p){ io.observe(p); });
  } else { pairs.forEach(function(p){ if(p._start) p._start(); }); }
  // speed switch + pause for a group of pairs
  Array.prototype.forEach.call(document.querySelectorAll('[data-group]'), function(g){
    var vids=function(){ return Array.prototype.slice.call(g.querySelectorAll('video')); };
    g.querySelectorAll('[data-speed]').forEach(function(b){ b.addEventListener('click', function(){
      g.dataset.rate=b.dataset.speed; g.querySelectorAll('[data-speed]').forEach(function(x){ x.classList.toggle('on', x===b); }); vids().forEach(function(v){ v.playbackRate=+b.dataset.speed; }); }); });
    var pp=g.querySelector('[data-pp]'); if(pp) pp.addEventListener('click', function(){ var mains=Array.prototype.slice.call(g.querySelectorAll('video.main')); var anyPlaying=mains.some(function(v){ return !v.paused; });
      mains.forEach(function(v){ if(anyPlaying) v.pause(); else play(v); }); pp.innerHTML = anyPlaying ? '&#9654;' : '&#9646;&#9646;'; });
  });
  // tabs
  Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function(t){
    var btns=t.querySelectorAll('button[data-tab]'), panels=t.parentElement.querySelectorAll(':scope > .tabpanel');
    btns.forEach(function(b){ b.addEventListener('click', function(){ btns.forEach(function(x){ x.classList.toggle('on', x===b); }); panels.forEach(function(p){ var on=p.id===b.dataset.tab; p.classList.toggle('on', on); if(on){ p.querySelectorAll('[data-pair]').forEach(function(q){ if(q._start) q._start(); }); } else { p.querySelectorAll('video').forEach(function(v){ v.pause(); }); } }); }); });
  });
  // mosaic filter + hover play + lightbox
  var chips=document.querySelectorAll('[data-filter]'); chips.forEach(function(c){ c.addEventListener('click', function(){ chips.forEach(function(x){ x.classList.toggle('on', x===c); });
    document.querySelectorAll('.tile').forEach(function(t){ t.classList.toggle('hidden', c.dataset.filter!=='all' && t.dataset.task!==c.dataset.filter && t.dataset.kind!==c.dataset.filter); }); }); });
  Array.prototype.forEach.call(document.querySelectorAll('.tile'), function(t){
    var v=t.querySelector('video'); if(v){ t.addEventListener('mouseenter', function(){ ensureSrc(v); play(v); }); t.addEventListener('mouseleave', function(){ v.pause(); }); }
    t.addEventListener('click', function(){ var lb=document.getElementById('lightbox'); if(!lb) return; var inner=lb.querySelector('.inner'); inner.innerHTML=t.querySelector('template').innerHTML; lb.classList.add('on');
      var p=inner.querySelector('[data-pair]'); var a=p.querySelector('video.main'), bs=p.querySelectorAll('video.follower'); a.addEventListener('play',function(){ bs.forEach(function(b){ b.currentTime=a.currentTime; play(b); }); }); a.addEventListener('pause',function(){ bs.forEach(function(b){ b.pause(); }); }); a.addEventListener('seeked',function(){ bs.forEach(function(b){ b.currentTime=a.currentTime; }); }); play(a); });
  });
  var lb=document.getElementById('lightbox'); if(lb){ lb.querySelector('.close').addEventListener('click', function(){ lb.classList.remove('on'); lb.querySelector('.inner').innerHTML=''; }); lb.addEventListener('click', function(e){ if(e.target===lb){ lb.classList.remove('on'); lb.querySelector('.inner').innerHTML=''; } }); }
})();
(function(){
  var tip=document.createElement('div'); tip.className='viztip'; document.body.appendChild(tip);
  function show(e,el){ tip.textContent=''; el.dataset.tip.split('|').forEach(function(l,i){ var n=i===0?document.createElement('b'):document.createElement('div'); n.textContent=l; tip.appendChild(n); }); tip.style.display='block'; move(e); }
  function move(e){ var x=e.clientX+14, y=e.clientY+14; if(x+tip.offsetWidth>window.innerWidth-8) x=e.clientX-tip.offsetWidth-10; if(y+tip.offsetHeight>window.innerHeight-8) y=e.clientY-tip.offsetHeight-10; tip.style.left=x+'px'; tip.style.top=y+'px'; }
  document.querySelectorAll('.viz [data-tip]').forEach(function(el){ el.setAttribute('tabindex','0'); el.addEventListener('pointerenter',function(e){ show(e,el); }); el.addEventListener('pointermove',move); el.addEventListener('pointerleave',function(){ tip.style.display='none'; });
    el.addEventListener('focus',function(){ var r=el.getBoundingClientRect(); show({clientX:r.left+r.width/2,clientY:r.top},el); }); el.addEventListener('blur',function(){ tip.style.display='none'; }); });
  document.querySelectorAll('.viz [data-view]').forEach(function(b){ b.addEventListener('click',function(){ var v=b.closest('.viz'); v.classList.toggle('table', b.dataset.view==='table'); v.querySelectorAll('[data-view]').forEach(function(x){ x.classList.toggle('on', x===b); }); }); });
})();
