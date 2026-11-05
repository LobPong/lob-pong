(function () {
  var START = 2;      // seconds before the count begins
  var STEP = 1;       // seconds per counted point
  var END = START + 20 * STEP; // total reaches 20 here

  var PLAYERS = [
    { label: 'A1', x: 380, y: 235 },  // Server 1
    { label: 'B1', x: 380, y: 385 },  // Server 2 (example: B1 received)
    { label: 'A2', x: 820, y: 235 },  // Server 3
    { label: 'B2', x: 820, y: 385 }   // Server 4
  ];
  var ORDER_X = [330, 510, 690, 870];

  LobPong.register('service', {
    duration: 24,
    captions: [
      { t0: 0, t1: 2, text: 'The teams choose Server 1 by any method they agree on. Here, A1 serves first. Example: B1 received Server 1\'s serve.' },
      { t0: 2, t1: 7, text: 'Count every point in the game. Lobs count in full. At totals 0 to 4, Server 1 (A1) serves.' },
      { t0: 7, t1: 12, text: 'Service changes every 5 points. At totals 5 to 9, Server 2 serves. This is the Team B player who received Server 1\'s serve (B1 or B2). In this example, B1 received it.' },
      { t0: 12, t1: 17, text: 'At totals 10 to 14, Server 3 serves. This is A2, the partner of Server 1.' },
      { t0: 17, t1: 22, text: 'At totals 15 to 19, Server 4 serves. This is the other Team B player. In this example, B2.' },
      { t0: 22, t1: 24, text: 'At 20 the remainder is 0, so the order starts again with Server 1.' }
    ],
    mount: function (svg) {
      var S = LobPong.svg, seg = LobPong.seg, lerp = LobPong.lerp;

      // Table
      S('rect', { x: 150, y: 140, width: 900, height: 340, rx: 16, style: 'fill:var(--court);stroke:var(--line);stroke-width:4' }, svg);
      S('line', { x1: 150, y1: 310, x2: 1050, y2: 310, style: 'stroke:var(--line);stroke-width:4' }, svg);
      var tA = S('text', { x: 600, y: 190, 'text-anchor': 'middle', 'font-size': 34, style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      tA.textContent = 'Team A';
      var tB = S('text', { x: 600, y: 462, 'text-anchor': 'middle', 'font-size': 34, style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      tB.textContent = 'Team B';

      // Counter and formula
      var counter = S('text', { x: 600, y: 82, 'text-anchor': 'middle', 'font-size': 56, 'font-weight': 700, style: 'fill:var(--ink);font-family:var(--font)' }, svg);
      var formula = S('text', { x: 600, y: 568, 'text-anchor': 'middle', 'font-size': 34, style: 'fill:var(--ink);font-family:var(--font)' }, svg);

      var example = S('text', { x: 600, y: 608, 'text-anchor': 'middle', 'font-size': 34, style: 'fill:var(--ink);font-family:var(--font)' }, svg);
      example.textContent = 'Example: B1 received Server 1\'s serve';

      // Players
      var discs = PLAYERS.map(function (p, i) {
        var g = S('g', {}, svg);
        S('circle', { cx: p.x, cy: p.y, r: 58, style: 'fill:var(--ground);stroke:var(--main);stroke-width:6' }, g);
        var hi = S('circle', { cx: p.x, cy: p.y, r: 58, style: 'fill:var(--accent);stroke:var(--accent);stroke-width:6' }, g);
        var tx = S('text', { x: p.x, y: p.y + 13, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 700, style: 'fill:var(--ink);font-family:var(--font)' }, g);
        tx.textContent = p.label;
        var badge = S('g', {}, g);
        S('circle', { cx: p.x + 52, cy: p.y - 52, r: 26, style: 'fill:var(--main)' }, badge);
        var bt = S('text', { x: p.x + 52, y: p.y - 42, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700, style: 'fill:var(--ground);font-family:var(--font)' }, badge);
        bt.textContent = String(i + 1);
        return { g: g, hi: hi, badge: badge };
      });

      // Order line
      var orderLabel = S('text', { x: 130, y: 650, 'font-size': 34, style: 'fill:var(--muted);font-family:var(--font)' }, svg);
      orderLabel.textContent = 'Order:';
      var items = PLAYERS.map(function (p, i) {
        return S('text', { x: ORDER_X[i], y: 650, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 700, style: 'fill:var(--ink);font-family:var(--font)' }, svg);
      });
      var arrows = [0, 1, 2].map(function (i) {
        var a = S('text', { x: (ORDER_X[i] + ORDER_X[i + 1]) / 2, y: 650, 'text-anchor': 'middle', 'font-size': 36, style: 'fill:var(--muted);font-family:var(--font)' }, svg);
        a.textContent = '→';
        return a;
      });
      items.forEach(function (it, i) { it.textContent = PLAYERS[i].label; });

      return {
        render: function (t) {
          var n = Math.min(20, Math.floor(Math.max(0, t - START) / STEP + 1e-9));
          var r = n % 20;
          var q = Math.floor(n / 20);
          var server = Math.floor(r / 5);
          var who = ['(A1)', '(B1 or B2)', '(A2)', '(other B player)'][server];
          counter.textContent = 'Total points: ' + n;
          formula.textContent = n + ' ÷ 20 = ' + q + ', remainder ' + r + '  →  Server ' + (server + 1) + ' ' + who;

          var settle = seg(t, START + 20 * STEP, START + 20 * STEP + 1); // after total 20

          for (var k = 0; k < 4; k++) {
            var tin = START + 5 * k * STEP;
            var tout = START + 5 * (k + 1) * STEP;
            var inP = k === 0 ? 1 : seg(t, tin, tin + 1);
            var outP = seg(t, tout, tout + 1);
            var a = inP * (1 - outP);
            var ai = Math.max(a * (1 - settle), 0);
            discs[k].hi.setAttribute('opacity', ai.toFixed(3));
            discs[k].g.setAttribute('opacity', lerp(0.4, 1, Math.max(a, settle)).toFixed(3));
            var shown = k === 0 ? 1 : seg(t, tin, tin + 1);
            discs[k].badge.setAttribute('opacity', shown.toFixed(3));
            items[k].setAttribute('opacity', lerp(0.25, 1, shown).toFixed(3));
            if (k > 0) arrows[k - 1].setAttribute('opacity', lerp(0.25, 1, shown).toFixed(3));
          }
          arrows[0].setAttribute('opacity', lerp(0.25, 1, seg(t, START + 5 * STEP, START + 5 * STEP + 1)).toFixed(3));
        }
      };
    }
  });
})();
