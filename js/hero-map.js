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

  /* 카메라가 지나는 세 자리. 지도를 만들 때와 연출할 때가 같은 값을 봐야
     시작 프레임이 튀지 않으므로 여기 한 곳에만 적는다. */
  var CAM = {
    시작: { zoom: 14.35, pitch: 28 },   // 진입 시작 — 높고 멀리
    기본: { zoom: 15.3,  pitch: 60 },   // 히어로 상단에서의 자리
    하단: { zoom: 14.55, pitch: 43 },   // 히어로를 다 내려왔을 때
    진입시간: 2600
  };

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

  /* 처음부터 어두운 지도 층으로 영상을 덮는다. 그래야 밝은 영상이 잠깐 떴다
     지도로 바뀌는 깜빡임이 없다(실적 지도와 같은 방식). 지도가 실패하면
     revert()로 층을 걷어 영상이 폴백으로 다시 보인다. */
  var settled = false;
  mapEl.classList.add("is-on");
  function revert() {
    if (settled) return;
    mapEl.classList.remove("is-on");
    var v = document.querySelector(".hero video");
    if (v) { try { v.play(); } catch (e) {} }
  }
  // 안전장치: 10초 안에 지도가 안 뜨면 영상으로 되돌린다.
  var safety = setTimeout(revert, 10000);

  // 벤더 파일은 1년 immutable 캐시라(vercel.json) 버전이 바뀌면 이 쿼리도 올려야 한다.
  loadCSS("assets/vendor/maplibre-gl.css?v=4.7.1");
  loadJS("assets/vendor/maplibre-gl.js?v=4.7.1").then(initMap).catch(function () { clearTimeout(safety); revert(); });

  function initMap() {
    if (!window.maplibregl) { clearTimeout(safety); revert(); return; }

    // openfreemap의 무료 벡터 타일을 쓰되, 다크 브랜드 톤으로 레이어를 새로 짠다.
    // sources/glyphs는 openfreemap이 고정으로 제공하는 값이라(positron 스타일 확인됨)
    // 매번 전체 스타일 JSON을 fetch할 필요 없이 여기 하드코딩해 왕복을 없앤다.
    (function () {
        var base = {
          sources: {
            openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" }
          },
          glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
        };
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

        /* 카메라 연출을 쓸 때는 진입 시작 자리(높고 먼 곳)에서 지도를 만든다.
           기본 자리에서 만들면 첫 프레임에 제자리를 보여준 뒤 곧바로 뒤로
           물러났다가 다시 내려앉아, 시작하자마자 한 번 튄다.
           모션 최소화 설정이면 연출이 없으므로 처음부터 기본 자리에 둔다. */
        var map = new maplibregl.Map({
          container: mapEl,
          style: style,
          center: [126.9258, 37.5238], // 여의도
          zoom: reduceMotion ? 15.3 : CAM.시작.zoom,
          pitch: reduceMotion ? 60 : CAM.시작.pitch,
          bearing: -20,
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

        // 타일이 한 번 자리잡으면 성공으로 보고 안전장치를 끈다. 이미 어두운 층이
        // 영상을 덮고 있으니, 뒤 영상은 멈춰 자원을 아낀다.
        map.once("idle", function () {
          settled = true;
          clearTimeout(safety);
          map.resize();
          var v = document.querySelector(".hero video");
          if (v) { try { v.pause(); } catch (e) {} }
          if (!reduceMotion) camera(map);
        });
    })();
  }

  /* 카메라 연출. 세 가지가 한 루프에서 합쳐진다.

     1) 진입 — 처음 2.6초, 높고 먼 자리에서 여의도로 내려앉는다.
     2) 회전 — 아주 천천히 계속 돈다(원래 있던 동작).
     3) 스크롤 — 히어로를 내려갈수록 카메라가 물러나며 각도가 눕는다.
        다음 섹션으로 넘어가는 순간이 장면 전환처럼 이어진다.

     매 프레임 목표값을 향해 조금씩 따라가게(감쇠) 두었다. 스크롤 값을 그대로
     쓰면 트랙패드의 거친 입력이 그대로 카메라에 실려 덜컹거린다.

     히어로가 화면에서 완전히 벗어나면 아무것도 하지 않는다. jumpTo 는 매번
     지도를 다시 그리게 하므로, 보이지도 않는 화면을 계속 그리면 스크롤이
     무거워진다. */
  function camera(map) {
    var 시작 = CAM.시작, 기본 = CAM.기본, 하단 = CAM.하단, 진입시간 = CAM.진입시간;

    var hero = document.querySelector(".hero");
    var t0 = null, zoom = 시작.zoom, pitch = 시작.pitch, bearing = map.getBearing();
    var 이전스크롤 = -1;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function frame(now) {
      requestAnimationFrame(frame);
      if (t0 === null) t0 = now;

      var box = hero.getBoundingClientRect();
      // 히어로가 화면 위로 완전히 빠졌으면 쉰다(스크롤 성능).
      if (box.bottom <= 0) { 이전스크롤 = -1; return; }

      // 0 = 히어로 맨 위, 1 = 히어로의 3/4쯤 지난 지점.
      // 화면에서 완전히 빠지는 순간을 1로 잡으면, 감쇠 때문에 목표에 닿기 전에
      // 이미 안 보이는 곳으로 지나가 연출이 끝까지 도달하지 않는다.
      var p = Math.min(1, Math.max(0, -box.top / (box.height * 0.75)));
      var 진입 = easeOutCubic(Math.min(1, (now - t0) / 진입시간));

      var 목표줌   = lerp(시작.zoom,  lerp(기본.zoom,  하단.zoom,  p), 진입);
      var 목표각도 = lerp(시작.pitch, lerp(기본.pitch, 하단.pitch, p), 진입);

      // 진입 중에는 빠르게, 그 뒤에는 느긋하게 따라간다.
      var 감쇠 = 진입 < 1 ? 0.18 : 0.06;
      zoom  += (목표줌 - zoom) * 감쇠;
      pitch += (목표각도 - pitch) * 감쇠;
      bearing += 0.02;

      // 값이 사실상 안 변하고 스크롤도 그대로면 다시 그리지 않는다.
      var 멈춤 = 진입 >= 1 &&
                 Math.abs(목표줌 - zoom) < 0.0015 &&
                 Math.abs(목표각도 - pitch) < 0.02 &&
                 p === 이전스크롤;
      이전스크롤 = p;
      if (멈춤) { map.setBearing(bearing); return; }   // 회전만 이어간다

      map.jumpTo({ zoom: zoom, pitch: pitch, bearing: bearing });
    }
    requestAnimationFrame(frame);
  }
})();
