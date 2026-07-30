/* 히어로 인트로: 프레임이 그려지며 0→100%가 오르고, 100%에서 숫자만 사라지며
   (프레임은 남는다) 아래 글이 나타난다. 세션당 처음 한 번만 재생한다.
   기본 CSS는 "테두리가 이미 다 있는 상태"라, 이 스크립트가 안 돌아도(비활성·
   에러) 콘텐츠와 프레임은 그대로 보인다 — 재생 여부와 무관하게 항상 안전한
   점진적 향상. */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var intro = document.querySelector("[data-hero-intro]");
  var svg = document.querySelector("[data-intro-frame]");
  var rect = document.querySelector("[data-intro-rect]");
  var pctNum = document.querySelector("[data-intro-pct-num]");
  if (!hero || !intro || !svg || !rect || !pctNum) return;

  var KEY = "korealty:hero-intro-played";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 이미 이번 세션에 재생했거나 모션을 줄이는 설정이면, CSS 기본(테두리+글 다 보임)
  // 상태를 그대로 유지한다(재생 생략).
  var played;
  try { played = sessionStorage.getItem(KEY); } catch (e) { played = null; }
  if (played || reduceMotion) return;

  // SVG를 실제 픽셀 크기에 정확히 맞춘다. 정사각형(100x100) 뷰박스를 넓은
  // 화면에 억지로 늘려 쓰면(preserveAspectRatio:none) 모서리 계산이 어긋나
  // 선에 틈이 생기므로, 컨테이너의 실제 가로세로에 맞춰 매번 다시 그린다.
  function sizeSVG() {
    var w = intro.clientWidth, h = intro.clientHeight;
    if (!w || !h) return;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    rect.setAttribute("x", 0.5);
    rect.setAttribute("y", 0.5);
    rect.setAttribute("width", Math.max(0, w - 1));
    rect.setAttribute("height", Math.max(0, h - 1));
    rect.setAttribute("rx", 15.5);
  }
  sizeSVG();
  window.addEventListener("resize", sizeSVG);

  var DUR = 2000; // ms
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // 재생을 시작하는 순간에만 글을 숨긴다(점진적 향상 — 여기 도달 못 하면 항상 보임).
  hero.classList.add("is-intro-playing");
  intro.classList.add("is-running");

  var t0 = null;
  function tick(now) {
    if (t0 === null) t0 = now;
    var p = Math.min(1, (now - t0) / DUR);
    var eased = easeOutCubic(p);

    rect.style.strokeDasharray = "100 100";
    rect.style.strokeDashoffset = String(100 * (1 - eased));
    pctNum.textContent = String(Math.round(eased * 100));

    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }
  requestAnimationFrame(tick);

  function finish() {
    window.removeEventListener("resize", sizeSVG);
    intro.classList.remove("is-running"); // SVG는 숨고, 원래 있던 CSS 테두리가 프레임으로 남는다.
    hero.classList.remove("is-intro-playing"); // 글이 나타난다.
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }
})();
