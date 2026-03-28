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

/**
 * รวมข้อมูลจาก statuteArticles.json (ถ้ามี) กับโหนดในแอป
 * @param {object|null} node - section node
 * @param {Record<string, object>} statuteByNum - จาก import JSON
 */
export function resolveStatuteParagraphs(node, statuteByNum) {
  const numKey = node?.num != null ? String(node.num).trim() : "";
  const rec = numKey && statuteByNum && typeof statuteByNum === "object" ? statuteByNum[numKey] : null;

  if (rec && typeof rec === "object" && Object.keys(rec).length > 0) {
    let fullText = cleanStatutePdfNoise(rec.fullText ?? rec.detail ?? "");
    let paragraph1 = "";
    let paragraph2 = "";
    let remainder = "";
    if (fullText) {
      const sp = splitStatuteParagraphs(fullText);
      paragraph1 = sp.paragraph1;
      paragraph2 = sp.paragraph2;
      remainder = sp.remainder;
    } else {
      paragraph1 = cleanStatutePdfNoise(rec.paragraph1 ?? "");
      paragraph2 = cleanStatutePdfNoise(rec.paragraph2 ?? "");
      remainder = cleanStatutePdfNoise(rec.remainder ?? "");
      fullText = [paragraph1, paragraph2, remainder].filter(Boolean).join("\n\n");
    }
    const emptyDb = !fullText && !paragraph1 && !paragraph2 && !remainder;
    if (emptyDb) {
      const src = node?.detail ?? "";
      if (isArticleStubPlaceholderDetail(src)) {
        return {
          paragraph1: "",
          paragraph2: "",
          remainder: "",
          fullText: "",
          fromDatabase: false,
          isStubPlaceholder: true,
        };
      }
      const sp = splitStatuteParagraphs(src);
      return {
        paragraph1: sp.paragraph1,
        paragraph2: sp.paragraph2,
        remainder: sp.remainder,
        fullText: src,
        fromDatabase: false,
        isStubPlaceholder: false,
      };
    }
    return {
      paragraph1,
      paragraph2,
      remainder,
      fullText,
      fromDatabase: true,
      isStubPlaceholder: false,
    };
  }

  const src = node?.detail ?? "";
  if (isArticleStubPlaceholderDetail(src)) {
    return {
      paragraph1: "",
      paragraph2: "",
      remainder: "",
      fullText: "",
      fromDatabase: false,
      isStubPlaceholder: true,
    };
  }
  const sp = splitStatuteParagraphs(src);
  return {
    paragraph1: sp.paragraph1,
    paragraph2: sp.paragraph2,
    remainder: sp.remainder,
    fullText: src,
    fromDatabase: false,
    isStubPlaceholder: false,
  };
}
