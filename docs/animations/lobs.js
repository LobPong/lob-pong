(function () {
  var seg = LobPong.seg;
  var lerp = LobPong.lerp;
  var ease = LobPong.ease;

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  // Player discs (top-down view). Team A on the left, Team B on the right.
  var PLAYERS = {
    A1: { x: 90, y: 260 },
    A2: { x: 90, y: 440 },
    B1: { x: 1110, y: 260 },
    B2: { x: 1110, y: 440 }
  };

  // Ball paths. Each leg moves the ball along an arc. h is the arc height.
  var LEGS = [
    // Scene 1: one-hit return by A1, then a scoring lob by B1 and B2.
    { t0: 1, t1: 3, from: [200, 260], to: [850, 300], h: 70 },
    { t0: 3.6, t1: 4.8, from: [850, 300], to: [900, 440], h: 30 },
    { t0: 5.2, t1: 7, from: [900, 440], to: [320, 440], h: 70 },
    // Jump to the serve spot while the ball is hidden.
    { t0: 9.2, t1: 9.2, from: [200, 260], to: [200, 260], h: 0 },
    // Scene 2: serve, one-hit return, lob by A, lob by B that scores.
    { t0: 10.5, t1: 12.3, from: [200, 260], to: [850, 260], h: 70 },
    { t0: 12.8, t1: 14.4, from: [850, 260], to: [400, 260], h: 70 },
    { t0: 14.9, t1: 16, from: [400, 260], to: [300, 440], h: 30 },
    { t0: 16.3, t1: 18, from: [300, 440], to: [800, 440], h: 70 },
    { t0: 18.5, t1: 19.6, from: [800, 440], to: [850, 300], h: 30 },
    { t0: 19.9, t1: 21.5, from: [850, 300], to: [350, 300], h: 70 }
  ];

  // Active windows for the player discs. s is the time of the ball-strike.
  var WINDOWS = [
    { p: 'A1', s: 1, role: 'setter' },
    { p: 'B1', s: 3.6, role: 'setter' },
    { p: 'B2', s: 5.2, role: 'spiker' },
    { p: 'B1', s: 12.8, role: 'setter' },
    { p: 'A1', s: 14.9, role: 'setter' },
    { p: 'A2', s: 16.3, role: 'spiker' },
    { p: 'B2', s: 18.5, role: 'setter' },
    { p: 'B1', s: 19.9, role: 'spiker' }
  ];

  function ballAt(t) {
    var x = LEGS[0].from[0];
    var y = LEGS[0].from[1];
    var lift = 0;
    for (var i = 0; i < LEGS.length; i++) {
      var g = LEGS[i];
      if (t < g.t0) { break; }
      if (t >= g.t1) {
        x = g.to[0]; y = g.to[1]; lift = 0;
      } else {
        var p = ease(seg(t, g.t0, g.t1));
        var lin = seg(t, g.t0, g.t1);
        x = lerp(g.from[0], g.to[0], p);
        y = lerp(g.from[1], g.to[1], p);
        lift = g.h * Math.sin(Math.PI * lin);
      }
    }
    return { x: x, y: y, lift: lift };
  }

  function winOpacity(t, s) {
    return clamp01(seg(t, s - 1, s) - seg(t, s + 0.5, s + 1.5));
  }

  LobPong.register('lobs', {
    duration: 25,
    captions: [
      { t0: 0, t1: 3, text: 'Team A makes a one-hit return. Only A1 touches the ball.' },
      { t0: 3, t1: 5, text: 'Team B lobs. B1 is the setter and makes the first ball-strike.' },
      { t0: 5, t1: 7.2, text: 'B2 is the spiker and makes the second ball-strike. The lob scores.' },
      { t0: 7.2, t1: 9.5, text: 'A lob that scores directly after a one-hit return is worth 2 points.' },
      { t0: 9.5, t1: 12.5, text: 'Now a longer rally. Team A serves. The serve is not a return.' },
      { t0: 12.5, t1: 14.7, text: 'Team B returns the serve with one ball-strike.' },
      { t0: 14.7, t1: 18.3, text: 'Team A lobs. A1 is the setter and A2 is the spiker.' },
      { t0: 18.3, t1: 21.7, text: 'Team B lobs back. B2 is the setter and B1 is the spiker. The lob scores.' },
      { t0: 21.7, t1: 23.4, text: 'There are 2 lobs in a row, including the scoring lob. So N is 2.' },
      { t0: 23.4, t1: 25.1, text: 'A lob that scores after a lob by the opponents is worth N + 1 points. Here that is 3 points.' }
    ],
    mount: function (svg) {
      var S = LobPong.svg;

      // Table, centre line and net.
      S('rect', { x: 170, y: 100, width: 860, height: 460, rx: 8,
        style: 'fill:var(--court);stroke:var(--line);stroke-width:6' }, svg);
      S('line', { x1: 170, y1: 330, x2: 1030, y2: 330,
        style: 'stroke:var(--line);stroke-width:3;stroke-dasharray:14 12' }, svg);
      S('line', { x1: 600, y1: 90, x2: 600, y2: 570,
        style: 'stroke:var(--ink);stroke-width:8' }, svg);
      var net = S('text', { x: 600, y: 84, 'text-anchor': 'middle', 'font-size': 34,
        style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      net.textContent = 'Net';

      // Scene titles.
      var title1 = S('text', { x: 600, y: 40, 'text-anchor': 'middle', 'font-size': 36,
        style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
      title1.textContent = 'Lob after a one-hit return';
      var title2 = S('text', { x: 600, y: 40, 'text-anchor': 'middle', 'font-size': 36,
        style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
      title2.textContent = 'Lob after a lob';

      // Team names.
      var ta = S('text', { x: 90, y: 180, 'text-anchor': 'middle', 'font-size': 34,
        style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      ta.textContent = 'Team A';
      var tb = S('text', { x: 1110, y: 180, 'text-anchor': 'middle', 'font-size': 34,
        style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      tb.textContent = 'Team B';

      // Player discs with labels.
      var names = ['A1', 'A2', 'B1', 'B2'];
      names.forEach(function (n) {
        var p = PLAYERS[n];
        S('circle', { cx: p.x, cy: p.y, r: 46,
          style: 'fill:var(--main);stroke:var(--ink);stroke-width:3' }, svg);
      });

      // Active overlays and role labels, one per window.
      var wins = WINDOWS.map(function (w) {
        var p = PLAYERS[w.p];
        var disc = S('circle', { cx: p.x, cy: p.y, r: 46, opacity: 0,
          style: 'fill:var(--accent);stroke:var(--ink);stroke-width:3' }, svg);
        var role = S('text', { x: p.x, y: p.y + 92, 'text-anchor': 'middle', 'font-size': 34,
          opacity: 0, style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
        role.textContent = w.role;
        return { w: w, disc: disc, role: role };
      });

      names.forEach(function (n) {
        var p = PLAYERS[n];
        var lbl = S('text', { x: p.x, y: p.y + 12, 'text-anchor': 'middle', 'font-size': 34,
          style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
        lbl.textContent = n;
      });

      // Ball: shadow stays on the table, the ball rises on its arc.
      var shadow = S('ellipse', { cx: 0, cy: 0, rx: 14, ry: 8, opacity: 0.4,
        style: 'fill:var(--muted)' }, svg);
      var ball = S('circle', { cx: 0, cy: 0, r: 16,
        style: 'fill:var(--ink);stroke:var(--accent);stroke-width:4' }, svg);

      // Scene 1 label.
      var pts2 = S('text', { x: 600, y: 622, 'text-anchor': 'middle', 'font-size': 44,
        style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
      pts2.textContent = 'One-hit return, then a scoring lob: 2 points';

      // Scene 2 labels.
      var cnt1 = S('text', { x: 600, y: 614, 'text-anchor': 'middle', 'font-size': 34,
        style: 'fill:var(--ink);font-family:var(--font)' }, svg);
      cnt1.textContent = 'Consecutive lobs: 1';
      var cnt2 = S('text', { x: 600, y: 614, 'text-anchor': 'middle', 'font-size': 34,
        style: 'fill:var(--ink);font-family:var(--font)' }, svg);
      cnt2.textContent = 'Consecutive lobs: 2, including the scoring lob';
      var pts3 = S('text', { x: 600, y: 670, 'text-anchor': 'middle', 'font-size': 40,
        style: 'fill:var(--ink);font-family:var(--font);font-weight:700' }, svg);
      pts3.textContent = 'N + 1 = 2 + 1 = 3 points';

      return {
        render: function (t) {
          // Scene titles and labels.
          var scene1 = 1 - seg(t, 8.5, 9.5);
          var scene2 = seg(t, 9.5, 10.5);
          title1.setAttribute('opacity', scene1);
          title2.setAttribute('opacity', scene2);
          pts2.setAttribute('opacity', seg(t, 7, 8) * scene1);
          cnt1.setAttribute('opacity', seg(t, 18, 19) * (1 - seg(t, 21.5, 22.5)));
          cnt2.setAttribute('opacity', seg(t, 21.5, 22.5));
          pts3.setAttribute('opacity', seg(t, 22.5, 23.5));

          // Ball.
          var b = ballAt(t);
          var vis = clamp01(1 - seg(t, 8, 9) + seg(t, 9.5, 10.5));
          shadow.setAttribute('cx', b.x);
          shadow.setAttribute('cy', b.y + 6);
          shadow.setAttribute('opacity', 0.4 * vis);
          ball.setAttribute('cx', b.x);
          ball.setAttribute('cy', b.y - b.lift);
          ball.setAttribute('r', 16 + b.lift * 0.08);
          ball.setAttribute('opacity', vis);

          // Active players.
          wins.forEach(function (o) {
            var a = winOpacity(t, o.w.s);
            o.disc.setAttribute('opacity', a);
            o.role.setAttribute('opacity', a);
          });
        }
      };
    }
  });
})();
