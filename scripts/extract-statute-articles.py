# -*- coding: utf-8 -*-
"""ดึงข้อความมาตราจาก public/Criminal_law_update.pdf -> statuteArticles.json"""
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("pip install pypdf", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public" / "Criminal_law_update.pdf"
OUT_SRC = ROOT / "src" / "statuteArticles.json"
OUT_PUB = ROOT / "public" / "statuteArticles.json"

TH = str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")

# ประมวลกฎหมายอาญา มาตราหลักสูงสุด ~397 — เลขอ้างอิง/ตัวห้อยต่อท้ายมัก 1–4 หลัก (เช่น มาตรา ๓๐๕ ตัวห้อย ๑๑๙ → สกัดเป็น 305119)
MAX_ARTICLE_MAIN = 397
MAX_FOOTNOTE_DIGITS = 4


def split_glued_article_and_footnote(digits: str) -> tuple[str, str] | None:
    """แยกเลขมาตรา (1–397) กับเลขอ้างอิงติดกัน เช่น 305119 → 305 + 119"""
    if not digits.isdigit() or len(digits) < 4:
        return None
    for i in range(min(3, len(digits)), 0, -1):
        main, rest = digits[:i], digits[i:]
        try:
            v = int(main)
        except ValueError:
            continue
        if 1 <= v <= MAX_ARTICLE_MAIN:
            if rest == "":
                return main, rest
            if rest.isdigit() and 1 <= len(rest) <= MAX_FOOTNOTE_DIGITS:
                return main, rest
    return None


def normalize_glued_superscript_footnotes(text: str) -> str:
    """แก้กรณี PDF ดึงเลขมาตรา+เลขอ้างอิงตัวห้อยติดกัน (มาตรา ๓๐๕๑๑๙ → 305119) ให้ regex จับเลขมาตราได้"""
    text = unicodedata.normalize("NFKC", text)
    for z in ("\u200b", "\u200c", "\u200d", "\ufeff"):
        text = text.replace(z, "")

    def repl(m: re.Match[str]) -> str:
        prefix, digits, tail = m.group(1), m.group(2), m.group(3)
        sp = split_glued_article_and_footnote(digits)
        if sp is None:
            return m.group(0)
        main, _fn = sp
        return f"{prefix}{main} {tail}"

    def repl_break(m: re.Match[str]) -> str:
        prefix, digits = m.group(1), m.group(2)
        sp = split_glued_article_and_footnote(digits)
        if sp is None:
            return m.group(0)
        main, _fn = sp
        return f"{prefix}{main}\n"

    # เลข 4 หลักขึ้นไป แล้วขึ้นบรรทัดใหม่ (เนื้อความมาตราอยู่บรรทัดถัดไป)
    text = re.sub(
        r"(มาตรา(?:\s*\[[\d]+\])*\s*)(\d{4,})(?=\s*\n)",
        repl_break,
        text,
    )
    # เลขติดตัวห้อยแล้วต่อด้วยตัวอักษรไทยหรือวงเปิด — ตัดเลขอ้างอิงออกจากหัวมาตรา
    return re.sub(
        r"(มาตรา(?:\s*\[[\d]+\])*\s*)(\d{4,})\s*([\u0e00-\u0e5f\(])",
        repl,
        text,
    )


def _compact_thai_line(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    for z in ("\u200b", "\u200c", "\u200d", "\ufeff"):
        s = s.replace(z, "")
    return re.sub(r"\s+", "", s)


def clean_pdf_header_footer_noise(body: str) -> str:
    """ตัดหัว/ท้ายกระดาษ PDF (ชื่อสำนักงานกฤษฎีกาแบบถูกและแบบตัวเพี้ยน, เลขหน้า) ออกจากข้อความมาตรา"""
    if not body or not body.strip():
        return body
    out = body
    for pat in (
        r"สำนักงานคณะกรรมการกฤษฎีกา",
        r"สํานักงานคณะกรรมการกฤษฎีกา",
        r"ส\s*ํ?\s*านักง\s*ํ?\s*าน\s*คณะกรรมก\s*ํ?\s*ารกฤษฎีก\s*ํ?\s*า",
    ):
        out = re.sub(pat, " ", out, flags=re.UNICODE)
    out = re.sub(r"[ \t]{2,}", " ", out)
    lines = out.split("\n")
    kept: list[str] = []
    for line in lines:
        raw = line.strip()
        if not raw:
            kept.append("")
            continue
        if (
            "มาตรา" in raw
            or "พระราชบัญญัติ" in raw
            or "พ.ศ." in raw
            or "ราชกิจจานุเบกษา" in raw
        ):
            kept.append(line)
            continue
        if re.fullmatch(r"[-–—\s\d๐-๙]+", raw) and len(raw) <= 28:
            continue
        comp = _compact_thai_line(raw)
        if "สำนักงานคณะกรรมการกฤษฎีกา" in comp:
            continue
        if "คณะกรรมการกฤษฎีกา" in comp and len(comp) < 95:
            continue
        if not comp:
            continue
        kept.append(line.rstrip())
    text = "\n".join(kept)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def norm_key(raw: str) -> str | None:
    raw = raw.strip().replace(" ", "")
    if "/" in raw:
        a, b = raw.split("/", 1)
        try:
            return f"{int(a)}/{int(b)}"
        except ValueError:
            return None
    try:
        return str(int(raw))
    except ValueError:
        return None


def main():
    r = PdfReader(str(PDF))
    chunks = []
    for p in r.pages:
        chunks.append((p.extract_text() or "").translate(TH))
    text = "\n\n".join(chunks)
    text = normalize_glued_superscript_footnotes(text)

    # รองรับ มาตรา [44] 305 ถ้า / มาตรา 305[44]ถ้า / มาตรา 305 ถ้า (หลังเลขอาจมีเลขอ้างอิงในวงเล็บหรือไม่มีช่องว่างก่อนตัวอักษรแรกของเนื้อความ)
    pat = re.compile(
        r"(?:^|\n)\s*มาตรา\s*(?:\[[\d]+\]\s*)*(\d+(?:\s*/\s*\d+)?)\s*(?:\[[\d]+\]\s*)*(\S)"
    )
    articles: dict[str, str] = {}
    matches = list(pat.finditer(text))
    for i, m in enumerate(matches):
        k = norm_key(m.group(1).replace(" ", ""))
        if not k:
            continue
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        body = re.sub(r"[ \t]+", " ", body)
        body = re.sub(r"\n{3,}", "\n\n", body)
        body = clean_pdf_header_footer_noise(body)
        if len(body) < 12:
            continue
        if k not in articles or len(body) > len(articles[k]):
            articles[k] = body

    # บันทึกเป็นฐานข้อมูลข้อความตามตัวอักษร: วรรคแรก / วรรคสอง / ส่วนที่เหลือ / ข้อความเต็ม
    out_obj = {}
    para_split = re.compile(r"\n\s*\n+")
    for num, body in sorted(articles.items(), key=lambda x: (int(x[0].split("/")[0]), x[0])):
        parts = [p.strip() for p in para_split.split(body) if p.strip()]
        p1 = parts[0] if parts else ""
        p2 = parts[1] if len(parts) > 1 else ""
        remainder = "\n\n".join(parts[2:]) if len(parts) > 2 else ""
        out_obj[num] = {
            "fullText": body,
            "paragraph1": p1,
            "paragraph2": p2,
            "remainder": remainder,
            "penalty": "—",
        }

    payload = json.dumps(out_obj, ensure_ascii=False, indent=0)
    OUT_SRC.write_text(payload, encoding="utf-8")
    OUT_PUB.parent.mkdir(parents=True, exist_ok=True)
    OUT_PUB.write_text(payload, encoding="utf-8")
    print("Wrote", OUT_SRC, "&", OUT_PUB, "articles:", len(out_obj))


if __name__ == "__main__":
    main()
