(function () {
  LobPong.register('threestrike', {
    duration: 36,
    captions: [
      { t0: 0, t1: 6, text: 'Team A leads 20-15. Team A is at game point, so one more point wins the game.' },
      { t0: 6, t1: 13, text: 'Team A scores a point that is not a lob. The point does not count, and the score stays 20-15. Team B receives one strike.' },
      { t0: 13, t1: 19, text: 'The rally is replayed with the same server.' },
      { t0: 19, t1: 30, text: 'When a team reaches game point, all four players must say aloud, before the next serve: "The Three-Strike (Filippini) rule is in effect."' },
      { t0: 30, t1: 33, text: 'Team B then scores a point. It counts, so the score becomes 20-16. Both teams’ strikes reset to zero.' },
      { t0: 33, t1: 36, text: 'A team with 3 strikes loses the game.' }
    ],
    mount: function (svg) {
      var S = LobPong.svg, seg = LobPong.seg, ease = LobPong.ease, lerp = LobPong.lerp;
      var F = 'font-family:var(--font);';

      function txt(x, y, size, str, anchor, color, weight, parent) {
        var el = S('text', {
          x: x, y: y, 'text-anchor': anchor || 'middle',
          style: F + 'font-size:' + size + 'px;font-weight:' + (weight || 400) + ';fill:var(--' + (color || 'ink') + ')'
        }, parent || svg);
        el.textContent = str;
        return el;
      }
      // Fade in over a..b, fade out over c..d.
      function win(t, a, b, c, d) {
        var v = ease(seg(t, a, b));
        if (c !== undefined) { v *= 1 - ease(seg(t, c, d)); }
        return v;
      }

      S('rect', { x: 0, y: 0, width: 1200, height: 700, style: 'fill:var(--ground)' }, svg);

      // Scoreboard panels
      var panels = [{ x: 60, name: 'Team A', cx: 320, tx: [330, 400, 470], lx: 90 },
                    { x: 640, name: 'Team B', cx: 900, tx: [910, 980, 1050], lx: 670 }];
      var circles = [[], []];
      panels.forEach(function (p, i) {
        S('rect', { x: p.x, y: 30, width: 500, height: 250, rx: 16,
          style: 'fill:var(--court);stroke:var(--line);stroke-width:3' }, svg);
        txt(p.lx, 90, 40, p.name, 'start', 'ink', 700);
        txt(p.lx, 264, 34, 'Strikes', 'start', 'muted');
        p.tx.forEach(function (cx) {
          S('circle', { cx: cx, cy: 252, r: 24, style: 'fill:none;stroke:var(--ink);stroke-width:3' }, svg);
          circles[i].push(S('circle', { cx: cx, cy: 252, r: 24, 'fill-opacity': 0,
            style: 'fill:var(--accent);stroke:var(--ink);stroke-width:3' }, svg));
        });
      });

      // Scores
      var scoreA = txt(320, 190, 100, '20', 'middle', 'ink', 700);
      var scoreB15 = txt(900, 190, 100, '15', 'middle', 'ink', 700);
      scoreA.setAttribute('x', 320);

      // Game point badge for Team A
      var badge = S('g', {}, svg);
      S('rect', { x: 330, y: 50, width: 210, height: 54, rx: 10, style: 'fill:var(--accent)' }, badge);
      txt(435, 88, 34, 'Game point', 'middle', 'ground', 700, badge);

      // Center label slot (one label at a time)
      var lab1 = txt(600, 400, 34, 'Team A is at game point. One more point wins.', 'middle', 'ink', 400);

      // Scene 2: Team A non-lob point, crossed out
      var chipA = S('g', {}, svg);
      S('rect', { x: 100, y: 310, width: 440, height: 70, rx: 12,
        style: 'fill:var(--court);stroke:var(--muted);stroke-width:3' }, chipA);
      txt(320, 358, 34, 'Point: not a lob', 'middle', 'ink', 400, chipA);
      var cross = S('line', { x1: 120, y1: 345, x2: 120, y2: 345,
        style: 'stroke:var(--accent);stroke-width:8;stroke-linecap:round' }, chipA);
      var noCount = txt(320, 430, 34, 'Point does not count', 'middle', 'muted');
      var strikeLab = txt(980, 350, 34, 'Strike to Team B', 'middle', 'ink', 700);
      strikeLab.setAttribute('x', 900);

      // Scene 3: replay with same server
      var replay = S('g', {}, svg);
      S('circle', { cx: 400, cy: 470, r: 66, style: 'fill:var(--main);stroke:var(--ink);stroke-width:3' }, replay);
      txt(400, 482, 34, 'Server', 'middle', 'ground', 700, replay);
      var loop = S('path', { d: 'M 600 420 C 480 420 480 530 600 530', pathLength: 1,
        'stroke-dasharray': 1, 'stroke-dashoffset': 1,
        style: 'fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round' }, replay);
      var head = S('path', { d: 'M 620 530 L 596 514 L 596 546 Z', style: 'fill:var(--accent)' }, replay);
      txt(660, 466, 34, 'Replay the rally', 'start', 'ink', 700, replay);
      txt(660, 514, 34, 'Same server', 'start', 'ink', 400, replay);

      // Closing: the fixed sentence from 6.4.4
      // Scene 4: Team B scores a counting point, strikes reset, then the 3-strike rule
      var resetLab = txt(600, 400, 34, 'Counting point: both teams’ strikes reset to zero', 'middle', 'ink', 400);
      var loseLab = txt(600, 400, 34, 'A team with 3 strikes loses the game', 'middle', 'ink', 700);

      var phrase = S('g', {}, svg);
      S('rect', { x: 40, y: 520, width: 1120, height: 150, rx: 16,
        style: 'fill:var(--court);stroke:var(--accent);stroke-width:4' }, phrase);
      txt(600, 575, 34, 'All four players must say aloud, before the next serve:', 'middle', 'muted', 400, phrase);
      txt(600, 636, 38, 'The Three-Strike (Filippini) rule is in effect.', 'middle', 'ink', 700, phrase);

      return {
        render: function (t) {
          // Team A game point badge: always shown
          badge.setAttribute('opacity', 1);

          // Strike tally: one strike to Team B, kept to the end
          var bFill = win(t, 9.5, 11, 30, 31);
          circles[1][0].setAttribute('fill-opacity', bFill);
          circles[0].forEach(function (c) { c.setAttribute('fill-opacity', 0); });
          circles[1][1].setAttribute('fill-opacity', 0);
          circles[1][2].setAttribute('fill-opacity', 0);

          // Labels
          lab1.setAttribute('opacity', 1 - ease(seg(t, 5, 6)));

          // Scene 2
          chipA.setAttribute('opacity', win(t, 6, 7.5, 12, 13));
          cross.setAttribute('x2', lerp(120, 520, ease(seg(t, 8, 9.5))));
          noCount.setAttribute('opacity', win(t, 9.5, 11, 12, 13));
          strikeLab.setAttribute('opacity', win(t, 9.5, 11, 12, 13));

          // Scene 3
          replay.setAttribute('opacity', win(t, 13, 14.5, 18, 19));
          loop.setAttribute('stroke-dashoffset', 1 - ease(seg(t, 14, 17)));
          head.setAttribute('opacity', seg(t, 16.5, 17.5));

          // Closing sentence
          phrase.setAttribute('opacity', win(t, 19.5, 21));

          // Scene 4: counting point makes 20-16, strikes reset, then 3-strike rule
          scoreB15.textContent = t >= 31 ? '16' : '15';
          resetLab.setAttribute('opacity', win(t, 30, 31, 32, 33));
          loseLab.setAttribute('opacity', ease(seg(t, 33, 34)));
        }
      };
    }
  });
})();
