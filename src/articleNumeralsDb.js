/**
 * ฐานข้อมูลเลขมาตรา 1–397: แมปเลขอารบิก ↔ เลขไทยตามแบบที่ใช้ในเอกสารกฎหมาย (ราชกิจจานุเบกษา / PDF ฉบับกฤษฎีกา)
 */
export const CRIMINAL_CODE_MAX_ARTICLE = 397;

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

/** "304" → "๓๐๔" */
export function arabicNumStrToThaiDigits(arabicStr) {
  return String(arabicStr).replace(/\d/g, (ch) => THAI_DIGITS[Number(ch)] ?? ch);
}

/** "304" → "ม.๓๐๔" (แบบหัวมาตราในเอกสาร) */
export function matraThaiFromArabic(arabicStr) {
  const n = String(parseInt(String(arabicStr), 10));
  if (n === "NaN" || Number.isNaN(Number(n))) return "";
  return `ม.${arabicNumStrToThaiDigits(n)}`;
}

/** ป้ายโหนด stub / ผลค้นหา */
export function articleStubLabelFromArabic(arabicStr) {
  const n = String(parseInt(String(arabicStr), 10));
  const mTh = matraThaiFromArabic(n);
  return `${mTh} · ม.${n} (ฉบับกฎหมาย)`;
}

export function articleStubDetailFromArabic(arabicStr) {
  const n = String(parseInt(String(arabicStr), 10));
  const mTh = matraThaiFromArabic(n);
  return `มาตรา ${n} — ในเอกสารราชกิจจานุเบกษาแสดงเลขไทยเป็น ${mTh}\nเปิด PDF ฉบับเต็มเพื่ออ่านข้อความมาตรา (แอปชี้หน้าเมื่อมีแมปหน้า)`;
}

/** ดัชนี { "304": { arabic, thaiDigits, matraThai } } สำหรับ 1..397 */
export const ARTICLE_NUMERALS_BY_ARABIC = (() => {
  const o = {};
  for (let i = 1; i <= CRIMINAL_CODE_MAX_ARTICLE; i++) {
    const arabic = String(i);
    const thaiDigits = arabicNumStrToThaiDigits(arabic);
    o[arabic] = {
      arabic,
      thaiDigits,
      matraThai: `ม.${thaiDigits}`,
    };
  }
  return o;
})();

export function getArticleNumeralsRecord(arabicStr) {
  const key = String(parseInt(String(arabicStr), 10));
  if (key === "NaN" || Number.isNaN(Number(key))) return null;
  return ARTICLE_NUMERALS_BY_ARABIC[key] ?? null;
}
