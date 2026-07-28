#!/usr/bin/env python3
"""명함(/card)의 카톡·문자 미리보기 이미지를 만든다.

링크를 붙였을 때 회사 홍보 이미지가 아니라 "최준성 대표"가 보이게 한다.
이름이나 직함이 바뀌면 이 스크립트를 다시 돌려 이미지를 갱신한다.

    pip install playwright pillow && playwright install chromium
    python3 tools/build-og-card.py

결과: assets/img/og-card.jpg (1200x630)
"""
import http.server
import os
import socketserver
import threading

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, "assets", "img", "og-card.jpg")
PORT = 8912

# 카톡은 이미지를 작게 줄여 보여준다. 잔글씨를 넣으면 뭉개지므로
# 이름과 상호만 크게 넣는다.
HTML = """<!doctype html><meta charset="utf-8">
<style>
  @font-face{font-family:"Pretendard";src:url("assets/fonts/Pretendard-Medium.woff2") format("woff2");font-weight:500;}
  @font-face{font-family:"Pretendard";src:url("assets/fonts/Pretendard-SemiBold.woff2") format("woff2");font-weight:600;}
  @font-face{font-family:"Pretendard";src:url("assets/fonts/Pretendard-Bold.woff2") format("woff2");font-weight:700;}
  @font-face{font-family:"Pretendard";src:url("assets/fonts/Pretendard-Black.woff2") format("woff2");font-weight:900;}
  *{box-sizing:border-box;margin:0;}
  html,body{width:1200px;height:630px;overflow:hidden;}
  .og{
    width:1200px;height:630px;padding:76px 88px;
    /* 가운데로 모은다. 메신저가 정사각형으로 잘라 보여줘도 이름이 남는다.
       align-items 기본값(stretch)이면 워드마크가 가로로 늘어나므로 반드시 지정한다. */
    display:flex;flex-direction:column;justify-content:center;align-items:center;
    text-align:center;
    font-family:"Pretendard",system-ui,sans-serif;color:#fff;
    background:
      radial-gradient(circle at 82% 20%, rgba(226,61,44,.20) 0 12%, rgba(226,61,44,0) 46%),
      radial-gradient(circle at 16% 86%, rgba(90,116,150,.35) 0 14%, rgba(90,116,150,0) 50%),
      linear-gradient(150deg,#263746 0%, #17242f 55%, #0d151d 100%);
    -webkit-font-smoothing:antialiased;
  }
  .wm{height:38px;width:auto;display:block;margin-bottom:52px;}
  .eyebrow{font-size:25px;font-weight:700;letter-spacing:.2em;color:#F06A5C;margin-bottom:16px;}
  .name{display:flex;align-items:center;gap:24px;}
  .name h1{font-size:112px;font-weight:900;letter-spacing:-.03em;line-height:1;}
  .role{
    font-size:30px;font-weight:700;padding:9px 26px;border-radius:999px;
    border:2px solid rgba(255,255,255,.42);color:#fff;
  }
  .disc{margin-top:26px;font-size:27px;font-weight:500;color:#A9B7C6;letter-spacing:.03em;}
</style>
<div class="og">
  <img class="wm" src="assets/img/logo-intro.png" alt="">
  <div class="eyebrow">코리얼티디엠씨</div>
  <div class="name"><h1>최준성</h1><span class="role">대표</span></div>
  <div class="disc">Development · Marketing · Consulting</div>
</div>
"""


def serve():
    os.chdir(SITE)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image

    tmp = os.path.join(SITE, "_og-card.tmp.html")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(HTML)

    httpd = serve()
    png = os.path.join(SITE, "_og-card.tmp.png")
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 1200, "height": 630})
            pg.goto(f"http://127.0.0.1:{PORT}/_og-card.tmp.html", wait_until="networkidle")
            pg.wait_for_timeout(400)
            pg.screenshot(path=png)
            b.close()
        # 카톡이 다시 압축하므로 원본은 가볍게 둔다.
        Image.open(png).convert("RGB").save(OUT, "JPEG", quality=88, optimize=True)
        print(f"{os.path.relpath(OUT, SITE)}  {os.path.getsize(OUT)//1024} KB")
    finally:
        httpd.shutdown()
        for f in (tmp, png):
            if os.path.exists(f):
                os.remove(f)


if __name__ == "__main__":
    main()
