#!/usr/bin/env python3
"""각 페이지가 마지막으로 바뀐 날짜를 git에서 읽어 sitemap.xml을 다시 쓴다.

lastmod를 손으로 적어두면 페이지를 고쳐도 날짜가 그대로 남는다.
검색엔진은 그 날짜를 보고 "안 바뀌었다"고 판단해 다시 읽어가지 않는다.
문구를 고치고 배포하기 전에 한 번 돌리면 된다.

    python3 tools/build-sitemap.py
"""
import os
import subprocess
import sys
from datetime import date

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://korealty.co.kr"

# (파일, 주소, 우선순위) — 404는 검색에 넣지 않는다.
PAGES = [
    ("index.html",     "/",               "1.0"),
    ("portfolio.html", "/portfolio.html", "0.9"),
    ("about.html",     "/about.html",     "0.8"),
    ("business.html",  "/business.html",  "0.8"),
    ("contact.html",   "/contact.html",   "0.7"),
]


def last_changed(path):
    """git이 기록한 마지막 커밋 날짜. 커밋된 적 없으면 오늘."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cd", "--date=short", "--", path],
            cwd=SITE, capture_output=True, text=True, check=True,
        ).stdout.strip()
        return out or date.today().isoformat()
    except subprocess.CalledProcessError:
        return date.today().isoformat()


def main():
    dirty = subprocess.run(
        ["git", "status", "--porcelain", "--"] + [p for p, _, _ in PAGES],
        cwd=SITE, capture_output=True, text=True,
    ).stdout.strip()

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, url, prio in PAGES:
        # 아직 커밋 안 한 수정이 있으면 그 페이지는 오늘 바뀐 것으로 본다.
        pending = any(line.endswith(path) for line in dirty.splitlines())
        when = date.today().isoformat() if pending else last_changed(path)
        lines.append(
            f"  <url><loc>{BASE}{url}</loc>"
            f"<lastmod>{when}</lastmod>"
            f"<priority>{prio}</priority></url>"
        )
        print(f"  {url:<18} {when}{'  (수정 중)' if pending else ''}")
    lines.append("</urlset>")

    with open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("sitemap.xml 갱신 완료")


if __name__ == "__main__":
    main()
