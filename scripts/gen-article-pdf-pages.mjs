/**
 * สร้าง src/articlePdfPages.js จาก public/Criminal_law_update.pdf
 * รัน: node scripts/gen-article-pdf-pages.mjs (ต้องมี pypdf: pip install pypdf)
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pdf = join(root, "public", "Criminal_law_update.pdf");
const out = join(root, "src", "articlePdfPages.js");

const py = `
from pypdf import PdfReader
import re
import json
th = str.maketrans('๐๑๒๓๔๕๖๗๘๙', '0123456789')
r = PdfReader(r'''${pdf.replace(/\\/g, "\\\\")}''')
# บรรทัดใหม่ + มาตรา + เลข (ไม่ติดกับเลขต่อท้าย) + เนื้อความมาตรา
line_pat = re.compile(r'(?:^|\\n)\\s*มาตรา\\s*(\\d+)(?:/(\\d+))?\\s+\\S', re.MULTILINE)
start_pat = re.compile(
    r'มาตรา\\s*(\\d+(?:\\s*/\\s*\\d+)?)\\s{1,6}(?:ผู้ใด|ผู้|บุคคล|ถ้า|ใน|เจ้าพนักงาน|เจ้า|หญิง|ความ|ข้อ|เมื่อ|อัน|ซึ่ง|ไม่|ย่อม|โทษ|ห้าม|ทรัพย์|การ|เด็ก|ข้อความ|เลข|องค์|ภาย|แม้|แต่|ใคร|คน|หาก|ทรง|พระราช|นาย|ส่วน|ความผิด|อาญา|ฝ่าย|บิดา|ภริยา|สามี|หญิงใด|บุรุษ|ผู้ใดกระทำ|ผู้กระทำ|ผู้ถูก|หมู่|สัตว์|เรือ|อากาศยาน|ผู้ซึ่ง|ผู้นั้น|ผู้หนึ่ง|หญิง|บุคคลใด)'
)
first = {}
for i, p in enumerate(r.pages):
    t = (p.extract_text() or '').translate(th)
    for m in line_pat.finditer(t):
        main = str(int(m.group(1)))
        sub = m.group(2)
        keys = [main]
        if sub:
            keys.append(main + '/' + str(int(sub)))
        for k in keys:
            pg = i + 1
            if k not in first or pg < first[k]:
                first[k] = pg
    for m in start_pat.finditer(t):
        raw = re.sub(r'\\s+', '', m.group(1))
        if '/' in raw:
            a, b = raw.split('/')
            keys = [str(int(a)), str(int(a)) + '/' + str(int(b))]
        else:
            keys = [str(int(raw))]
        for k in keys:
            pg = i + 1
            if k not in first or pg < first[k]:
                first[k] = pg
print(json.dumps(first, ensure_ascii=False))
`;

const json = execFileSync("python", ["-c", py], { encoding: "utf8" });
const raw = JSON.parse(json.trim());
function isValidArticleKey(k) {
  const m = /^(\d{1,3})(?:\/(\d{1,2}))?$/.exec(k);
  if (!m) return false;
  const a = parseInt(m[1], 10);
  const b = m[2] != null ? parseInt(m[2], 10) : null;
  if (a < 1 || a > 400) return false;
  if (b != null && (b < 1 || b > 40)) return false;
  return true;
}
const map = Object.fromEntries(Object.entries(raw).filter(([k]) => isValidArticleKey(k)));
const keys = Object.keys(map).sort((a, b) => {
    const pa = a.split("/");
    const pb = b.split("/");
    const na = parseInt(pa[0], 10);
    const nb = parseInt(pb[0], 10);
    if (na !== nb) return na - nb;
    return (parseInt(pa[1] || "0", 10) || 0) - (parseInt(pb[1] || "0", 10) || 0);
  });
const lines = keys.map((k) => `  "${k}": ${map[k]},`);
const file = `/** สร้างอัตโนมัติจาก scripts/gen-article-pdf-pages.mjs + public/Criminal_law_update.pdf — เลขหน้า = หน้าในไฟล์ PDF (เปิดด้วย #page=) */
export const CRIMINAL_LAW_PDF = "/Criminal_law_update.pdf";
export const ARTICLE_PDF_PAGES = {
${lines.join("\n")}
};
export function pdfPageForArticle(num) {
  if (num == null || num === "") return null;
  const s = String(num).trim();
  if (ARTICLE_PDF_PAGES[s] != null) return ARTICLE_PDF_PAGES[s];
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && ARTICLE_PDF_PAGES[String(n)] != null) return ARTICLE_PDF_PAGES[String(n)];
  return null;
}
/** เปิด PDF ที่หน้าที่ระบุ — เบราว์เซอร์ส่วนใหญ่รองรับ fragment #page= */
export function criminalLawPdfUrl(page) {
  const u = CRIMINAL_LAW_PDF;
  if (page == null || page < 1) return u;
  return \`\${u}#page=\${page}\`;
}
`;
writeFileSync(out, file, "utf8");
console.log("Wrote", out, "keys:", keys.length);
