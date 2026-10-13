/*
 * FoldOut: the hero fold animation.
 *
 * A port of the app's LoopingFold: a flat net of six hinged faces folds up into
 * a cube, then turns to an isometric view. Each face is a DOM element nested inside
 * the face it hinges on, so CSS 3D transforms chain the folds exactly like the
 * app's FoldModel tree. Nets, face artwork and timing mirror the Swift code.
 */
(function () {
  "use strict";

  // The 11 cube nets, from CubeGeometry.swift.
  var NETS = [
    { id: "n1", family: "1-4-1", name: "Cross", cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
    { id: "n2", family: "1-4-1", name: "T-cross", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
    { id: "n3", family: "1-4-1", name: "Wide offset", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]] },
    { id: "n4", family: "1-4-1", name: "Long Z", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]] },
    { id: "n5", family: "1-4-1", name: "Same-end C", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]] },
    { id: "n6", family: "1-4-1", name: "Centre stagger", cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]] },
    { id: "n7", family: "2-3-1", name: "Hook", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]] },
    { id: "n8", family: "2-3-1", name: "Centre drop", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]] },
    { id: "n9", family: "2-3-1", name: "Far drop", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]] },
    { id: "n10", family: "2-2-2", name: "Staircase", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]] },
    { id: "n11", family: "3-3", name: "Double step", cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]] }
  ];

  var INK = "#14304F";
  var COLORS = {
    yellow: "#F2CF1D", green: "#2DBE6C", blue: "#2C8BE6", red: "#E2483B", orange: "#F58A1F",
    purple: "#8A5CF0", pink: "#F59AC6", black: "#1E1E24", grey: "#9AA3AD"
  };
  var COLOR_LIST = Object.keys(COLORS).map(function (k) { return COLORS[k]; });

  // ---------- Face artwork (FaceRenderer.swift), all in a 100×100 box centred on 0,0 ----------

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function poly(xy, fill, outlined) {
    var p = [];
    for (var i = 0; i < xy.length; i += 2) p.push(xy[i] + "," + xy[i + 1]);
    return '<polygon points="' + p.join(" ") + '" fill="' + fill + '"' +
      (outlined ? ' stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"' : "") + "/>";
  }

  function rect(x, y, w, h, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
  }

  function circle(cx, cy, r, fill, outlined) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' +
      (outlined ? ' stroke="' + INK + '" stroke-width="2.5"' : "") + "/>";
  }

  var STAR = (function () {
    var xy = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 1 ? 17 : 40;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      xy.push((r * Math.cos(a)).toFixed(2), (r * Math.sin(a) + 3).toFixed(2));
    }
    return xy;
  })();

  var PIPS = {
    1: [[0, 0]],
    2: [[1, -1], [-1, 1]],
    3: [[1, -1], [0, 0], [-1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]
  };

  var SHAPES = {
    solid: function (c) { return rect(-50, -50, 100, 100, c); },
    circle: function (c) { return circle(0, 0, 38, c, true); },
    ring: function (c) { return '<circle cx="0" cy="0" r="30" fill="none" stroke="' + c + '" stroke-width="13"/>'; },
    diamond: function (c) { return poly([-42, 0, 0, -19, 42, 0, 0, 19], c, true); },
    triangle: function (c) { return poly([0, -36, 34, 26, -34, 26], c, true); },
    half: function (c) { return rect(-50, -50, 100, 50, c); },
    band: function (c) { return rect(-50, -14, 100, 28, c); },
    corner: function (c) { return '<path d="M-50,-50 L14,-50 A64,64 0 0 1 -50,14 Z" fill="' + c + '"/>'; },
    star: function (c) { return poly(STAR, c, true); },
    square: function (c) { return '<rect x="-24" y="-24" width="48" height="48" fill="' + c + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>'; },
    arrow: function (c) { return poly([0, -40, 25, -10, 8, -10, 8, 40, -8, 40, -8, -10, -25, -10], c); },
    darrow: function (c) { return poly([0, -42, 22, -18, 7, -18, 7, 18, 22, 18, 0, 42, -22, 18, -7, 18, -7, -18, -22, -18], c); },
    chevron: function (c) { return '<polyline points="-28,14 0,-16 28,14" fill="none" stroke="' + c + '" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>'; },
    tee: function (c) { return poly([-32, -32, 32, -32, 32, -15, 9, -15, 9, 34, -9, 34, -9, -15, -32, -15], c); },
    ell: function (c) { return poly([-26, -34, -9, -34, -9, 17, 28, 17, 28, 34, -26, 34], c); },
    offdot: function (c) { return circle(-24, -24, 14, c); },
    dot: function (c) { return circle(0, 0, 16, c); },
    checker: function (c) { return rect(-50, -50, 50, 50, c) + rect(0, 0, 50, 50, c); },
    stripes: function (c) { return rect(-50, -50, 100, 20, c) + rect(-50, -10, 100, 20, c) + rect(-50, 30, 100, 20, c); },
    plus: function (c) { return rect(-9, -36, 18, 72, c) + rect(-36, -9, 72, 18, c); }
  };

  function pips(n) {
    return PIPS[n].map(function (p) { return circle(p[0] * 27, p[1] * 27, 10, INK); }).join("");
  }

  function glyph(text) {
    return '<text x="0" y="3" text-anchor="middle" dominant-baseline="central" font-family="-apple-system, BlinkMacSystemFont, \'SF Pro Display\', \'Helvetica Neue\', Arial, sans-serif" font-size="74" font-weight="700" fill="' + INK + '">' + text + "</text>";
  }

  function kinds(list) {
    var colours = shuffle(COLOR_LIST);
    return shuffle(list).slice(0, 6).map(function (k, i) { return SHAPES[k](colours[i % colours.length]); });
  }

  // Face styles shown on the site, from FaceStyles.swift.
  var STYLES = [
    { id: "colours", label: "Colours", make: function () { return shuffle(COLOR_LIST).slice(0, 6).map(SHAPES.solid); } },
    { id: "dice", label: "Dice", make: function () { return shuffle([1, 2, 3, 4, 5, 6]).map(pips); } },
    { id: "arrows", label: "Arrows", make: function () { return kinds(["arrow", "arrow", "darrow", "chevron", "tee", "ell", "offdot", "dot", "square"]); } },
    { id: "shapes", label: "Shapes", make: function () { return kinds(["solid", "circle", "diamond", "triangle", "half", "band", "corner", "star", "ring", "square"]); } },
    { id: "letters", label: "Letters", make: function () { return shuffle("FGJKLPRBCDEQ".split("")).slice(0, 6).map(glyph); } },
    { id: "patterns", label: "Patterns", make: function () { return kinds(["checker", "stripes", "plus", "half", "band", "corner"]); } }
  ];

  function faceSVG(art, quarterTurns) {
    return '<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="-50" y="-50" width="100" height="100" fill="#fff"/>' +
      '<g transform="rotate(' + (quarterTurns * 90) + ')">' + art + "</g>" +
      '<rect x="-48.5" y="-48.5" width="97" height="97" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      "</svg>";
  }

  // ---------- Fold tree (FoldModel in FoldViewer.swift) ----------

  function buildTree(cells) {
    var mx = 0, my = 0;
    cells.forEach(function (c) { mx += c[0] / 6; my += c[1] / 6; });
    // Root the tree at the cell closest to the net's centre.
    var root = 0, best = Infinity;
    cells.forEach(function (c, i) {
      var d = Math.pow(c[0] - mx, 2) + Math.pow(c[1] - my, 2);
      if (d < best) { best = d; root = i; }
    });
    var index = {};
    cells.forEach(function (c, i) { index[c[0] + "," + c[1]] = i; });
    var nodes = [{ face: root, parent: null, dx: 0, dy: 0 }];
    var seen = {}; seen[root] = true;
    for (var head = 0; head < nodes.length; head++) {
      var i = nodes[head].face;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var j = index[(cells[i][0] + d[0]) + "," + (cells[i][1] + d[1])];
        if (j !== undefined && !seen[j]) {
          seen[j] = true;
          nodes.push({ face: j, parent: i, dx: d[0], dy: d[1] });
        }
      });
    }
    var xs = cells.map(function (c) { return c[0]; });
    var ys = cells.map(function (c) { return c[1]; });
    return {
      nodes: nodes,
      cx: mx - cells[root][0],
      cy: my - cells[root][1],
      gridW: Math.max.apply(null, xs) + 1,
      gridH: Math.max.apply(null, ys) + 1
    };
  }

  // ---------- Animation ----------

  var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var clamp = function (t) { return Math.min(1, Math.max(0, t)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var FADE_IN = 0.35, HOLD_NET = 0.6, FOLD = 3.6, HOLD_CUBE = 2.6, FADE_OUT = 0.4;
  var CYCLE = FADE_IN + HOLD_NET + FOLD + HOLD_CUBE + FADE_OUT;

  // Views: flat net, a gentle tilt while folding, then an isometric look at the finished cube.
  var TILT = { rx: -16, ry: -20 };
  var FINAL = { rx: -28, ry: -40 };

  // Faces are built once at this fixed size, and the whole scene is scaled to fit the stage.
  // Resizing the window (or rotating a phone) only changes that scale, so nothing is rebuilt.
  var BASE = 160;

  function FoldHero(stage) {
    this.stage = stage;
    this.scene = document.createElement("div");
    this.scene.className = "fold-scene";
    stage.appendChild(this.scene);
    this.label = document.querySelector("[data-fold-label]");
    this.styleLabel = document.querySelector("[data-fold-style]");
    this.bar = document.querySelector("[data-fold-progress]");
    this.picks = [];
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.styleIndex = 0;
    this.netOrder = shuffle(NETS);
    this.netIndex = 0;
    this.running = false;
    this.visible = true;
    this.fit = 1;
    this.finalScale = 1;
    this.tick = this.tick.bind(this);
  }

  FoldHero.prototype.next = function (net) {
    var style = STYLES[this.styleIndex % STYLES.length];
    this.styleIndex++;
    if (!net) {
      net = this.netOrder[this.netIndex % this.netOrder.length];
      this.netIndex++;
    }
    this.build(net, style);
    this.start = performance.now();
  };

  FoldHero.prototype.build = function (net, style) {
    var S = BASE;
    var tree = buildTree(net.cells);
    this.tree = tree;
    this.net = net;
    // Room the flat net needs, in cells, as in the app's FoldModel.stageSize.
    this.cellsW = Math.max(tree.gridW, 4) + 1.2;
    this.cellsH = Math.max(tree.gridH, 3.6) + 1.2;
    this.measure();

    var arts = style.make();
    var spin = style.id === "colours" ? function () { return 0; } : function () { return Math.floor(Math.random() * 4); };
    var els = {};
    this.hinges = [];
    this.scene.textContent = "";

    tree.nodes.forEach(function (node) {
      var el = document.createElement("div");
      el.className = "fold-face";
      el.style.width = S + "px";
      el.style.height = S + "px";
      // Artwork is a background image rather than inline SVG: some engines don't
      // paint inline SVG inside preserve-3d planes, but every engine paints backgrounds.
      var front = document.createElement("div");
      front.className = "fold-side front";
      front.style.backgroundImage =
        'url("data:image/svg+xml,' + encodeURIComponent(faceSVG(arts[node.face], spin())) + '")';
      var back = document.createElement("div");
      back.className = "fold-side back";
      el.appendChild(front);
      el.appendChild(back);
      if (node.parent === null) {
        el.style.left = -S / 2 + "px";
        el.style.top = -S / 2 + "px";
        this.scene.appendChild(el);
      } else {
        // Hinge on the edge shared with the parent face.
        el.style.left = node.dx * S + "px";
        el.style.top = node.dy * S + "px";
        el.style.transformOrigin =
          node.dx === 1 ? "0 50%" : node.dx === -1 ? "100% 50%" : node.dy === 1 ? "50% 0" : "50% 100%";
        els[node.parent].appendChild(el);
        this.hinges.push({ el: el, dx: node.dx, dy: node.dy });
      }
      els[node.face] = el;
    }, this);

    if (this.styleLabel) this.styleLabel.textContent = style.label;
    this.picks.forEach(function (button) {
      var active = button.getAttribute("data-net") === net.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  };

  // Works out how much to scale the scene so the net fits the stage at its current size.
  FoldHero.prototype.measure = function () {
    var W = this.stage.clientWidth, H = this.stage.clientHeight;
    if (!W || !H || !this.cellsW) return;
    var cell = Math.min(W / this.cellsW, H / this.cellsH);
    this.fit = cell / BASE;
    // The finished cube grows to fill most of the paper.
    this.finalScale = Math.min(1.9, Math.min(W, H) * 0.5 / (cell * 1.7));
  };

  // Poses the net for fold progress p (0...1), using the app's timing curve.
  FoldHero.prototype.pose = function (p, spinSeconds) {
    this.lastP = p;
    this.lastSpin = spinSeconds || 0;
    var angle = 90 * ease(clamp((p - 0.12) / 0.48));
    var r1 = ease(clamp(p / 0.14));
    var r2 = ease(clamp((p - 0.64) / 0.36));
    var rx, ry;
    if (r2 > 0) {
      rx = lerp(TILT.rx, FINAL.rx, r2);
      ry = lerp(TILT.ry, FINAL.ry, r2);
    } else {
      rx = lerp(0, TILT.rx, r1);
      ry = lerp(0, TILT.ry, r1);
    }
    ry -= this.lastSpin * 14;
    var k = this.fit * (1 + (this.finalScale - 1) * r2);
    // Centre the flat net on the stage; the finished cube is centred on its own middle.
    var cell = BASE * this.fit;
    var sx = -this.tree.cx * cell * (1 - r2);
    var sy = -this.tree.cy * cell * (1 - r2);

    // Children fold away from the viewer, so the cube forms behind the root face.
    this.hinges.forEach(function (h) {
      h.el.style.transform =
        h.dx === 1 ? "rotateY(" + angle + "deg)" :
        h.dx === -1 ? "rotateY(" + -angle + "deg)" :
        h.dy === 1 ? "rotateX(" + -angle + "deg)" : "rotateX(" + angle + "deg)";
    });
    this.scene.style.transform =
      "translate3d(" + sx.toFixed(2) + "px," + sy.toFixed(2) + "px,0) scale3d(" + k + "," + k + "," + k + ") " +
      "rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(" + BASE / 2 + "px)";

    if (this.label) {
      this.label.textContent = p < 0.12 ? "1 · Net" : p < 0.64 ? "2 · Folding" : p < 1 ? "3 · Turning" : "3 · Cube";
    }
    if (this.bar) this.bar.style.width = (p * 100).toFixed(1) + "%";
  };

  // Draws the frame for time `now`. The fade is applied to the stage, not the 3D scene,
  // because opacity on a preserve-3d element flattens it.
  FoldHero.prototype.frame = function (now) {
    var t = (now - this.start) / 1000;
    if (t >= CYCLE) {
      this.next();
      t = 0;
    }
    var p = clamp((t - FADE_IN - HOLD_NET) / FOLD);
    var spinT = Math.max(0, t - FADE_IN - HOLD_NET - FOLD);
    var opacity = t < FADE_IN ? t / FADE_IN : t > CYCLE - FADE_OUT ? (CYCLE - t) / FADE_OUT : 1;
    this.stage.style.opacity = Math.max(0, opacity).toFixed(3);
    this.pose(p, spinT);
  };

  FoldHero.prototype.tick = function (now) {
    if (!this.running) return;
    this.frame(now);
    requestAnimationFrame(this.tick);
  };

  FoldHero.prototype.play = function () {
    if (this.running || this.reduceMotion || !this.visible || document.hidden) return;
    this.running = true;
    // Resume where we left off.
    if (this.pausedAt) {
      this.start += performance.now() - this.pausedAt;
      this.pausedAt = null;
    }
    requestAnimationFrame(this.tick);
  };

  FoldHero.prototype.pause = function () {
    if (!this.running) return;
    this.running = false;
    this.pausedAt = performance.now();
  };

  // Folds a specific net, chosen from the picker. The cycle carries on from there.
  FoldHero.prototype.show = function (netId) {
    var net = NETS.filter(function (n) { return n.id === netId; })[0];
    if (!net) return;
    this.next(net);
    this.pausedAt = null;
    if (this.reduceMotion) {
      this.pose(1, 0);
    } else {
      this.frame(this.start);
    }
  };

  // The row of small net buttons under the stage.
  FoldHero.prototype.renderPicker = function (container) {
    var self = this;
    NETS.forEach(function (net) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "net-pick";
      button.setAttribute("data-net", net.id);
      button.setAttribute("aria-label", "Fold the " + net.name + " net");
      button.setAttribute("aria-pressed", "false");
      button.title = net.name + " · " + net.family;
      button.innerHTML = netSVG(net);
      button.addEventListener("click", function () { self.show(net.id); });
      container.appendChild(button);
      self.picks.push(button);
    });
  };

  FoldHero.prototype.init = function () {
    var self = this;
    var picker = document.querySelector("[data-net-picker]");
    if (picker) this.renderPicker(picker);

    this.next();
    if (this.reduceMotion) {
      // Without motion, show the finished cube.
      this.pose(1, 0);
    } else {
      // Pose the first frame straight away so faces never flash unfolded.
      this.frame(this.start);
      this.play();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
        self.visible ? self.play() : self.pause();
      }).observe(this.stage);
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? self.pause() : self.play();
    });

    // Rescale (never rebuild) when the stage changes size.
    var onResize = function () {
      self.measure();
      if (self.lastP !== undefined) self.pose(self.lastP, self.lastSpin);
    };
    if ("ResizeObserver" in window) {
      new ResizeObserver(onResize).observe(this.stage);
    } else {
      window.addEventListener("resize", onResize);
    }
  };

  // ---------- Small static net drawings for the picker ----------

  function netSVG(net) {
    var xs = net.cells.map(function (c) { return c[0]; });
    var ys = net.cells.map(function (c) { return c[1]; });
    var w = Math.max.apply(null, xs) + 1, h = Math.max.apply(null, ys) + 1;
    var u = 24;
    var body = net.cells.map(function (c) {
      return '<rect x="' + (c[0] * u + 1.5) + '" y="' + (c[1] * u + 1.5) + '" width="' + u + '" height="' + u +
        '" fill="#fff" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>';
    }).join("");
    return '<svg viewBox="0 0 ' + (w * u + 3) + " " + (h * u + 3) + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + "</svg>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var stage = document.querySelector("[data-fold-stage]");
    if (stage) new FoldHero(stage).init();
  });
})();
