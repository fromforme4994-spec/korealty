/* KOREALTY DMC — interactions */

(function () {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Mobile navigation ---------- */
  const burger = $(".burger");
  const nav = $(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Scroll reveal ---------- */
  const rise = $$(".rise");
  if (rise.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    rise.forEach((el) => io.observe(el));
  }

  /* ---------- Scope explorer: pins + tabs + card ---------- */
  const scope = $("[data-scope]");
  if (scope && typeof SCOPES !== "undefined") {
    const card  = $("[data-scope-card]", scope);
    const tabs  = $("[data-scope-tabs]", scope);
    const image = $(".scope", scope);

    SCOPES.forEach((s, i) => {
      const pin = document.createElement("button");
      pin.className = "pin";
      pin.type = "button";
      pin.textContent = "+";
      pin.style.left = s.pin.x + "%";
      pin.style.top  = s.pin.y + "%";
      pin.setAttribute("aria-expanded", String(i === 0));
      pin.setAttribute("aria-label", s.title + " 자세히 보기");
      pin.addEventListener("click", () => select(i));
      image.appendChild(pin);

      const tab = document.createElement("button");
      tab.type = "button";
      tab.textContent = s.tab;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(i === 0));
      tab.addEventListener("click", () => select(i));
      tabs.appendChild(tab);
    });

    function select(i) {
      const s = SCOPES[i];
      $$(".pin", image).forEach((p, k) => p.setAttribute("aria-expanded", String(k === i)));
      $$("button", tabs).forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));

      card.innerHTML = `
        <h3 class="h-card">${s.title}</h3>
        <p>${s.desc}</p>
        <ol class="scope__flow">
          ${s.flow.map((f, k) => `<li><b>${String(k + 1).padStart(2, "0")}</b><span>${f}</span></li>`).join("")}
        </ol>
        <div class="scope__cost">
          <span>${s.metricLabel}</span>
          <b>${s.metric}</b>
        </div>`;
    }

    select(0);
  }

  /* ---------- Site map ----------
     현장을 실제 위치에 찍는다. 실적에서 가장 먼저 궁금한 것은 "어디"이기 때문이다. */
  const map = $("[data-map]");
  if (map && typeof PROJECTS !== "undefined" && typeof SEOUL_GU !== "undefined") {
    /* 라벨은 지도 상자 안에 앉는다. 상자가 가운데로 좁아져도 함께 따라오도록
       DOM에서도 .map 안으로 넣는다. */
    const card = $("[data-map-card]");
    map.appendChild(card);

    /* 핀은 지도와 같은 상자 안에서 %로 찍힌다. SVG만 가운데 옮기면 핀이 어긋나므로
       둘을 같은 래퍼(.map__plot)에 넣는다. */
    const plot = document.createElement("div");
    plot.className = "map__plot";
    map.appendChild(plot);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1000 620");
    svg.setAttribute("class", "map__svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "서울 프로젝트 위치 지도");

    SEOUL_GU.forEach((gu) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", gu.d);
      path.setAttribute("class", "map__gu");
      path.innerHTML = `<title>${gu.name}</title>`;
      svg.appendChild(path);
    });
    plot.appendChild(svg);

    /* 서울 외 지역 목록도 지도 상자 안으로 옮긴다. 밖에 두면 바로 아래 필터 버튼과
       생김새가 같아 누를 수 있는 것처럼 보인다. plot 뒤에 붙어 지도 아래에 앉는다. */
    const away = map.parentElement.querySelector(".map__away");
    if (away) map.appendChild(away);

    const inSeoul = PROJECTS.filter((p) => SITE_XY[p.no]);

    function show(p) {
      $$(".map__pin", plot).forEach((b) =>
        b.setAttribute("aria-expanded", String(Number(b.dataset.no) === p.no))
      );
      card.innerHTML = `<span>현장명 :</span><b>${p.name}</b>`;
      card.hidden = false;
    }

    inSeoul.forEach((p) => {
      const xy = SITE_XY[p.no];
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map__pin";
      pin.dataset.no = p.no;
      pin.dataset.cat = p.cat;
      pin.style.left = (xy.x / 1000 * 100) + "%";
      pin.style.top = (xy.y / 620 * 100) + "%";
      pin.setAttribute("aria-expanded", "false");
      pin.setAttribute("aria-label", `${p.name} — ${p.loc}`);
      pin.innerHTML = `<i></i><span class="map__label">${p.name}</span>`;
      pin.addEventListener("click", () => show(p));
      plot.appendChild(pin);
    });

    /* 마곡 퀸즈파크9·10처럼 실제로 몇 미터 거리인 현장들은 동그라미가 겹쳐
       아래 핀을 아예 누를 수 없다. 겹치는 것끼리만 최소 간격까지 밀어낸다.
       지도 크기가 바뀌면 겹침 정도도 달라지므로 픽셀 기준으로 다시 계산한다. */
    const MIN_GAP = 19; // 동그라미 14px + 여유

    function declutter() {
      const W = plot.clientWidth, H = plot.clientHeight;
      if (!W) return;
      const items = $$(".map__pin", plot).map((pin) => ({
        pin,
        bx: parseFloat(pin.style.left) / 100 * W,
        by: parseFloat(pin.style.top) / 100 * H,
      }));
      items.forEach((it) => { it.x = it.bx; it.y = it.by; });

      for (let pass = 0; pass < 80; pass++) {
        let moved = false;
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            if (d >= MIN_GAP) continue;
            if (d < 0.01) { dx = Math.cos(i); dy = Math.sin(i); d = 1; }
            const push = (MIN_GAP - d) / 2;
            const ux = dx / d, uy = dy / d;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
            moved = true;
          }
        }
        if (!moved) break;
      }

      items.forEach((it) => {
        it.pin.style.transform =
          `translate(${-7 + (it.x - it.bx)}px, ${-7 + (it.y - it.by)}px)`;
      });
    }

    declutter();
    if (window.ResizeObserver) new ResizeObserver(declutter).observe(plot);

    /* 처음 열었을 때 마곡 퀸즈파크10(NO.18)을 띄운다. 필터로 빠져 있으면 첫 현장. */
    show(inSeoul.find((p) => p.no === 18) || inSeoul[0]);

    /* 필터가 지도와 목록을 동시에 좁힌다.
       유형에 따라 서울에 현장이 하나도 없을 수 있다(조합 2건은 일산·김포).
       그때 지도만 비면 고장으로 보이므로 이유를 적는다. */
    const empty = document.createElement("p");
    empty.className = "map__empty";
    empty.hidden = true;
    map.appendChild(empty);

    map.filterTo = (cat) => {
      let shown = 0;
      $$(".map__pin", plot).forEach((b) => {
        const hit = cat === "전체" || b.dataset.cat === cat;
        b.hidden = !hit;
        if (hit) shown++;
      });

      if (shown === 0) {
        empty.textContent = `${cat} 현장은 서울 밖에 있습니다. 아래 목록에서 확인하세요.`;
        empty.hidden = false;
        card.hidden = true;
      } else {
        empty.hidden = true;
        card.hidden = false;
        const active = $(".map__pin[aria-expanded='true']", plot);
        if (!active || active.hidden) {
          const first = $$(".map__pin", plot).find((b) => !b.hidden);
          if (first) first.click();
        }
      }
    };
  }

  /* ---------- Portfolio: filter + render ---------- */
  const board = $("[data-projects]");
  if (board && typeof PROJECTS !== "undefined") {
    const rail = $("[data-filters]");
    const count = $("[data-count]");
    const cats = ["전체", "오피스텔", "주거", "상가", "조합", "오피스"];

    function card(p) {
      return `
        <article class="proj rise is-in" data-cat="${p.cat}">
          <div>
            <span class="proj__no num">NO. ${String(p.no).padStart(2, "0")}</span>
            <span class="proj__type">${p.type}</span>
            <h3>${p.name}</h3>
            <dl>
              <dt>발주처</dt><dd>${p.client}</dd>
              <dt>위치</dt><dd>${p.loc}</dd>
              <dt>규모</dt><dd>${p.scale}${p.up !== null ? ` · 지하 ${p.down}층 / 지상 ${p.up}층` : ""}</dd>
              <dt>시공사</dt><dd>${p.builder}</dd>
              <dt>사업기간</dt><dd>${p.period}</dd>
            </dl>
          </div>
        </article>`;
    }

    function render(cat) {
      const list = cat === "전체" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat);
      board.innerHTML = list.map(card).join("");
      if (count) count.textContent = list.length;
    }

    cats.forEach((c, i) => {
      const n = c === "전체" ? PROJECTS.length : PROJECTS.filter((p) => p.cat === c).length;
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `${c}<span class="num">${n}</span>`;
      b.setAttribute("aria-pressed", String(i === 0));
      b.addEventListener("click", () => {
        $$("button", rail).forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        render(c);
        const m = $("[data-map]");
        if (m && m.filterTo) m.filterTo(c);
      });
      rail.appendChild(b);
    });

    render("전체");
  }
})();
