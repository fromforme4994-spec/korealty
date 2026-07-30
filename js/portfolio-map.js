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

  // 벤더 파일은 1년 immutable 캐시라(vercel.json) 버전이 바뀌면 이 쿼리도 올려야 한다.
  loadCSS("assets/vendor/maplibre-gl.css?v=4.7.1");
  loadJS("assets/vendor/maplibre-gl.js?v=4.7.1").then(init).catch(function () { clearTimeout(safety); revert(); });

  var markers = [];

  function init() {
    if (!window.maplibregl) { clearTimeout(safety); revert(); return; }

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
          /* 건축 도면 톤. 종이처럼 밝은 바탕에 얇은 선으로 그린 느낌을 낸다.
             히어로 지도는 흰 글자가 얹히므로 어두운 채로 두고, 여기만 밝게 간다. */
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#F3F6F9" } },
            { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water",
              paint: { "fill-color": "#DDE5EE" } },
            { id: "landcover", type: "fill", source: "openmaptiles", "source-layer": "landcover",
              paint: { "fill-color": "#EAEFF4", "fill-opacity": 0.7 } },
            { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park",
              paint: { "fill-color": "#E6EDE7", "fill-opacity": 0.8 } },
            /* 밝은 바탕에서는 선이 금세 묻힌다. 어두운 판일 때보다 진하게 잡는다. */
            { id: "roads", type: "line", source: "openmaptiles", "source-layer": "transportation",
              paint: { "line-color": "#B9C4D1",
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 16, 2.2] } },
            { id: "roads-major", type: "line", source: "openmaptiles", "source-layer": "transportation",
              filter: ["in", "class", "motorway", "trunk", "primary"],
              paint: { "line-color": "#94A4B6",
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.0, 16, 3.4] } },
            /* 건물 바닥 외곽선. fill-extrusion 에는 외곽선 속성이 없어서(색·높이·불투명도
               정도만 있다) 도면 느낌의 선은 이렇게 따로 그린다. 입체의 세로·지붕
               모서리까지는 이 방식으로 나오지 않는다. 건물보다 먼저 그려야
               지붕 위로 선이 떠 보이지 않는다. */
            { id: "building-outline", type: "line", source: "openmaptiles", "source-layer": "building",
              minzoom: 13,
              paint: { "line-color": "#8FA0B4",
                "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.3, 16, 0.8],
                "line-opacity": 0.9 } },
            { id: "buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": ["interpolate", ["linear"],
                  ["coalesce", ["get", "render_height"], ["get", "height"], 10],
                  0, "#FFFFFF", 60, "#F5F7FA", 150, "#E9EEF4", 300, "#DCE3EC"],
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"],
                  13, 0, 15, ["coalesce", ["get", "render_height"], ["get", "height"], 8]],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
                /* 살짝 비쳐야 아래 외곽선이 보이면서 도면처럼 읽힌다. */
                "fill-extrusion-opacity": 0.86
              } }
          ]
        };

        /* 건물은 줌 13 부터만 타일에 있다. 그래서 전체 조망(10.2)에서는 도면
           질감이 안 보인다. 건물이 보이는 축척에서 시작해 전체로 물러나면
           질감을 한 번 보여주고 조망으로 끝나 둘 다 챙긴다. */
        var OVERVIEW = { center: [126.955, 37.560], zoom: 10.2, pitch: 42, bearing: -17 };
        var START = { center: [126.9250, 37.5240], zoom: 14.6, pitch: 58, bearing: -12 }; // 여의도
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var view = reduceMotion ? OVERVIEW : START;

        var map = new maplibregl.Map({
          container: mapEl,
          style: style,
          center: view.center,
          zoom: view.zoom, pitch: view.pitch, bearing: view.bearing,
          antialias: true, maxPitch: 75,
          attributionControl: { compact: true },
          cooperativeGestures: true // 스크롤 확대는 Ctrl/⌘ 필요 → 페이지 스크롤과 안 부딪힘
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");

        map.on("load", function () {
          try {
            // 밝은 바탕에서는 빛을 세게 줘야 면이 서로 구분된다.
            map.setLight({ anchor: "viewport", color: "#ffffff", intensity: 0.55, position: [1.4, 120, 60] });
          } catch (e) {}
          map.resize();
          addMarkers(map);
        });

        window.addEventListener("resize", function () { map.resize(); });

        // 타일이 한 번 자리잡으면 성공으로 보고 안전장치를 끈다(이미 3D가 보이는 상태).
        var tilesReady = false;
        map.once("idle", function () {
          settled = true;
          clearTimeout(safety);
          map.resize();
          tilesReady = true;
          maybePullBack();
        });

        /* 물러나는 연출은 지도가 화면에 들어왔을 때 시작한다. 이 지도는 페이지
           아래쪽에 있어서, 로드되자마자 재생하면 보는 사람 없이 끝나 버린다. */
        var pulled = reduceMotion;
        var visible = false;
        function maybePullBack() {
          if (pulled || !tilesReady || !visible) return;
          pulled = true;
          /* 타일이 그려지자마자 물러나면 정작 보여주려던 도면 장면을 못 보고
             지나간다. 잠깐 머문 뒤에 시작한다. */
          setTimeout(function () {
            map.easeTo({
              center: OVERVIEW.center, zoom: OVERVIEW.zoom,
              pitch: OVERVIEW.pitch, bearing: OVERVIEW.bearing,
              duration: 3200,
              easing: function (t) { return 1 - Math.pow(1 - t, 3); } // 끝에서 부드럽게 멈춘다
            });
          }, 1100);
        }
        if (!pulled && "IntersectionObserver" in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) { visible = true; maybePullBack(); io.disconnect(); }
            });
          }, { threshold: 0.4 });
          io.observe(mapEl);
        } else {
          visible = true; // 관찰자를 못 쓰면 그냥 타일 준비되는 대로 재생
        }

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
    })();
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
