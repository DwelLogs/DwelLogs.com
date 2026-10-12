/* Flipbooks: <figure class="flipbook"><ol><li><img><span class="cap">…</span></li>…</ol></figure>
   becomes one frame at a time, turning on its own. Tap the picture or Pause
   to stop it; Back and Next step by hand. Reduced motion asked for, or no
   script at all: the frames stay as numbered steps side by side (flipbook.css).
   A flipbook only turns while it is on screen, so a page with three of them
   is not flipping all three out of sight. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var EVERY = 2600;
  document.querySelectorAll('.flipbook').forEach(function (fig) {
    var items = [].slice.call(fig.querySelectorAll('li'));
    if (items.length < 2) return;
    var at = 0, timer = null, wanted = true, seen = false;
    items.forEach(function (li) { var c = li.querySelector('.cap'); if (c) c.setAttribute('data-n', items.length); });
    var bar = document.createElement('div'); bar.className = 'bar';
    bar.innerHTML = '<button type="button" data-do="back" aria-label="Back one">&lsaquo;</button>' +
      '<button type="button" data-do="play"></button>' +
      '<button type="button" data-do="next" aria-label="Next one">&rsaquo;</button>' +
      '<span class="dots" aria-hidden="true">' + items.map(function () { return '<span></span>'; }).join('') + '</span>';
    fig.appendChild(bar);
    var dots = [].slice.call(bar.querySelectorAll('.dots span')), play = bar.querySelector('[data-do=play]');
    function draw() {
      items.forEach(function (li, i) { li.classList.toggle('on', i === at); li.setAttribute('aria-hidden', i === at ? 'false' : 'true'); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === at); });
      play.textContent = timer ? 'Pause' : 'Play';
    }
    function go(i) { at = (i + items.length) % items.length; draw(); }
    function start() { if (!timer) timer = setInterval(function () { go(at + 1); }, EVERY); draw(); }
    function stop() { clearInterval(timer); timer = null; draw(); }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var d = b.getAttribute('data-do');
      if (d === 'play') { wanted = !timer; wanted ? start() : stop(); }
      else { wanted = false; stop(); go(at + (d === 'next' ? 1 : -1)); }
    });
    fig.querySelector('ol').addEventListener('click', function (e) {
      if (!e.target.closest('img')) return;
      wanted = !timer; wanted ? start() : stop();
    });
    fig.classList.add('playing');
    go(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { if (!seen) { seen = true; go(0); } if (wanted) start(); }
          else stop();
        });
      }, { threshold: 0.4 }).observe(fig);
    } else start();
  });
})();
