/* 대표 현장 커버플로우.

   실적 페이지 위쪽에서 사진 몇 장을 넘겨 보게 한다. 아래의 스펙 목록·필터·
   지도는 그대로 두고, 사진을 먼저 보여주는 층만 얹는 것이다.

   - 어느 현장을 쓸지는 HTML 의 data-cover="1,2,3..." (js/data.js 의 NO.)
     하나로 정한다. 이름·사진·위치는 전부 data.js 에서 끌어오므로 실적을
     고치면 여기도 같이 따라온다.
   - 카드를 복제하지 않는다. 가운데에서의 거리를 링의 짧은 쪽으로 접어
     (모듈러 연산) 무한히 도는 것처럼 보이게 한다.
   - 매 프레임 DOM 에 직접 그린다. 초당 60번 상태를 바꾸면 카드마다
     다시 그려지는데, 그 숫자는 화면 밖 계산일 뿐이라 그럴 이유가 없다.
   - 모션 최소화 설정이면 3D 를 아예 켜지 않고 가로 스크롤 목록으로 둔다.
   - 화면 밖으로 나가면 아무것도 하지 않는다(히어로 지도와 같은 처리). */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-cover]");
  if (!wrap || typeof PROJECTS === "undefined") return;

  var 현장 = wrap.dataset.cover.split(",")
    .map(function (n) { return PROJECTS.find(function (p) { return p.no === Number(n.trim()); }); })
    .filter(Boolean);
  if (현장.length < 2) return;

  var 개수 = 현장.length;
  var 모션최소 = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 좁은 화면 전용으로 쓰일 때는 넓은 화면에서 숨어 있다. 그때는 사진을
  // 한 장도 미리 받지 않는다 — 보이지도 않을 이미지에 데이터를 쓰지 않는다.
  var 숨음 = wrap.offsetParent === null;

  /* ---------- 뼈대 ---------- */
  wrap.classList.add("cover");
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-roledescription", "carousel");
  wrap.setAttribute("aria-label", "대표 현장 사진");
  wrap.innerHTML =
    '<div class="cover__frame" tabindex="0">' +
      '<div class="cover__track">' +
        현장.map(function (p, i) {
          return '<button type="button" class="cover__card" data-proj-open="' + p.no + '" ' +
                 'aria-label="' + p.name + ' 사진 크게 보기">' +
                   '<img src="' + p.img + '" alt="' + p.name + ' 현장" ' +
                   'loading="' + (숨음 || i >= 2 ? "lazy" : "eager") + '" decoding="async">' +
                 '</button>';
        }).join("") +
      '</div>' +
    '</div>' +
    '<p class="cover__cap" aria-live="polite">' +
      '<b class="cover__name"></b><span class="cover__loc"></span></p>' +
    '<div class="cover__dots" role="tablist" aria-label="현장 선택"></div>';

  var frame = wrap.querySelector(".cover__frame");
  var 카드들 = Array.prototype.slice.call(wrap.querySelectorAll(".cover__card"));
  var 이름칸 = wrap.querySelector(".cover__name");
  var 위치칸 = wrap.querySelector(".cover__loc");
  var 점통 = wrap.querySelector(".cover__dots");

  현장.forEach(function (p, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cover__dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", p.name);
    b.addEventListener("click", function () { 이동(i); });
    점통.appendChild(b);
  });
  var 점들 = Array.prototype.slice.call(점통.children);

  /* 모션 최소화: 3D 를 켜지 않는다. 가로로 훑는 평범한 목록이 된다. */
  if (모션최소) {
    wrap.classList.add("is-plain");
    고른것(0);
    return;
  }

  /* ---------- 물리 ---------- */
  var 회전 = 38, 깊이 = 0.5, 감쇠지수 = 0.56, 흐림 = 0.12, 사이 = 0.06;

  var 위치 = 0;        // 가운데에 오는 카드 번호(소수)
  var 목표 = 0;        // 지금 향하고 있는 곳. 날아가는 중에 눌러도 먹히게 따로 둔다
  var 카드폭 = 0;
  var raf = null;
  var 끌기 = null;
  var 고름 = -1;
  var 보임 = true;
  var 클릭막기 = 0;   // 이 시각 전까지의 클릭은 끌기의 잔상으로 본다


  function 접기(값) { return ((값 % 개수) + 개수) % 개수; }
  function 가까운(값) { return 접기(Math.round(값)); }

  function 고른것(i) {
    if (i === 고름) return;
    고름 = i;
    이름칸.textContent = 현장[i].name;
    위치칸.textContent = 현장[i].loc;
    점들.forEach(function (d, k) { d.setAttribute("aria-selected", String(k === i)); });
  }

  function 그리기() {
    if (!카드폭) return;
    var 간격 = 카드폭 * (1 + 사이);
    카드들.forEach(function (card, i) {
      // 링의 짧은 쪽으로 접는다 — 이게 무한 루프의 전부다.
      var 차 = 접기(i - 위치);
      if (차 > 개수 / 2) 차 -= 개수;
      var 거리 = Math.abs(차);
      // 멀어질수록 기울기·후퇴가 완만해진다. 선형으로 두면 두 번째 카드가
      // 접혀 닫혀 버려서 무엇인지 알아볼 수 없다.
      var 램프 = Math.pow(거리, 감쇠지수);
      var 기울기 = Math.min(회전 * 램프, 76) * (차 < 0 ? -1 : 1);
      card.style.transform =
        "translateX(calc(-50% + " + (차 * 간격) + "px)) " +
        "translateZ(" + (-깊이 * 카드폭 * 램프) + "px) rotateY(" + (-기울기) + "deg)";
      // 반 바퀴 지점에서 반대편으로 순간이동하므로 그 전에 사라져 있어야 한다.
      var 가장자리 = Math.min(1, Math.max(0, 개수 / 2 - 거리));
      card.style.opacity = String(Math.max(0, 1 - 흐림 * 거리) * 가장자리);
      card.style.zIndex = String(100 - Math.round(거리));
    });
  }

  function 안착(목적지) {
    if (raf !== null) cancelAnimationFrame(raf);
    목표 = 목적지;
    고른것(가까운(목적지));
    (function 한걸음() {
      var 남음 = 목표 - 위치;
      if (Math.abs(남음) < 0.0005) { 위치 = 목표; 그리기(); raf = null; return; }
      위치 += 남음 * 0.16;
      그리기();
      raf = requestAnimationFrame(한걸음);
    })();
  }

  function 이동(i) {
    // 멀리 돌지 말고 가까운 쪽으로 간다.
    안착(i + Math.round((목표 - i) / 개수) * 개수);
  }
  function 한칸(만큼) { 안착(Math.round(목표) + 만큼); }

  /* ---------- 손가락 ---------- */
  /* 포인터를 누르는 즉시 잡으면(setPointerCapture) 손을 뗄 때 브라우저가
     클릭을 프레임에 붙여 보낸다. 그러면 카드를 눌러도 카드가 아니라 프레임이
     눌린 것이 되어 사진이 열리지 않는다. 실제로 끌기 시작할 때만 잡는다. */
  frame.addEventListener("pointerdown", function (e) {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    목표 = 위치;
    끌기 = { id: e.pointerId, x: e.clientX, 시작: 위치, v: 0,
             t: performance.now(), 움직임: 0, 잡음: false };
  });

  frame.addEventListener("pointermove", function (e) {
    if (!끌기 || 끌기.id !== e.pointerId) return;
    var 간격 = 카드폭 * (1 + 사이);
    if (!간격) return;
    var 이제 = performance.now(), 이전 = 위치;
    var 끈거리 = e.clientX - 끌기.x;
    끌기.움직임 = Math.max(끌기.움직임, Math.abs(끈거리));
    // 손가락이 조금 흔들린 것은 탭이다. 문턱을 넘어야 끌기로 친다.
    if (!끌기.잡음) {
      if (끌기.움직임 <= 6) return;
      끌기.잡음 = true;
      frame.setPointerCapture(끌기.id);
    }
    위치 = 끌기.시작 - 끈거리 / 간격;
    끌기.v = ((위치 - 이전) / Math.max(이제 - 끌기.t, 1)) * 1000;  // 초당 카드 수
    끌기.t = 이제;
    고른것(가까운(위치));
    그리기();
  });

  function 놓기(e) {
    if (!끌기 || 끌기.id !== e.pointerId) return;
    var 던짐 = Math.max(-2, Math.min(2, 끌기.v * 0.18));   // 세게 던져도 두 칸까지
    // 끌고 나서 손을 떼면 브라우저가 클릭도 함께 발생시킨다. 그대로 두면
    // 넘기려던 손짓이 사진 크게 보기로 이어진다. 직후 잠깐만 막는다.
    if (끌기.움직임 > 6) 클릭막기 = performance.now() + 250;
    끌기 = null;
    안착(Math.round(위치 + 던짐));
  }
  // 한 번만 듣는 임시 처리로 막으면, 그 뒤에 정상적으로 누른 클릭까지
  // 먹어버린다(카드 밖을 눌러 넘긴 다음 카드를 누르면 열리지 않았다).
  frame.addEventListener("click", function (e) {
    if (performance.now() < 클릭막기) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* 옆 카드를 누르면 그 카드가 가운데로 온다. 마우스로는 끌기보다 클릭이
     자연스럽고, 옆 카드는 기울어져 있어 사진을 보려고 누른 것이 아니다.
     가운데 카드를 눌렀을 때만 사진을 크게 연다(그건 그대로 통과시킨다). */
  frame.addEventListener("click", function (e) {
    var card = e.target.closest(".cover__card");
    if (!card) return;
    var i = 카드들.indexOf(card);
    if (i < 0 || i === 고름) return;
    e.preventDefault();
    e.stopPropagation();   // main.js 의 사진 모달까지 가지 않게 여기서 끊는다
    이동(i);
  });

  frame.addEventListener("pointerup", 놓기);
  frame.addEventListener("pointercancel", 놓기);

  frame.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); 한칸(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); 한칸(1); }
  });

  /* ---------- 크기와 가시성 ---------- */
  function 재기() {
    if (!카드들[0]) return;
    카드폭 = 카드들[0].offsetWidth;
    그리기();
  }
  new ResizeObserver(재기).observe(frame);
  재기();

  // 화면 밖이면 그릴 이유가 없다. 스크롤이 무거워지지 않게 멈춘다.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      보임 = entries[0].isIntersecting;
      if (보임) 그리기();
      else if (raf !== null) { cancelAnimationFrame(raf); raf = null; 위치 = 목표; }
    }, { rootMargin: "80px" }).observe(wrap);
  }

  고른것(0);
  그리기();
})();
