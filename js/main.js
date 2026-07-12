(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  const copyYear = document.getElementById("copyYear");
  if (copyYear) copyYear.textContent = new Date().getFullYear();

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById("siteHeader");
  const toTopBtn = document.getElementById("toTop");
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    toTopBtn.classList.toggle("is-visible", y > 800);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const navMenuMobile = document.getElementById("navMenuMobile");
  navToggle.addEventListener("click", () => {
    const open = navMenuMobile.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  navMenuMobile.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", () => {
      navMenuMobile.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Hero load-in + video ready ---------- */
  const hero = document.getElementById("hero");
  const heroVideo = document.getElementById("heroVideo");
  function markLoaded() { hero.classList.add("is-loaded"); }
  requestAnimationFrame(() => requestAnimationFrame(markLoaded));
  if (heroVideo) {
    heroVideo.addEventListener("canplay", () => heroVideo.classList.add("is-ready"), { once: true });
    heroVideo.addEventListener("loadeddata", () => heroVideo.classList.add("is-ready"), { once: true });
    // Safety: if video fails or is slow, still reveal poster background
    setTimeout(() => heroVideo.classList.add("is-ready"), 1800);
  }

  /* ---------- CEO section video ready ---------- */
  const ceoVideo = document.getElementById("ceoVideo");
  if (ceoVideo) {
    ceoVideo.addEventListener("canplay", () => ceoVideo.classList.add("is-ready"), { once: true });
    ceoVideo.addEventListener("loadeddata", () => ceoVideo.classList.add("is-ready"), { once: true });
    setTimeout(() => ceoVideo.classList.add("is-ready"), 1800);
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val + (p >= 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Business area tabs ---------- */
  const bizTabs = document.querySelectorAll(".biz-tab");
  const bizPanels = document.querySelectorAll(".biz-panel");
  bizTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-tab");
      bizTabs.forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      bizPanels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-panel") === key));
    });
  });

  /* ---------- History scroll-linked year/dots ---------- */
  const historyTimeline = document.getElementById("historyTimeline");
  const historyBigYear = document.getElementById("historyBigYear");
  const historyDots = document.getElementById("historyDots");
  if (historyTimeline && historyBigYear && historyDots) {
    const tlYears = Array.from(historyTimeline.querySelectorAll(".tl-year[data-year]"));
    tlYears.forEach((el, i) => {
      const btn = document.createElement("button");
      btn.className = "history-dot";
      btn.type = "button";
      btn.setAttribute("aria-label", el.getAttribute("data-year"));
      btn.addEventListener("click", () => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      historyDots.appendChild(btn);
      if (i === 0) btn.classList.add("is-active");
    });
    const dotEls = Array.from(historyDots.children);

    let activeIndex = -1;
    function setActiveHistory(index) {
      if (index === activeIndex) return;
      activeIndex = index;
      const year = tlYears[index].getAttribute("data-year");
      historyBigYear.textContent = year;
      historyBigYear.classList.toggle("is-long", year.length > 4);
      dotEls.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }

    function updateActiveHistory() {
      const centerY = window.innerHeight / 2;
      let closest = 0;
      let closestDist = Infinity;
      tlYears.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActiveHistory(closest);
    }

    if (window.matchMedia("(min-width:961px)").matches) {
      let ticking = false;
      document.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            updateActiveHistory();
            ticking = false;
          });
        },
        { passive: true }
      );
      updateActiveHistory();
    }
  }

  /* ---------- Portfolio grid render ---------- */
  const pfGrid = document.getElementById("pfGrid");
  function cardTemplate(p) {
    const tags = p.tags.map((t) => `<span class="pf-tag">${t}</span>`).join("");
    return `
      <div class="pf-card" data-tags="${p.tags.join(",")}" data-no="${p.no}" tabindex="0" role="button" aria-label="${p.name} 상세 보기">
        <div class="pf-thumb">
          <img src="${p.img}" alt="${p.name} 프로젝트 이미지" loading="lazy">
          <span class="pf-no">NO. ${String(p.no).padStart(2, "0")}</span>
          <span class="pf-ring" aria-hidden="true"></span>
        </div>
        <div class="pf-body">
          <div class="pf-tags">${tags}</div>
          <h3>${p.name}</h3>
          <p class="pf-loc">${p.location}</p>
        </div>
      </div>`;
  }
  if (pfGrid && typeof PROJECTS !== "undefined") {
    pfGrid.innerHTML = PROJECTS.map(cardTemplate).join("");
  }

  /* ---------- Portfolio filters ---------- */
  const chips = document.querySelectorAll(".pf-chip");
  const cards = () => document.querySelectorAll(".pf-card");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      const filter = chip.getAttribute("data-filter");
      cards().forEach((card) => {
        const tags = card.getAttribute("data-tags").split(",");
        const show = filter === "all" || tags.includes(filter);
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---------- Portfolio modal ---------- */
  const modal = document.getElementById("pfModal");
  const modalImg = document.getElementById("pfModalImg");
  const modalTitle = document.getElementById("pfModalTitle");
  const modalTags = document.getElementById("pfModalTags");
  const modalSpec = document.getElementById("pfModalSpec");
  const modalClose = document.getElementById("pfModalClose");
  let lastFocused = null;

  function openModal(project) {
    modalImg.src = project.img;
    modalImg.alt = project.name + " 프로젝트 이미지";
    modalTitle.textContent = project.name;
    modalTags.innerHTML = project.tags.map((t) => `<span class="pf-tag">${t}</span>`).join("");
    modalSpec.innerHTML = `
      <div class="row"><dt>발주처</dt><dd>${project.client}</dd></div>
      <div class="row"><dt>위치</dt><dd>${project.location}</dd></div>
      <div class="row"><dt>규모</dt><dd>${project.scale}</dd></div>
      <div class="row"><dt>시공사</dt><dd>${project.builder}</dd></div>
      <div class="row"><dt>사업기간</dt><dd>${project.period}</dd></div>
    `;
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  if (pfGrid) {
    pfGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".pf-card");
      if (!card) return;
      const project = PROJECTS.find((p) => p.no === parseInt(card.getAttribute("data-no"), 10));
      if (project) openModal(project);
    });
    pfGrid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".pf-card");
      if (!card) return;
      e.preventDefault();
      const project = PROJECTS.find((p) => p.no === parseInt(card.getAttribute("data-no"), 10));
      if (project) openModal(project);
    });
  }
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
})();
