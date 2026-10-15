/* The planned-upkeep notice (14 Oct), the same one the app shows: read from
   /notice.json, shown until its window ends. Fills #notice on the page. */
(function () {
  var el = document.getElementById('notice'); if (!el || !window.fetch) return;
  fetch('/notice.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { notices: [] }; })
    .then(function (j) {
      var now = Date.now();
      var day = function (d) { return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); };
      var time = function (d) { return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
      (j.notices || []).filter(function (n) { return n && n.from && n.to && new Date(n.to).getTime() > now; })
        .forEach(function (n) {
          var a = new Date(n.from), z = new Date(n.to), on = a.getTime() <= now;
          var box = document.createElement('div'); box.className = 'box notice'; box.setAttribute('role', 'status');
          var h = document.createElement('h2');
          h.textContent = on ? 'Planned upkeep until ' + time(z) : 'Planned upkeep: ' + day(a) + ', ' + time(a) + ' to ' + time(z);
          var p = document.createElement('p'); p.style.margin = '.2rem 0 0';
          p.textContent = (n.what ? n.what + ' ' : '') + (on
            ? 'DwelLogs may not load or save for a bit. Anything you save waits on your phone and goes up when it is back.'
            : 'DwelLogs may not load or save for a bit then. Anything you save waits on your phone and goes up after.');
          box.appendChild(h); box.appendChild(p); el.appendChild(box);
        });
    }).catch(function () {});
})();
