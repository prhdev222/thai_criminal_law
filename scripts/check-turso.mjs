#!/usr/bin/env node
/**
 * ตรวจว่า endpoint /api/user-data ตอบได้หรือไม่ (รวม v2/n2/nn2/m2 ในคำขอเดียว)
 *
 * ท้องถิ่น: รัน `npm run build` แล้ว `npm run pages:dev` ค้างไว้ จากนั้น:
 *   node scripts/check-turso.mjs
 *
 * Production / Preview บน Cloudflare:
 *   set CHECK_TURSO_URL=https://your-project.pages.dev && node scripts/check-turso.mjs
 */

const base = (process.env.CHECK_TURSO_URL || "http://127.0.0.1:8788").replace(/\/$/, "");
const url = `${base}/api/user-data`;

async function main() {
  console.log(`GET ${url}\n`);
  let res;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (e) {
    console.error("❌ เชื่อมต่อไม่ได้:", e.message || e);
    console.error("\nถ้าทดสอบบนเครื่อง: เปิดอีกเทอร์มินัลรัน  npm run pages:dev  (หลัง npm run build)");
    console.error("แล้วรันสคริปต์นี้อีกครั้ง — หรือตั้ง CHECK_TURSO_URL=URL เว็บจริงบน Cloudflare\n");
    process.exit(1);
  }

  const text = await res.text();
  let hint = "";
  if (res.status === 200) {
    hint = " — OK (JSON มี v2/n2/nn2/m2 — มักเป็น null ถ้ายังไม่เคยบันทึก)";
  } else if (res.status === 503) {
    hint = " — Functions รันอยู่แต่ยังไม่มี TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (runtime)";
  } else if (res.status === 404) {
    hint = " — ไม่พบ route (ตรวจว่า deploy รวมโฟลเดอร์ functions/)";
  } else if (res.status === 500 && /query failed|app_kv/i.test(text)) {
    hint = " — มักเพราะยังไม่มีตาราง app_kv: รัน turso db shell <ชื่อ-db> < turso/schema.sql";
  } else {
    hint = "";
  }

  console.log(`สถานะ HTTP: ${res.status}${hint}`);
  console.log("Body (ตัดยาว):", text.length > 200 ? `${text.slice(0, 200)}…` : text || "(ว่าง)");

  if (res.status === 200) {
    console.log("\n✅ API ตอบได้ — ถ้าแอป build ด้วย VITE_USE_TURSO=1 จะดึง/บันทึกผ่าน Turso ได้");
    process.exit(0);
  }
  if (res.status === 503) {
    console.log("\n⚠️  ใส่ TURSO_* ใน Cloudflare Pages → Settings → Variables (Runtime) หรือใน .dev.vars ตอน pages:dev");
    process.exit(2);
  }
  console.log("\n❌ ยังไม่ผ่าน — ตรวจ build/deploy และ env");
  process.exit(1);
}

main();
