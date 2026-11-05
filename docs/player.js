/* Lob Pong player engine. Loads first. Animation files call LobPong.register. */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var registry = {};

  // Create an SVG element, set attributes, append to parent, return it.
  function svg(tag, attrs, parent) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    if (parent) { parent.appendChild(el); }
    return el;
  }

  // Progress 0..1 between times a and b, clamped.
  function seg(t, a, b) {
    if (b === a) { return t >= b ? 1 : 0; }
    var p = (t - a) / (b - a);
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  // Ease-in-out (smoothstep) for x in 0..1.
  function ease(x) {
    x = x < 0 ? 0 : (x > 1 ? 1 : x);
    return x * x * (3 - 2 * x);
  }

  function lerp(a, b, p) { return a + (b - a) * p; }

  function register(id, spec) { registry[id] = spec; }

  // Text for the current time: the last caption whose t0 <= t.
  function captionFor(spec, t) {
    var caps = spec.captions || [];
    var text = '';
    for (var i = 0; i < caps.length; i++) {
      if (caps[i].t0 <= t) { text = caps[i].text; }
    }
    return text;
  }

  // Wire one section. All state lives in this closure, so sections are independent.
  function setup(section, reduceMotion) {
    var id = section.getAttribute('data-animation');
    var svgEl = section.querySelector('svg.stage');
    var captionEl = section.querySelector('.caption');
    var controls = section.querySelector('.demo-controls');
    var playBtn = section.querySelector('[data-action="play"]');
    var restartBtn = section.querySelector('[data-action="restart"]');
    var slider = section.querySelector('[data-action="scrub"]');

    function showError(message) {
      if (captionEl) {
        captionEl.textContent = message;
        captionEl.classList.add('error');
      }
      if (controls) { controls.hidden = true; }
    }

    var spec = registry[id];
    if (!spec) { showError('This animation is not available: "' + id + '" is not registered.'); return; }
    if (!svgEl) { showError('This animation is not available: the stage is missing.'); return; }

    var duration = Number(spec.duration);
    if (!(duration > 0)) { showError('This animation is not available: it has no duration.'); return; }

    var renderer;
    try {
      renderer = spec.mount(svgEl);
      if (!renderer || typeof renderer.render !== 'function') {
        throw new Error('mount did not return a renderer');
      }
    } catch (e) {
      showError('This animation could not start: ' + (e && e.message ? e.message : e));
      return;
    }

    var t = 0;           // current time in seconds
    var playing = false;
    var rafId = 0;
    var lastStamp = 0;   // timestamp of the previous frame
    var broken = false;
    var lastCaption = null;  // last caption text written to the page
    // Topic name comes from the play button label in the HTML, for example "Play lobs".
    var topic = playBtn ? (playBtn.getAttribute('aria-label') || '').replace(/^Play\s*/, '') : '';

    // Draw time t: stage, caption and slider. Errors go to the caption only.
    function draw() {
      if (broken) { return; }
      try {
        renderer.render(t);
      } catch (e) {
        broken = true;
        playing = false;
        cancelAnimationFrame(rafId);
        showError('This animation stopped with an error: ' + (e && e.message ? e.message : e));
        return;
      }
      // Write the caption only when the text changes, so the live region stays quiet.
      if (captionEl) {
        var text = captionFor(spec, t);
        if (text !== lastCaption) {
          captionEl.textContent = text;
          lastCaption = text;
        }
      }
      if (slider) {
        slider.value = String(Math.round((t / duration) * 1000));
        slider.setAttribute('aria-valuetext',
          Math.round(t) + ' of ' + Math.round(duration) + ' seconds');
      }
    }

    function setPlaying(on) {
      playing = on;
      if (playBtn) {
        var label = on ? 'Pause' : 'Play';
        playBtn.textContent = label;
        // Keep the topic name in the accessible name, for example "Pause lobs".
        playBtn.setAttribute('aria-label', topic ? label + ' ' + topic : label);
      }
    }

    function tick(stamp) {
      if (!playing) { return; }
      var dt = (stamp - lastStamp) / 1000;
      lastStamp = stamp;
      // Clamp dt so a background tab does not jump the animation ahead.
      if (dt > 0.25) { dt = 0.25; }
      if (dt < 0) { dt = 0; }
      t += dt;
      if (t >= duration) {
        t = duration;
        setPlaying(false);
        draw();
        return;
      }
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function play() {
      if (broken) { return; }
      if (t >= duration) { t = 0; }  // play from the start after the end
      setPlaying(true);
      lastStamp = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function pause() {
      setPlaying(false);
      cancelAnimationFrame(rafId);
    }

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (playing) { pause(); } else { play(); }
      });
    }
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        pause();
        t = 0;
        draw();
        play();
      });
    }
    if (slider) {
      slider.addEventListener('input', function () {
        pause();
        t = (Number(slider.value) / 1000) * duration;
        draw();
      });
    }

    if (reduceMotion) {
      // Show the final frame once. Nothing moves, so hide the controls.
      t = duration;
      draw();
      if (controls) { controls.hidden = true; }
      return;
    }

    // Poster frame at t = 0.
    draw();
  }

  window.LobPong = {
    registry: registry,
    register: register,
    svg: svg,
    seg: seg,
    ease: ease,
    lerp: lerp
  };

  document.addEventListener('DOMContentLoaded', function () {
    var reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var sections = document.querySelectorAll('section[data-animation]');
    for (var i = 0; i < sections.length; i++) {
      try {
        setup(sections[i], reduceMotion);
      } catch (e) {
        var cap = sections[i].querySelector('.caption');
        if (cap) { cap.textContent = 'This animation failed to load: ' + (e && e.message ? e.message : e); }
      }
    }
  });
})();
