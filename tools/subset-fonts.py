#!/usr/bin/env python3
"""사이트에 실제로 쓰인 글자만 남겨 Pretendard를 woff2로 서브셋한다.

문구를 크게 바꾼 뒤에는 이 스크립트를 다시 돌려야 한다.
빠진 글자는 브라우저 기본 폰트로 떨어져 티가 난다.

    python3 tools/subset-fonts.py
"""
import glob, hashlib, os, re, subprocess, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(SITE, "assets", "fonts", "src")     # 원본 .otf 보관
OUT = os.path.join(SITE, "assets", "fonts")
WEIGHTS = ["Regular", "Medium", "SemiBold", "Bold", "Black"]

# 한글은 음절 수가 많아 전부 넣으면 폰트가 무거워진다.
# 사이트에 실제로 등장하는 글자 + 자주 쓰는 기호만 남긴다.
def used_chars():
    chars = set()
    for pat in ("*.html", "js/*.js", "css/*.css"):
        for p in glob.glob(os.path.join(SITE, pat)):
            chars |= set(open(p, encoding="utf-8").read())
    chars |= set(" 0123456789.,·-—–/()[]{}%:;'\"!?&+~*@#=<>|\\^_`")
    chars |= set("abcdefghijklmnopqrstuvwxyz")
    chars |= set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    chars |= set("㈜①②③④⑤Ⅰ​ⅡⅢⅣⅤⅥ")   # 지명원 표기에 쓰이는 기호
    return "".join(sorted(c for c in chars if c.isprintable()))

def main():
    text = used_chars()
    print(f"보존할 글자 {len(text)}자")
    total = 0
    for w in WEIGHTS:
        src = os.path.join(SRC, f"Pretendard-{w}.otf")
        dst = os.path.join(OUT, f"Pretendard-{w}.woff2")
        if not os.path.exists(src):
            sys.exit(f"원본 폰트를 찾을 수 없습니다: {src}")
        subprocess.run([
            sys.executable, "-m", "fontTools.subset", src,
            f"--text={text}",
            "--flavor=woff2",
            "--layout-features=*",
            f"--output-file={dst}",
        ], check=True)
        kb = os.path.getsize(dst) / 1024
        total += kb
        print(f"  Pretendard-{w}.woff2  {kb:6.0f} KB")
    print(f"합계 {total/1024:.1f} MB")
    stamp_version()

def stamp_version():
    """폰트 URL의 ?v= 를 내용 해시로 갱신한다.

    파일명은 그대로인데 CDN이 1년 immutable로 캐시하므로(vercel.json),
    버전을 바꾸지 않으면 이미 방문한 사람은 옛 폰트를 계속 쓴다.
    새 글자가 두부(□)로 보이는 원인이 이것이다.
    """
    h = hashlib.sha1()
    for w in WEIGHTS:
        with open(os.path.join(OUT, f"Pretendard-{w}.woff2"), "rb") as f:
            h.update(f.read())
    v = h.hexdigest()[:8]

    pat = re.compile(r"(Pretendard-\w+\.woff2)(\?v=[0-9a-f]+)?")
    for p in glob.glob(os.path.join(SITE, "*.html")) + [os.path.join(SITE, "css", "style.css")]:
        with open(p, encoding="utf-8") as f:
            s = f.read()
        new = pat.sub(lambda m: m.group(1) + "?v=" + v, s)
        if new != s:
            with open(p, "w", encoding="utf-8") as f:
                f.write(new)
    print(f"폰트 버전 {v} 로 HTML·CSS 갱신")

if __name__ == "__main__":
    main()
