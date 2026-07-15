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


if __name__ == "__main__":
    main()
