# 🚀 دليل النشر السريع — Next.js Boilerplate على Railway

## المتطلبات
- حساب GitHub
- حساب Railway (https://railway.app) — يربط مع GitHub
- (اختياري) Moyasar account للدفع، Resend للإيميل

---

## الخطوة 1: ارفع المشروع لـ GitHub

### الطريقة الأولى: تنزيل المشروع ورفعه يدوياً
1. حمل المشروع كـ ZIP من السحابة
2. فك الضغط محلياً
3. اعمل repository جديد على GitHub باسم `next-boilerplate`
4. ارفع الملفات عبر GitHub Desktop أو `git push`

### الطريقة الثانية: استخدم git مباشرة
```bash
# بعد فك الضغط محلياً
cd next-boilerplate
git init
git remote add origin https://github.com/YOUR_USERNAME/next-boilerplate.git
git branch -M main
git push -u origin main
```

---

## الخطوة 2: أنشئ مشروع جديد على Railway

1. اذهب لـ https://railway.app/new
2. اختر **"Deploy from GitHub repo"**
3. اختر الـ repository الذي أنشأته (`next-boilerplate`)
4. Railway سيقرأ `railway.toml` تلقائياً ويبني خدمتين:
   - `web` — تطبيق Next.js
   - `worker` — BullMQ background worker

---

## الخطوة 3: أضف Postgres + Redis

1. في مشروع Railway، اضغط **"+ New"** → **"Database"** → **"PostgreSQL"**
2. كرر: **"+ New"** → **"Database"** → **"Redis"**
3. Railway سيضيف `DATABASE_URL` و `REDIS_URL` تلقائياً لخدماتك

---

## الخطوة 4: اضبط متغيرات البيئة

في خدمة `web` على Railway → تبويب **"Variables"**، أضف:

### متغيرات إجبارية
| المتغير | القيمة |
|---------|--------|
| `AUTH_SECRET` | `//7b9qKrlYVLuFnQpjBtc4McydQZBHLzz+cJ7LV2tHU=` (تم توليده لك) |
| `AUTH_URL` | `https://YOUR-APP.up.railway.app` (الرابط من Railway) |
| `NEXT_PUBLIC_APP_NAME` | `Boilerplate` (أو اسم مشروعك) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.up.railway.app` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `ar` |

### متغيرات اختيارية (حسب احتياجك)
| المتغير | من أين تحصل عليه |
|---------|------------------|
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | https://console.cloud.google.com/apis/credentials |
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | https://github.com/settings/developers |
| `MOYASAR_SECRET_KEY` + `MOYASAR_PUBLISHABLE_KEY` | https://dashboard.moyasar.com |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `FIREBASE_PROJECT_ID` (+ private key) | Firebase Console → Service Account |
| `SENTRY_DSN` | https://sentry.io |

كرّر نفس المتغيرات في خدمة `worker` (إلا NEXT_PUBLIC_*)

---

## الخطوة 5: انشر وانتظر

1. اضغط **"Deploy"** على Railway
2. انتظر 3-5 دقائق لبناء الصورة
3. راقب الـ logs — أول ما تشوف `✓ Ready` يكون تطبيقك جاهز
4. اضغط على رابط `web.up.railway.app` لفتح تطبيقك

---

## الخطوة 6: اضبط قاعدة البيانات

بعد أول deployment ناجح، شغّل الـ seed من Railway CLI:

```bash
# ثبّت Railway CLI
npm i -g @railway/cli

# سجّل دخول
railway login

# اربط المشروع
cd next-boilerplate
railway link

# شغّل migration + seed
railway run bun run db:push
railway run bun run db:seed
```

أو من تبويب **"Settings"** على خدمة `web` → **"Shell"** → نفّذ:
```bash
bun run db:push && bun run db:seed
```

---

## ✅ حسابات اختبار جاهزة (بعد الـ seed)

| النوع | الإيميل | كلمة المرور |
|------|---------|------------|
| Admin | admin@boilerplate.dev | admin12345 |
| Manager | manager@boilerplate.dev | manager12345 |
| User | user@boilerplate.dev | user12345 |

---

## 🎉 رابط تطبيقك

```
https://YOUR-APP-NAME.up.railway.app/ar
```

(يفتح تلقائياً بالعربي مع RTL)

---

## 🆘 مشاكل شائعة

### "Build failed: Cannot find module"
- تأكد إن `bun.lock` موجود في الـ repo (موجود ✅)

### "Database connection failed"
- تأكد إن PostgreSQL plugin مضاف وأن `DATABASE_URL` ظاهر في Variables

### "AUTH_SECRET is required"
- أضف `AUTH_SECRET` مع القيمة المُولّدة أعلاه

### "Login not working on production"
- تأكد إن `AUTH_URL` = `https://your-app.up.railway.app` (وليس localhost)
- في Google/GitHub OAuth، أضف callback URL: `https://your-app.up.railway.app/api/auth/callback/google`

### "Moyasar webhook not working"
- في Moyasar Dashboard، أضف webhook URL: `https://your-app.up.railway.app/api/payments/webhook`

---

## 📊 التكلفة المتوقعة على Railway

- Hobby Plan: $5/شهر
- Postgres + Redis: مشمول
- 500 ساعة استخدام شهرياً
- كافي لمشروع صغير-متوسط

للتطبيقات الإنتاجية الكبيرة، يُنصح بـ Pro Plan ($20/شهر) مع autoscaling.
