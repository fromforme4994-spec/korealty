/* 실적 페이지의 서울 프로젝트 3D 지도.
   - 데스크톱에서만, WebGL이 될 때만 뜬다. 아니면 기존 SVG 지도가 그대로 남는다.
   - 조작 가능(드래그·회전·확대). 서울 20개 프로젝트를 실제 위치 근사 좌표로 핀.
   - 유형 필터를 누르면 해당 유형 핀만 남는다(기존 SVG 동작과 같은 결). */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-map-wrap]");
  var mapEl = document.querySelector("[data-map3d]");
  if (!wrap || !mapEl) return;
  if (window.matchMedia("(max-width: 820px)").matches) return; // 모바일은 SVG 유지
  if (typeof PROJECTS === "undefined") return;

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }
  if (!hasWebGL()) return;

  /* 서울 20개 프로젝트의 위경도(동 단위 근사, [경도, 위도]). 번지 정밀도는 아니다. */
  var GEO = {
    5:  [126.8462, 37.5316], // 까치산역 SJ라벨라 — 강서 화곡
    6:  [126.9000, 37.5300], // 영등포 에버그린스타 — 당산동
    7:  [127.0700, 37.5445], // 화양동 위너스힐 — 광진 화양
    8:  [127.1050, 37.6000], // DS프라자 — 중랑 망우
    9:  [127.0250, 37.6380], // 수유역 더 오페라 — 강북 수유
    10: [126.9015, 37.4835], // 웍앤콕 — 구로디지털단지
    11: [126.9050, 37.5170], // 이튼브라운 — 영등포동
    12: [126.9075, 37.5215], // 한가람 더원 — 영등포동
    13: [127.0370, 37.5010], // 스톤 엘리시온 역삼 — 강남 역삼
    14: [127.0430, 37.5030], // 강남 헤븐리치 더 써밋 — 역삼
    17: [126.8280, 37.5665], // 마곡 퀸즈파크9 — 강서 마곡
    18: [126.8255, 37.5680], // 마곡 퀸즈파크10 — 마곡
    20: [126.8320, 37.5625], // 마곡 대명투웨니퍼스트 — 마곡
    21: [126.9160, 37.5940], // 응암 아네스트Ⅲ — 은평 응암
    22: [126.9010, 37.5690], // 상암월드시티 — 마포 성산
    23: [126.9250, 37.5240], // 여의도시티아이 — 여의도
    24: [127.0350, 37.6680], // 방학동 퍼스티안 — 도봉 방학
    25: [127.0470, 37.6530], // 창동 WALLGA타워 — 도봉 창동
    27: [126.8890, 37.5090], // 신도림 하나세인스톤 — 구로 구로동
    28: [126.8385, 37.4875]  // 천왕동 에이스프라자 — 구로 천왕
  };

  function loadCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
  function loadJS(src) {
    return new Promise(function (resolve, reject) {
      if (window.maplibregl) { resolve(); return; }
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* 처음부터 SVG를 감추고 어두운 자리(3D 지도 배경색)를 보여준다. 그래야 옛 SVG가
     잠깐 떴다 3D로 바뀌는 깜빡임이 없다. 지도가 실패하면 revert()로 SVG를 되살린다. */
  var settled = false;
  wrap.classList.add("has-3d");
  mapEl.classList.add("is-on");
  function revert() {
    if (settled) return;
    wrap.classList.remove("has-3d");
    mapEl.classList.remove("is-on");
  }
  // 안전장치: 10초 안에 지도가 안 뜨면 SVG로 되돌린다.
  var safety = setTimeout(revert, 10000);

  loadCSS("assets/vendor/maplibre-gl.css");
  loadJS("assets/vendor/maplibre-gl.js").then(init).catch(function () { clearTimeout(safety); revert(); });

  var markers = [];

  function init() {
    if (!window.maplibregl) { clearTimeout(safety); revert(); return; }

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
          center: [126.955, 37.560], // 서울 중심 근처
          zoom: 10.2, pitch: 42, bearing: -17,
          antialias: true, maxPitch: 75,
          attributionControl: { compact: true },
          cooperativeGestures: true // 스크롤 확대는 Ctrl/⌘ 필요 → 페이지 스크롤과 안 부딪힘
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");

        map.on("load", function () {
          try {
            map.setLight({ anchor: "viewport", color: "#eef3ff", intensity: 0.3, position: [1.4, 120, 70] });
          } catch (e) {}
          map.resize();
          addMarkers(map);
        });

        window.addEventListener("resize", function () { map.resize(); });

        // 타일이 한 번 자리잡으면 성공으로 보고 안전장치를 끈다(이미 3D가 보이는 상태).
        map.once("idle", function () {
          settled = true;
          clearTimeout(safety);
          map.resize();
        });

        // 유형 필터 연동: 버튼을 누르면 해당 유형 핀만 남긴다.
        var rail = document.querySelector("[data-filters]");
        if (rail) {
          rail.addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b) return;
            var cat = b.firstChild ? b.firstChild.textContent.trim() : "전체";
            applyFilter(cat);
          });
        }
      })
      .catch(function () { clearTimeout(safety); revert(); /* 타일 실패 → SVG로 되돌림 */ });
  }

  function addMarkers(map) {
    Object.keys(GEO).forEach(function (noStr) {
      var no = +noStr;
      var p = PROJECTS.find(function (x) { return x.no === no; });
      if (!p) return;
      var el = document.createElement("div");
      el.className = "mk";
      el.innerHTML = '<span class="mk__dot"></span><span class="mk__lbl"></span>';
      el.querySelector(".mk__lbl").textContent = p.name;
      // 핀을 누르면 그 프로젝트 카드를 클릭한 것과 같게 — 사진 모달이 열린다.
      el.addEventListener("click", function () {
        var card = document.querySelector('[data-projects] [data-no="' + no + '"]');
        if (card) card.click();
      });
      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(GEO[no]).addTo(map);
      markers.push({ el: el, cat: p.cat });
    });
  }

  function applyFilter(cat) {
    markers.forEach(function (m) {
      var show = (cat === "전체" || m.cat === cat);
      m.el.style.display = show ? "" : "none";
    });
  }
})();
