(function () {
  var seg = LobPong.seg;
  var ease = LobPong.ease;
  var lerp = LobPong.lerp;

  var BASE_X = 360;       // spiker centre when behind the line
  var LINE_X = 560;       // offside line (back edge of the table)
  var TOP_Y = 400;        // tabletop surface height
  var BODY_W = 190;

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  LobPong.register('offside', {
    duration: 25,
    captions: [
      { t0: 0, t1: 3, text: 'Side view of one end of the table. The bold line is the offside line. It is the back edge of the table on the spiker’s end.' },
      { t0: 3, t1: 7, text: 'The spiker strikes the ball with the lower body behind the line. This is legal.' },
      { t0: 7, t1: 11.5, text: 'Now the spiker steps toward the table. The lower body is the part below the height of the tabletop.' },
      { t0: 11.5, t1: 14, text: 'The lower body is not behind the line at the strike. The opposing team scores a point.' },
      { t0: 14, t1: 19, text: 'Next, the lower body stays behind the line. The spiker may lean over the line with the upper body.' },
      { t0: 19, t1: 22, text: 'Leaning over the line with the upper body is allowed.' },
      { t0: 22, t1: 25, text: 'Legal: the lower body is behind the line at the strike. Foul: the lower body is not behind the line, and the opposing team scores a point.' }
    ],
    mount: function (svg) {
      var S = LobPong.svg;
      var TXT = 'fill:var(--ink);font-family:var(--font)';

      // ground and table
      S('line', { x1: 40, y1: 604, x2: 1160, y2: 604, style: 'stroke:var(--muted);stroke-width:3' }, svg);
      S('rect', { x: 1090, y: 424, width: 24, height: 180, style: 'fill:var(--muted)' }, svg);
      S('rect', { x: LINE_X, y: TOP_Y, width: 1160 - LINE_X, height: 24, rx: 4, style: 'fill:var(--court);stroke:var(--line);stroke-width:3' }, svg);
      S('text', { x: 860, y: 476, 'text-anchor': 'middle', 'font-size': 34, style: TXT }, svg).textContent = 'Table';

      // tabletop height guide behind the line
      S('line', { x1: 40, y1: TOP_Y, x2: LINE_X, y2: TOP_Y, style: 'stroke:var(--muted);stroke-width:3;stroke-dasharray:14 10' }, svg);

      // offside line with accent highlight
      S('line', { x1: LINE_X, y1: 200, x2: LINE_X, y2: 604, style: 'stroke:var(--accent);stroke-width:26;stroke-linecap:round;opacity:0.3' }, svg);
      S('line', { x1: LINE_X, y1: 200, x2: LINE_X, y2: 604, style: 'stroke:var(--accent);stroke-width:8;stroke-linecap:round' }, svg);
      S('text', { x: LINE_X, y: 184, 'text-anchor': 'middle', 'font-size': 34, style: TXT + ';font-weight:700' }, svg).textContent = 'Offside line';
      S('text', { x: 40, y: 250, 'font-size': 34, style: 'fill:var(--muted);font-family:var(--font)' }, svg).textContent = 'Behind the line';

      // spiker: lower part (below tabletop height)
      var lower = S('g', {}, svg);
      S('rect', { x: BASE_X - BODY_W / 2, y: TOP_Y + 4, width: BODY_W, height: 196, rx: 14, style: 'fill:var(--ground);stroke:var(--main);stroke-width:5' }, lower);
      var lowerFoul = S('rect', { x: BASE_X - BODY_W / 2, y: TOP_Y + 4, width: BODY_W, height: 196, rx: 14, opacity: 0, style: 'fill:var(--accent);stroke:var(--accent);stroke-width:5;fill-opacity:0.45' }, lower);
      S('text', { x: BASE_X, y: 512, 'text-anchor': 'middle', 'font-size': 34, style: TXT }, lower).textContent = 'Lower body';

      // spiker: upper part
      var upper = S('g', {}, svg);
      S('rect', { x: BASE_X - BODY_W / 2, y: TOP_Y - 110, width: BODY_W, height: 106, rx: 14, style: 'fill:var(--ground);stroke:var(--main);stroke-width:5' }, upper);
      S('text', { x: BASE_X, y: TOP_Y - 48, 'text-anchor': 'middle', 'font-size': 34, style: TXT }, upper).textContent = 'Upper body';

      // ball
      var ball = S('circle', { cx: 780, cy: 235, r: 22, style: 'fill:var(--ink);stroke:var(--ground);stroke-width:3' }, svg);

      // status boxes
      function box(text, stroke) {
        var g = S('g', { opacity: 0 }, svg);
        S('rect', { x: 170, y: 36, width: 860, height: 84, rx: 16, style: 'fill:var(--ground);stroke:var(' + stroke + ');stroke-width:6' }, g);
        S('text', { x: 600, y: 90, 'text-anchor': 'middle', 'font-size': 34, style: TXT + ';font-weight:700' }, g).textContent = text;
        return g;
      }
      var legal = box('Legal: lower body behind the line', '--main');
      var foul = box('Foul: the opposing team scores a point', '--accent');
      var lean = box('Leaning is allowed', '--main');

      // summary panel
      var sum = S('g', { opacity: 0 }, svg);
      S('rect', { x: 170, y: 12, width: 860, height: 138, rx: 16, style: 'fill:var(--ground);stroke:var(--line);stroke-width:4' }, sum);
      S('text', { x: 200, y: 62, 'font-size': 34, style: TXT + ';font-weight:700' }, sum).textContent = 'Legal: lower body behind the line';
      S('text', { x: 200, y: 114, 'font-size': 34, style: TXT + ';font-weight:700' }, sum).textContent = 'Foul: lower body not behind the line';
      S('rect', { x: 176, y: 36, width: 10, height: 34, style: 'fill:var(--main)' }, sum);
      S('rect', { x: 176, y: 88, width: 10, height: 34, style: 'fill:var(--accent)' }, sum);

      function window4(t, a, b, c, d) {
        // fade in a..b, hold, fade out c..d
        return Math.min(seg(t, a, b), 1 - seg(t, c, d));
      }

      return {
        render: function (t) {
          // lower body x
          var lx = BASE_X;
          lx = lerp(lx, 520, ease(seg(t, 7, 9)));
          lx = lerp(lx, BASE_X, ease(seg(t, 14, 16)));
          // upper body x: follows the lower body, then leans over the line
          var ux = lx + 250 * ease(seg(t, 15, 17));
          lower.setAttribute('transform', 'translate(' + (lx - BASE_X) + ',0)');
          upper.setAttribute('transform', 'translate(' + (ux - BASE_X) + ',0)');

          // foul highlight on the lower body
          lowerFoul.setAttribute('opacity', clamp01(Math.min(seg(t, 8.5, 9.5), 1 - seg(t, 13.5, 14.5))));

          // ball
          var bx, by, bo, p;
          if (t < 7) {
            p = ease(seg(t, 1, 3));
            bx = lerp(780, 477, p); by = lerp(235, 343, p);
            bo = 1 - seg(t, 5.5, 6.5);
          } else if (t < 14) {
            p = ease(seg(t, 9.5, 11.5));
            bx = lerp(940, 637, p); by = lerp(235, 343, p);
            bo = Math.min(seg(t, 7, 8), 1 - seg(t, 12.5, 13.5));
          } else {
            p = ease(seg(t, 17, 19));
            bx = lerp(1030, 727, p); by = lerp(235, 343, p);
            bo = seg(t, 14.5, 15.5);
          }
          ball.setAttribute('cx', bx);
          ball.setAttribute('cy', by);
          ball.setAttribute('opacity', clamp01(bo));

          // status labels
          legal.setAttribute('opacity', clamp01(window4(t, 3, 4, 6, 7)));
          foul.setAttribute('opacity', clamp01(window4(t, 11.5, 12.5, 13, 14)));
          lean.setAttribute('opacity', clamp01(window4(t, 19, 20, 21, 22)));
          sum.setAttribute('opacity', clamp01(seg(t, 22, 23)));
        }
      };
    }
  });
})();
