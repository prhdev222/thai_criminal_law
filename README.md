# ⚖️ เรียนกฎหมายอาญา — Criminal Law Learning Platform

แพลตฟอร์มเรียนกฎหมายอาญาไทย พร้อม Mind Map, YouTube Database, Lecture Notes

## 📸 ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 🗺️ **Mind Map** | แผนผังโครงสร้าง ป.อาญา แบบ tree — กดดูรายละเอียด + เพิ่ม note ส่วนตัว |
| 📺 **YouTube DB** | เก็บวิดีโอสอนกฎหมาย + tag + ค้นหา + กรองสถานะ |
| 📝 **Lecture Notes** | สรุป lecture ด้วย Markdown ผูกกับมาตรา + แหล่งอ้างอิง |
| 🔍 **ค้นหาทั้งระบบ** | ค้นหาข้ามทุกส่วน (มาตรา + วิดีโอ + lecture notes) |

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Icons**: Lucide React
- **Storage**: localStorage (offline-first) — สามารถเชื่อม Turso API ได้ในอนาคต
- **Deploy**: Cloudflare Pages (ฟรี)
- **Font**: Sarabun + Noto Sans Thai (Google Fonts)

---

## 🚀 วิธี Deploy — 3 วิธี

---

### วิธีที่ 1: Cloudflare Pages (แนะนำ ⭐)

ฟรี, เร็ว, ใช้ domain prhmedicine.cloud ได้

#### ขั้นตอน:

**1. เตรียมโปรเจค**

```bash
# Clone / คัดลอกไฟล์ทั้งหมดไปยังโฟลเดอร์ใหม่
mkdir criminal-law-frontend
cd criminal-law-frontend

# คัดลอกไฟล์ทั้งหมดจากที่ดาวน์โหลด
# (package.json, vite.config.js, tailwind.config.js, postcss.config.js,
#  index.html, src/*, public/*)
```

**2. ติดตั้ง Dependencies**

```bash
npm install
```

**3. ทดสอบ Local**

```bash
npm run dev
# → เปิด http://localhost:5173
```

**4. Deploy ผ่าน Wrangler CLI (วิธีเร็วที่สุด)**

```bash
# Login Cloudflare (ถ้ายังไม่ได้ login)
npx wrangler login

# Build + Deploy ในคำสั่งเดียว
npm run deploy

# หรือทำทีละขั้น:
npm run build
npx wrangler pages deploy dist --project-name=criminal-law
```

ครั้งแรก Wrangler จะถามให้สร้าง project — กด Y

**ผลลัพธ์:**
```
✨ Deployment complete!
🌎 https://criminal-law.pages.dev
```

**5. ตั้งค่า Custom Domain (ถ้าต้องการ)**

```bash
# เพิ่ม custom domain ผ่าน Wrangler
npx wrangler pages project list
# → ดู project name

# หรือตั้งค่าผ่าน Cloudflare Dashboard:
# 1. ไปที่ https://dash.cloudflare.com
# 2. เลือก Workers & Pages → criminal-law
# 3. Custom domains → Add custom domain
# 4. ใส่: law.prhmedicine.cloud (หรือชื่อที่ต้องการ)
# 5. Cloudflare จะตั้งค่า DNS ให้อัตโนมัติ
```

**6. อัปเดตเว็บ (ครั้งถัดไป)**

```bash
# แก้ไขโค้ด แล้วรัน:
npm run deploy
# → Deploy ใหม่ใน ~30 วินาที
```

---

### วิธีที่ 2: Cloudflare Pages ผ่าน GitHub (Auto Deploy)

ผูก GitHub repo → push แล้ว deploy อัตโนมัติ

**1. สร้าง GitHub Repository**

```bash
cd criminal-law-frontend

git init
git add .
git commit -m "Initial: Criminal Law Learning Platform"

# สร้าง repo บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/criminal-law.git
git branch -M main
git push -u origin main
```

**2. เชื่อม Cloudflare Pages**

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. กด **Create** → **Pages** → **Connect to Git**
3. เลือก GitHub account → เลือก repo `criminal-law`
4. ตั้งค่า Build:

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node.js version** | `18` (หรือใหม่กว่า) |

5. กด **Save and Deploy**

**ผลลัพธ์:** ทุกครั้งที่ `git push` → Cloudflare จะ build + deploy ให้อัตโนมัติ

---

### วิธีที่ 3: Vercel (ทางเลือก)

**1. ติดตั้ง Vercel CLI**

```bash
npm i -g vercel
```

**2. Deploy**

```bash
cd criminal-law-frontend
vercel

# ตอบคำถาม:
# Set up and deploy? → Y
# Which scope? → เลือก account
# Link to existing project? → N
# Project name? → criminal-law
# Directory? → ./
# Override settings? → N
```

**3. Production Deploy**

```bash
vercel --prod
```

---

## 📂 โครงสร้างไฟล์

```
criminal-law-frontend/
├── public/
│   └── favicon.svg              # ⚖️ favicon
├── src/
│   ├── App.jsx                  # แอปหลัก (ทุกอย่างอยู่ในไฟล์เดียว)
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind CSS imports
├── index.html                   # HTML entry point
├── package.json                 # Dependencies + scripts
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── .gitignore                   # Git ignore rules
└── README.md                    # คู่มือนี้
```

---

## ⚙️ คำสั่งที่ใช้บ่อย

| คำสั่ง | ผลลัพธ์ |
|--------|---------|
| `npm install` | ติดตั้ง dependencies |
| `npm run dev` | รัน dev server ที่ localhost:5173 |
| `npm run build` | Build สำหรับ production → โฟลเดอร์ `dist/` |
| `npm run preview` | Preview production build ที่ localhost:4173 |
| `npm run deploy` | Build + Deploy ไป Cloudflare Pages |

---

## 🔌 เชื่อม API (ขั้นสูง — ถ้าต้องการ)

ตอนนี้แอปใช้ **localStorage** เก็บข้อมูล (ทำงาน offline ได้) ถ้าต้องการเชื่อมกับ **Turso API** ที่สร้างไว้ก่อนหน้า:

**1. ตั้งค่า Environment Variable**

สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจค:

```env
VITE_API_URL=https://criminal-law-api.YOUR_SUBDOMAIN.workers.dev
```

**2. แก้ไข store helper ใน App.jsx**

เปลี่ยนจาก localStorage เป็น API calls:

```javascript
// เปลี่ยนจาก:
const store = {
  async get(k) { ... localStorage ... },
  async set(k, v) { ... localStorage ... },
};

// เป็น:
const API = import.meta.env.VITE_API_URL;

const store = {
  async get(k) {
    const res = await fetch(`${API}/api/${k}`);
    return res.ok ? await res.json() : null;
  },
  async set(k, v) {
    await fetch(`${API}/api/${k}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
  },
};
```

**3. เพิ่ม Environment Variable บน Cloudflare Pages**

ไปที่ Dashboard → Workers & Pages → criminal-law → Settings → Environment variables

เพิ่ม:
- **Variable name**: `VITE_API_URL`
- **Value**: `https://criminal-law-api.xxxxx.workers.dev`

---

## 🔒 เพิ่ม Authentication (ถ้าต้องการ)

### วิธีที่ 1: PIN-based (ง่ายที่สุด)

เพิ่มหน้า login ง่ายๆ ด้วย PIN 4 หลัก:

```javascript
// เพิ่มที่ต้นไฟล์ App.jsx
const [authed, setAuthed] = useState(false);
const [pin, setPin] = useState('');

if (!authed) return (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center">
      <h2 className="text-xl font-bold text-zinc-100 mb-4">⚖️ ใส่ PIN</h2>
      <input type="password" maxLength={4} value={pin}
        onChange={e => { setPin(e.target.value);
          if (e.target.value === '1234') setAuthed(true); // เปลี่ยน PIN ตรงนี้
        }}
        className="text-center text-2xl tracking-widest w-40 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-200"
      />
    </div>
  </div>
);
```

### วิธีที่ 2: Cloudflare Access (แนะนำสำหรับ production)

1. ไปที่ [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. **Access** → **Applications** → **Add an application**
3. เลือก **Self-hosted**
4. ตั้งค่า:
   - Application name: `Criminal Law Platform`
   - Application domain: `law.prhmedicine.cloud` (หรือ domain ที่ใช้)
5. เลือก Policy: **Email OTP** หรือ **Google Login**
6. Save → ตอนนี้ต้อง login ก่อนเข้าเว็บ

---

## 🌐 ตั้งค่า Custom Domain บน Cloudflare

ถ้าใช้ domain `prhmedicine.cloud` ที่มีอยู่แล้ว:

**1. เพิ่ม CNAME Record**

ไปที่ Cloudflare Dashboard → DNS → Add record:

| Type | Name | Target |
|------|------|--------|
| CNAME | `law` | `criminal-law.pages.dev` |

**2. เพิ่ม Custom Domain ใน Pages**

ไปที่ Workers & Pages → criminal-law → Custom domains → Add:
- ใส่: `law.prhmedicine.cloud`
- Cloudflare จะ verify + ออก SSL ให้อัตโนมัติ

**ผลลัพธ์:** เข้าเว็บได้ที่ `https://law.prhmedicine.cloud`

---

## 🔄 Workflow การใช้งานประจำวัน

```
1. เรียน lecture / ดู YouTube
         ↓
2. เปิดแอป → ไปที่ Mind Map
         ↓
3. เลือกมาตราที่เกี่ยวข้อง → เพิ่ม note ส่วนตัว
         ↓
4. ไปที่ YouTube tab → เพิ่มวิดีโอ + ใส่ tag
         ↓
5. ไปที่ Lecture Notes → สรุป lecture ผูกกับมาตรา
         ↓
6. ทบทวน → ค้นหาทั้งระบบ
```

---

## ❓ FAQ

**Q: ข้อมูลเก็บที่ไหน?**
A: เก็บใน localStorage ของ browser ข้อมูลจะอยู่ตราบใดที่ไม่ clear browser data ถ้าต้องการ sync ข้ามอุปกรณ์ ให้เชื่อม Turso API

**Q: ใช้บนมือถือได้ไหม?**
A: ได้ — responsive design รองรับทุกขนาดหน้าจอ

**Q: เพิ่มมาตราใหม่ได้อย่างไร?**
A: แก้ไข array `SECTIONS` ในไฟล์ `src/App.jsx` เพิ่ม object ใหม่ตามโครงสร้างเดิม

**Q: Export ข้อมูลได้ไหม?**
A: เปิด DevTools → Console → พิมพ์ `JSON.stringify(localStorage)` → คัดลอก

**Q: ลืม PIN ทำอย่างไร?**
A: PIN อยู่ในโค้ด (hardcoded) แก้ไขใน App.jsx แล้ว deploy ใหม่

---

## 📋 Checklist ก่อน Deploy

- [ ] `npm install` สำเร็จ ไม่มี error
- [ ] `npm run dev` ทดสอบ local ได้
- [ ] `npm run build` build สำเร็จ ไม่มี error
- [ ] `npx wrangler login` เข้า Cloudflare แล้ว
- [ ] `npm run deploy` deploy สำเร็จ
- [ ] เปิด URL ที่ได้ ทดสอบว่าทำงานปกติ
- [ ] (Optional) ตั้ง custom domain
- [ ] (Optional) ตั้ง Cloudflare Access

---

## 📄 License

สร้างเพื่อการศึกษาเท่านั้น เนื้อหากฎหมายอ้างอิงจากประมวลกฎหมายอาญา พ.ศ. ๒๔๙๙ (แก้ไขถึง พ.ศ. ๒๕๖๔) — สำนักงานคณะกรรมการกฤษฎีกา
