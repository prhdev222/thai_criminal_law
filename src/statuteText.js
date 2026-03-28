/**
 * แยกข้อความมาตราเป็นวรรค (paragraph) ตามช่องว่างบรรทัด — วรรคแรก / วรรคสอง / ส่วนที่เหลือ
 */

/** ข้อความ placeholder ของโหนด stub — ไม่ถือเป็นข้อความตามกฎหมาย */
const STUB_PLACEHOLDER_MARK = "เปิด PDF ฉบับเต็มเพื่ออ่านข้อความมาตรา";

export function isArticleStubPlaceholderDetail(detail) {
  return typeof detail === "string" && detail.includes(STUB_PLACEHOLDER_MARK);
}

/** ตัดหัว/ท้ายกระดาษ PDF (สำนักงานกฤษฎีกา, เลขหน้า) — ใช้ทั้งตอนแสดงผลและหลังสกัด */
export function cleanStatutePdfNoise(text) {
  if (text == null || typeof text !== "string") return "";
  let out = text;
  const subs = [
    /สำนักงานคณะกรรมการกฤษฎีกา/gu,
    /สํานักงานคณะกรรมการกฤษฎีกา/gu,
    /ส\s*ํ?\s*านักง\s*ํ?\s*าน\s*คณะกรรมก\s*ํ?\s*ารกฤษฎีก\s*ํ?\s*า/gu,
  ];
  for (const pat of subs) out = out.replace(pat, " ");
  out = out.replace(/[ \t]{2,}/g, " ");
  const compact = (s) => {
    let t = s.normalize("NFKC");
    for (const z of ["\u200b", "\u200c", "\u200d", "\ufeff"]) t = t.split(z).join("");
    return t.replace(/\s+/g, "");
  };
  const lines = out.split("\n");
  const kept = [];
  for (const line of lines) {
    const raw = line.trim();
    if (!raw) {
      kept.push("");
      continue;
    }
    if (
      raw.includes("มาตรา") ||
      raw.includes("พระราชบัญญัติ") ||
      raw.includes("พ.ศ.") ||
      raw.includes("ราชกิจจานุเบกษา")
    ) {
      kept.push(line);
      continue;
    }
    if (/^[-–—\s\d\u0E50-\u0E59]+$/.test(raw) && raw.length <= 28) continue;
    const comp = compact(raw);
    if (comp.includes("สำนักงานคณะกรรมการกฤษฎีกา")) continue;
    if (comp.includes("คณะกรรมการกฤษฎีกา") && comp.length < 95) continue;
    if (!comp) continue;
    kept.push(line.replace(/\s+$/g, ""));
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function splitStatuteParagraphs(fullText) {
  if (fullText == null || typeof fullText !== "string") {
    return { paragraph1: "", paragraph2: "", remainder: "", paragraphs: [] };
  }
  const parts = fullText
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    paragraph1: parts[0] ?? "",
    paragraph2: parts[1] ?? "",
    remainder: parts.length > 2 ? parts.slice(2).join("\n\n") : "",
    paragraphs: parts,
  };
}

function normalizePenaltyFromRecord(penaltyRaw) {
  if (penaltyRaw == null) return null;
  const s = String(penaltyRaw).trim();
  if (!s || s === "—" || s === "-") return null;
  return s;
}

/** รวมวรรคจาก p1/p2/remainder เมื่อไม่มี fullText */
function paragraphsFromParts(paragraph1, paragraph2, remainder) {
  const out = [];
  const a = paragraph1 != null ? String(paragraph1).trim() : "";
  const b = paragraph2 != null ? String(paragraph2).trim() : "";
  const c = remainder != null ? String(remainder).trim() : "";
  if (a) out.push(paragraph1);
  if (b) out.push(paragraph2);
  if (c) out.push(...splitStatuteParagraphs(c).paragraphs);
  return out;
}

/** วรรค1 วรรค2 … ใน statuteArticles.json — fullText มักแยกวรรคด้วย \\n บรรทัดเดียว จึงแยกจากฟิลด์นี้เมื่อจำเป็น */
function paragraphsFromWankFields(rec) {
  if (!rec || typeof rec !== "object") return [];
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const key = `วรรค${i}`;
    if (!Object.prototype.hasOwnProperty.call(rec, key)) break;
    const t = cleanStatutePdfNoise(String(rec[key] ?? "")).trim();
    if (!t) break;
    out.push(t);
  }
  return out;
}

/**
 * รวมข้อมูลจาก statuteArticles.json (ถ้ามี) กับโหนดในแอป
 * ถ้ามีเรคคอร์ดใน JSON สำหรับเลขมาตรานี้ — ใช้เฉพาะข้อความจาก JSON ไม่ดึง detail สรุปจาก Mind Map มาแทนข้อความตามกฎหมาย
 * @param {object|null} node - section node
 * @param {Record<string, object>} statuteByNum - จาก import JSON / fetch public/statuteArticles.json
 */
export function resolveStatuteParagraphs(node, statuteByNum) {
  const numKey = node?.num != null ? String(node.num).trim() : "";
  const rec = numKey && statuteByNum && typeof statuteByNum === "object" ? statuteByNum[numKey] : null;

  if (rec && typeof rec === "object" && Object.keys(rec).length > 0) {
    const fullRaw = rec.fullText ?? rec.detail ?? "";
    let fullText = cleanStatutePdfNoise(fullRaw);
    let paragraph1 = "";
    let paragraph2 = "";
    let remainder = "";
    let paragraphs = [];

    // ถ้ามี fullText ให้แบ่งวรรคจาก fullText เสมอ — อย่าใช้ paragraph1/2 จาก JSON ทับ
    // (สกัด PDF มักใส่หมายเหตุ/มาตราอื่นลง paragraph1 ทำให้ ม.2 ม.3 แสดงผิด ทั้งที่ fullText ถูกต้อง)
    if (fullText) {
      const sp = splitStatuteParagraphs(fullText);
      paragraph1 = sp.paragraph1;
      paragraph2 = sp.paragraph2;
      remainder = sp.remainder;
      paragraphs = sp.paragraphs;
      const wank = paragraphsFromWankFields(rec);
      if (
        wank.length >= 2 &&
        (sp.paragraphs.length === 1 || wank.length > sp.paragraphs.length)
      ) {
        paragraphs = wank;
        paragraph1 = wank[0] ?? "";
        paragraph2 = wank[1] ?? "";
        remainder = wank.length > 2 ? wank.slice(2).join("\n\n") : "";
      }
    } else {
      paragraph1 = cleanStatutePdfNoise(rec.paragraph1 ?? "");
      paragraph2 = cleanStatutePdfNoise(rec.paragraph2 ?? "");
      remainder = cleanStatutePdfNoise(rec.remainder ?? "");
      fullText = [paragraph1, paragraph2, remainder].filter(Boolean).join("\n\n");
      paragraphs = paragraphsFromParts(paragraph1, paragraph2, remainder);
    }

    const emptyDb = !fullText && !paragraph1 && !paragraph2 && !remainder;
    const penaltyFromDb = normalizePenaltyFromRecord(rec.penalty);

    if (emptyDb) {
      return {
        paragraph1: "",
        paragraph2: "",
        remainder: "",
        fullText: "",
        paragraphs: [],
        fromDatabase: true,
        isStubPlaceholder: false,
        databaseEntryEmpty: true,
        penaltyFromDb,
      };
    }

    return {
      paragraph1,
      paragraph2,
      remainder,
      fullText,
      paragraphs,
      fromDatabase: true,
      isStubPlaceholder: false,
      databaseEntryEmpty: false,
      penaltyFromDb,
    };
  }

  const src = node?.detail ?? "";
  if (isArticleStubPlaceholderDetail(src)) {
    return {
      paragraph1: "",
      paragraph2: "",
      remainder: "",
      fullText: "",
      paragraphs: [],
      fromDatabase: false,
      isStubPlaceholder: true,
      databaseEntryEmpty: false,
      penaltyFromDb: null,
    };
  }
  const sp = splitStatuteParagraphs(src);
  return {
    paragraph1: sp.paragraph1,
    paragraph2: sp.paragraph2,
    remainder: sp.remainder,
    fullText: src,
    paragraphs: sp.paragraphs,
    fromDatabase: false,
    isStubPlaceholder: false,
    databaseEntryEmpty: false,
    penaltyFromDb: null,
  };
}
