/* 히어로 인트로: 프레임이 그려지며 0→100%가 오르고, 100%에서 숫자만 사라지며
   (프레임은 남는다) 아래 글이 나타난다. 세션당 처음 한 번만 재생한다.

   재생 여부는 이 파일이 아니라 <head>의 인라인 스크립트가 첫 페인트 전에
   이미 정해서 html.intro-pending 으로 걸어둔다(defer인 이 파일은 첫 페인트
   보다 늦게 실행될 수 있어, 여기서 결정하면 "다 보였다가 숨는" 역순
   깜빡임이 생긴다). 그 클래스가 없으면 재생 대상이 아니라는 뜻이라 그냥
   끝낸다 — 콘텐츠는 이미 CSS 기본값대로 다 보이는 상태다. */
(function () {
  "use strict";

  var htmlEl = document.documentElement;
  if (!htmlEl.classList.contains("intro-pending")) return;

  var intro = document.querySelector("[data-hero-intro]");
  var svg = document.querySelector("[data-intro-frame]");
  var rect = document.querySelector("[data-intro-rect]");
  var pctNum = document.querySelector("[data-intro-pct-num]");
  if (!intro || !svg || !rect || !pctNum) { htmlEl.classList.remove("intro-pending"); return; }

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

  intro.classList.add("is-running");

  var DUR = 2000; // ms
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

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
    htmlEl.classList.remove("intro-pending"); // 글이 나타난다.
    try { sessionStorage.setItem("korealty:hero-intro-played", "1"); } catch (e) {}
  }
})();
