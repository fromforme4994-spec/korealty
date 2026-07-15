#!/usr/bin/env python3
"""js/data.js의 PROJECTS를 읽어 portfolio.html에 정적 카드로 써 넣는다.

실적을 화면에 그리는 것은 여전히 main.js다. 이 스크립트는 같은 마크업을
HTML에도 남겨서, 자바스크립트를 실행하지 않는 크롤러(GPTBot 등)와 검색엔진이
28건을 읽을 수 있게 한다. main.js가 board.innerHTML을 교체하므로 브라우저
화면에는 영향이 없다.

data.js를 고친 뒤 이 스크립트를 다시 돌리면 HTML이 갱신된다.
카드 마크업은 main.js의 card() 함수와 일치해야 한다.

  python3 tools/build-portfolio.py
"""

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "js" / "data.js"
PAGE = ROOT / "portfolio.html"
MAPJS = ROOT / "js" / "map.js"
MAINJS = ROOT / "js" / "main.js"

# 실적 건수가 문구에 박혀 있는 파일들. 건수가 바뀌면 여기 숫자를 자동으로 맞춘다.
COUNT_PAGES = ["index.html", "portfolio.html", "about.html", "404.html"]

BEGIN = "<!-- build-portfolio: 아래는 tools/build-portfolio.py가 생성한다. 직접 고치지 말 것. -->"
END = "<!-- /build-portfolio -->"


def parse_projects(src: str) -> list[dict]:
    """data.js의 PROJECTS 배열에서 객체 리터럴을 뽑아 dict로 만든다."""
    m = re.search(r"const PROJECTS\s*=\s*\[(.*?)\n\];", src, re.S)
    if not m:
        sys.exit("PROJECTS 배열을 찾지 못했다. data.js 구조가 바뀌었는지 확인할 것.")

    projects = []
    for block in re.findall(r"\{(.*?)\}", m.group(1), re.S):
        item = {}
        # key: "값"  |  key: 숫자  |  key: null
        for key, quoted, bare in re.findall(
            r'(\w+)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|([^,}\s][^,}]*))', block
        ):
            raw = quoted if quoted else bare.strip()
            if quoted:
                item[key] = raw
            elif raw == "null":
                item[key] = None
            else:
                item[key] = int(raw) if raw.lstrip("-").isdigit() else raw
        if "no" in item:
            projects.append(item)
    return projects


def card(p: dict) -> str:
    """main.js의 card()와 같은 마크업."""
    e = lambda v: html.escape(str(v), quote=True)
    scale = e(p["scale"])
    if p.get("up") is not None:
        scale += f" · 지하 {e(p['down'])}층 / 지상 {e(p['up'])}층"
    return f"""        <article class="proj rise is-in" data-cat="{e(p['cat'])}">
          <div>
            <span class="proj__no num">NO. {str(p['no']).zfill(2)}</span>
            <span class="proj__type">{e(p['type'])}</span>
            <h3>{e(p['name'])}</h3>
            <dl>
              <dt>발주처</dt><dd>{e(p['client'])}</dd>
              <dt>위치</dt><dd>{e(p['loc'])}</dd>
              <dt>규모</dt><dd>{scale}</dd>
              <dt>시공사</dt><dd>{e(p['builder'])}</dd>
              <dt>사업기간</dt><dd>{e(p['period'])}</dd>
            </dl>
          </div>
        </article>"""


def sync_counts(total: int, seoul: int) -> list[str]:
    """하드코딩된 실적 숫자를 실제 건수로 맞춘다. 바꾼 파일 목록을 돌려준다."""
    away = total - seoul
    # (찾을 패턴, 바꿀 값) — 문구 구조가 바뀌면 매치가 0이 되어 경고로 드러난다.
    rules = [
        (re.compile(r"실적 \d+건"), f"실적 {total}건"),
        (re.compile(r"\d+건의 분양대행 실적"), f"{total}건의 분양대행 실적"),
        (re.compile(r"\d+건의 프로젝트"), f"{total}건의 프로젝트"),
        (re.compile(r"2006년부터 \d+건"), f"2006년부터 {total}건"),
        (re.compile(r"(누적 프로젝트</dt><dd>)\d+"), rf"\g<1>{total}"),
        (re.compile(r"(data-count>)\d+"), rf"\g<1>{total}"),
        (re.compile(r"\d+개 현장, \d+개 유형"), f"{total}개 현장, 5개 유형"),
        (re.compile(r"\d+개 현장을 수행했습니다"), f"{seoul}개 현장을 수행했습니다"),
        (re.compile(r"나머지 \d+개는"), f"나머지 {away}개는"),
        (re.compile(r"(서울 외 현장<b>)\d+건"), rf"\g<1>{away}건"),
    ]
    changed = []
    for name in COUNT_PAGES:
        path = ROOT / name
        src = path.read_text(encoding="utf-8")
        out = src
        for pat, rep in rules:
            out = pat.sub(rep, out)
        if out != src:
            path.write_text(out, encoding="utf-8")
            changed.append(name)
    return changed


def warn_manual_spots(projects: list[dict], total: int) -> None:
    """스크립트가 자동으로 못 맞추는 곳을 사람에게 알린다."""
    # 1. 서울 지도 좌표(SITE_XY)가 없는 현장 — 지도에 핀이 안 찍힌다.
    site_xy = set()
    m = re.search(r"const SITE_XY\s*=\s*\{(.*?)\n\};", MAPJS.read_text(encoding="utf-8"), re.S)
    if m:
        site_xy = {int(n) for n in re.findall(r"^\s*(\d+)\s*:", m.group(1), re.M)}
    no_pin = [p for p in projects if p["no"] not in site_xy]
    seoul_like = [p for p in no_pin if re.search(r"(강남|강동|강북|강서|관악|광진|구로|금천|노원|도봉|동대문|동작|마포|서대문|서초|성동|성북|송파|양천|영등포|용산|은평|종로|중구|중랑)구", p["loc"])]
    if seoul_like:
        print("  ⚠ 서울 주소인데 map.js SITE_XY에 좌표가 없는 현장 (지도에 안 나온다):")
        for p in seoul_like:
            print(f"      no:{p['no']} {p['name']} — {p['loc'][:30]}")

    # 2. 필터에 없는 새 유형 — 목록에는 나오지만 필터로 못 거른다.
    m = re.search(r'const cats = \[([^\]]+)\]', MAINJS.read_text(encoding="utf-8"))
    cats = set(re.findall(r'"([^"]+)"', m.group(1))) if m else set()
    new_cats = {p["cat"] for p in projects} - cats
    if new_cats:
        print(f"  ⚠ main.js 필터 목록에 없는 유형: {new_cats} — cats 배열에 추가할 것")

    # 3. data.js 안의 마케팅 카드 뱃지(metric: "N건")가 어긋나면 알린다.
    d = DATA.read_text(encoding="utf-8")
    m = re.search(r'metric:\s*"(\d+)건"', d)
    if m and int(m.group(1)) != total:
        print(f"  ⚠ data.js의 metric \"{m.group(1)}건\"이 실제 {total}건과 다르다 — 직접 고칠 것")

    # 4. 서울 외 도시 나열은 문구라서 자동으로 못 고친다.
    print("  ※ 서울 외 현장이 늘었다면 index/portfolio의 도시 나열(포항·경산…)은 직접 고칠 것")
    print("  ※ 배포 전 tools/build-sitemap.py도 한 번 돌릴 것 (lastmod 갱신)")


def main() -> None:
    projects = parse_projects(DATA.read_text(encoding="utf-8"))
    if not projects:
        sys.exit("프로젝트를 하나도 읽지 못했다.")

    cards = "\n".join(card(p) for p in projects)
    block = f'{BEGIN}\n{cards}\n      {END}'

    page = PAGE.read_text(encoding="utf-8")

    # 재실행이면 기존 생성 블록(BEGIN..END)만 교체한다. 컨테이너 안 </div>를
    # 정규식으로 찾으면 카드 내부의 </div>에서 멈춰 중복 삽입되므로 안 된다.
    if BEGIN in page and END in page:
        pre, rest = page.split(BEGIN, 1)
        _, post = rest.split(END, 1)
        updated = f"{pre}{block}{post}"
    else:
        anchor = '<div class="grid grid--2" data-projects>'
        if anchor not in page:
            sys.exit("portfolio.html에서 data-projects 컨테이너를 찾지 못했다.")
        open_tag, post = page.split(anchor, 1)
        if not post.lstrip().startswith("</div>"):
            sys.exit("컨테이너가 비어 있지 않은데 생성 마커도 없다. 수동 확인 필요.")
        post = post.lstrip()[len("</div>"):]
        updated = f"{open_tag}{anchor}\n{block}\n      </div>{post}"
    PAGE.write_text(updated, encoding="utf-8")
    print(f"portfolio.html에 프로젝트 {len(projects)}건을 써 넣었다.")

    # 서울 건수 = 지도 좌표(SITE_XY)가 있는 현장 수. 화면의 지도 로직과 같은 기준이다.
    m = re.search(r"const SITE_XY\s*=\s*\{(.*?)\n\};", MAPJS.read_text(encoding="utf-8"), re.S)
    site_xy = {int(n) for n in re.findall(r"^\s*(\d+)\s*:", m.group(1), re.M)} if m else set()
    seoul = sum(1 for p in projects if p["no"] in site_xy)

    changed = sync_counts(len(projects), seoul)
    if changed:
        print(f"실적 건수 문구를 갱신했다: {', '.join(changed)}")
    warn_manual_spots(projects, len(projects))


if __name__ == "__main__":
    main()
