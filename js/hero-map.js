/* 히어로 배경의 여의도 3D 지도.
   - 데스크톱에서만, WebGL이 될 때만 뜬다. 아니면 아무것도 안 하고 영상이 남는다.
   - 조작 불가(interactive:false). 아주 천천히 자동 회전만 한다.
   - MapLibre는 여기서 필요할 때만 내려받는다(모바일은 이 파일이 일찍 return). */
(function () {
  "use strict";

  var mapEl = document.querySelector("[data-hero-map]");
  if (!mapEl) return;

  // 모바일·좁은 화면은 지도를 띄우지 않는다(무겁다). 영상 그대로.
  if (window.matchMedia("(max-width: 820px)").matches) return;

  // WebGL이 없으면 영상 폴백을 유지한다.
  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }
  if (!hasWebGL()) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadCSS(href) {
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
  function loadJS(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadCSS("assets/vendor/maplibre-gl.css");
  loadJS("assets/vendor/maplibre-gl.js").then(initMap).catch(function () { /* 영상 유지 */ });

  function initMap() {
    if (!window.maplibregl) return;

    // openfreemap의 무료 벡터 타일을 쓰되, 다크 브랜드 톤으로 레이어를 새로 짠다.
    fetch("https://tiles.openfreemap.org/styles/positron")
      .then(function (r) { return r.json(); })
      .then(function (base) {
        var style = {
          version: 8,
          glyphs: base.glyphs,
          sources: base.sources,
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#1B2B35" } },
            { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water",
              paint: { "fill-color": "#12212c" } },
            { id: "landcover", type: "fill", source: "openmaptiles", "source-layer": "landcover",
              paint: { "fill-color": "#17252f", "fill-opacity": 0.6 } },
            { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park",
              paint: { "fill-color": "#16261f", "fill-opacity": 0.7 } },
            { id: "roads", type: "line", source: "openmaptiles", "source-layer": "transportation",
              paint: { "line-color": "#243040",
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.4, 16, 2.2] } },
            { id: "roads-major", type: "line", source: "openmaptiles", "source-layer": "transportation",
              filter: ["in", "class", "motorway", "trunk", "primary"],
              paint: { "line-color": "#33415a",
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 16, 3.4] } },
            { id: "buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": ["interpolate", ["linear"],
                  ["coalesce", ["get", "render_height"], ["get", "height"], 10],
                  0, "#243044", 60, "#2c3a50", 150, "#394962", 300, "#45587a"],
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"],
                  13, 0, 15, ["coalesce", ["get", "render_height"], ["get", "height"], 8]],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
                "fill-extrusion-opacity": 0.92
              } }
          ]
        };

        var map = new maplibregl.Map({
          container: mapEl,
          style: style,
          center: [126.9258, 37.5238], // 여의도
          zoom: 15.3, pitch: 60, bearing: -20,
          interactive: false,          // 히어로 배경이라 조작 막는다
          attributionControl: { compact: false }, // 출처 표기를 접지 않고 흐리게 항상 노출
          antialias: true, maxPitch: 75
        });

        map.on("load", function () {
          try {
            map.setLight({ anchor: "viewport", color: "#eef3ff", intensity: 0.3, position: [1.4, 120, 70] });
          } catch (e) {}
          // 컨테이너 높이가 늦게 잡혀 캔버스가 작게 뜨는 것을 바로잡는다.
          map.resize();
        });

        // 창 크기가 바뀌면 다시 맞춘다(반응형).
        window.addEventListener("resize", function () { map.resize(); });

        // 타일이 한 번 자리잡으면 서서히 나타난다. 이때 지도 층에 어두운 바닥이
        // 깔리므로, 뒤의 밝은 영상이 비치지 않도록 영상을 멈춘다(자원도 절약).
        // 지도가 아예 실패하면 여기까지 안 와서 is-on이 안 붙고 영상이 폴백으로 남는다.
        map.once("idle", function () {
          map.resize();
          mapEl.classList.add("is-on");
          var v = document.querySelector(".hero video");
          if (v) { try { v.pause(); } catch (e) {} }
          if (!reduceMotion) spin(map);
        });
      })
      .catch(function () { /* 타일 실패 → 영상 유지 */ });
  }

  function spin(map) {
    map.setBearing(map.getBearing() + 0.02);
    requestAnimationFrame(function () { spin(map); });
  }
})();
