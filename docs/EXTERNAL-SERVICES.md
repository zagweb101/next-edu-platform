# 🔧 دليل إعداد الخدمات الخارجية

> هذا الدليل يشرح كيفية إعداد كل الخدمات الخارجية المطلوبة لتشغيل المنصة التعليمية بكامل ميزاتها.
> كل قسم مستقل — يمكنك إعداد أي خدمة بناءً على احتياجك.

---

## 📋 جدول المحتويات

1. [Google OAuth — تسجيل الدخول عبر Google](#1-google-oauth)
2. [GitHub OAuth — تسجيل الدخول عبر GitHub](#2-github-oauth)
3. [Moyasar — الدفع الحقيقي](#3-moyasar)
4. [Resend — إرسال الإيميلات](#4-resend)
5. [Firebase FCM — Push Notifications](#5-firebase-fcm)

---

## 1. Google OAuth

### الخطوة 1: إنشاء مشروع على Google Cloud

1. اذهب لـ: https://console.cloud.google.com/
2. سجّل الدخول بحساب Google
3. اضغط على شعار المشروع في الأعلى → **"New Project"**
4. أدخل اسم المشروع: `edu-platform` (أو أي اسم)
5. اضغط **"Create"**

### الخطوة 2: تفعيل APIs

1. من القائمة الجانبية: **APIs & Services** → **Library**
2. ابحث عن **"Google+ API"** وفعّلها
3. ابحث عن **"Google Identity Services API"** وفعّلها

### الخطوة 3: إعداد شاشة الموافقة (OAuth Consent Screen)

1. اذهب لـ: **APIs & Services** → **OAuth consent screen**
2. اختر **"External"** (لو مش مشروع موثّق)
3. اضغط **"Create"**
4. املأ البيانات:
   - **App name**: `منصة تعلّم`
   - **User support email**: بريدك
   - **Developer contact information**: بريدك
5. اضغط **"Save and Continue"**
6. في صفحة **Scopes**:
   - أضف `userinfo.email`
   - أضف `userinfo.profile`
   - أضف `openid`
7. اضغط **"Save and Continue"**
8. في صفحة **Test users**:
   - أضف بريدك كـ test user
9. اضغط **"Save and Continue"**

### الخطوة 4: إنشاء Credentials

1. اذهب لـ: **APIs & Services** → **Credentials**
2. اضغط **"+ Create Credentials"** → **"OAuth client ID"**
3. اختر **Application type**: `Web application`
4. أدخل **Name**: `Edu Platform Web`
5. في **Authorized JavaScript origins**، أضف:
   ```
   http://localhost:3000
   https://your-app.up.railway.app
   ```
6. في **Authorized redirect URIs**، أضف:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.up.railway.app/api/auth/callback/google
   ```
7. اضغط **"Create"**
8. **انسخ** `Client ID` و `Client Secret`

### الخطوة 5: أضف المتغيرات للـ env

في ملف `.env` (محلياً) أو Railway Variables:

```bash
AUTH_GOOGLE_ID=xxxxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### ✅ اختبار

- شغّل `bun run dev`
- اذهب لـ `http://localhost:3000/ar/auth/login`
- اضغط زر **"الدخول عبر Google"**
- يجب أن يفتح نافذة Google لتسجيل الدخول

---

## 2. GitHub OAuth

### الخطوة 1: إنشاء GitHub OAuth App

1. اذهب لـ: https://github.com/settings/developers
2. اضغط **"New OAuth App"**
3. املأ البيانات:
   - **Application name**: `Edu Platform`
   - **Homepage URL**: `http://localhost:3000`
   - **Application description** (اختياري): `منصة تعليمية`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. اضغط **"Register application"**

### الخطوة 2: توليد Client Secret

1. بعد إنشاء الـ app، اضغط **"Generate a new client secret"**
2. **انسخ** الـ Client Secret (لن تراه مرة أخرى!)

### الخطوة 3: أضف للـ env

```bash
AUTH_GITHUB_ID=Iv1.xxxxxxxxxxxxxxxxx
AUTH_GITHUB_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### الخطوة 4: للإنتاج (Railway)

1. عدّل الـ OAuth App على GitHub:
   - **Homepage URL**: `https://your-app.up.railway.app`
   - **Authorization callback URL**: `https://your-app.up.railway.app/api/auth/callback/github`

### ✅ اختبار

- اذهب لـ `/ar/auth/login`
- اضغط زر **"الدخول عبر GitHub"**

---

## 3. Moyasar — الدفع الحقيقي

### الخطوة 1: إنشاء حساب Moyasar

1. اذهب لـ: https://dashboard.moyasar.com/signup
2. سجّل بحسابك (شركة أو فردي)
3. فعّل حسابك بالإيميل

### الخطوة 2: احصل على API Keys

1. في Dashboard، اذهب لـ: **Settings** → **API Keys**
2. ستجد:
   - **Secret Key** (يبدأ بـ `sk_test_` للـ test أو `sk_live_` للإنتاج)
   - **Publishable Key** (يبدأ بـ `pk_test_` أو `pk_live_`)

### الخطوة 3: أضف للـ env

```bash
MOYASAR_SECRET_KEY=<YOUR_MOYASAR_SECRET_KEY>
MOYASAR_PUBLISHABLE_KEY=<YOUR_MOYASAR_PUBLISHABLE_KEY>
```

### الخطوة 4: إعداد Webhook

1. في Moyasar Dashboard، اذهب لـ: **Settings** → **Webhooks**
2. اضغط **"Add Endpoint"**
3. أدخل URL: `https://your-app.up.railway.app/api/payments/webhook`
4. اختر الأحداث:
   - `payment.paid`
   - `payment.failed`
   - `payment.refunded`
5. اضغط **"Save"**
6. **انسخ** الـ Webhook Secret

### الخطوة 5: أضف Webhook Secret للـ env

```bash
MOYASAR_WEBHOOK_SECRET=<YOUR_MOYASAR_WEBHOOK_SECRET>
```

### الخطوة 6: تفعيل طرق الدفع

في Moyasar Dashboard → **Settings** → **Payment Methods**:
- ✅ **mada** (مدى — إجباري للسوق السعودي)
- ✅ **Visa / Mastercard**
- ✅ **Apple Pay**
- ✅ **STC Pay**

### ✅ اختبار

استخدم بطاقات الاختبار (test mode):

| النوع | رقم البطاقة | النتيجة |
|------|------------|--------|
| ناجح | `4111 1111 1111 1111` | عملية ناجحة |
| فاشل | `4000 0000 0000 0002` | فشل العملية |
| 3D Secure | `4000 0027 6000 3184` | يتطلب 3DS |

---

## 4. Resend — إرسال الإيميلات

### الخطوة 1: إنشاء حساب Resend

1. اذهب لـ: https://resend.com
2. اضغط **"Get Started"** وسجّل بحساب GitHub أو الإيميل
3. فعّل حسابك بالإيميل

### الخطوة 2: احصل على API Key

1. في Dashboard، اذهب لـ: **API Keys**
2. اضغط **"Create API Key"**
3. أدخل اسم: `edu-platform`
4. اختر الصلاحية: **"Sending access"**
5. اضغط **"Add"**
6. **انسخ** الـ API key (يبدأ بـ `re_`)

### الخطوة 3: إضافة دومين مخصص (موصى به)

1. في Dashboard، اذهب لـ: **Domains**
2. اضغط **"Add Domain"**
3. أدخل الدومين: `mail.yourdomain.com`
4. أضف سجلات DNS المطلوبة:
   - **MX record**
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
5. انتظر 24-48 ساعة للتفعيل

> **بدون دومين مخصص**، تقدر تستخدم `onboarding@resend.dev` فقط للإرسال لبريدك الشخصي.

### الخطوة 4: أضف للـ env

```bash
RESEND_API_KEY=<YOUR_RESEND_API_KEY>
EMAIL_FROM="منصة تعلّم <noreply@yourdomain.com>"
```

### الخطوة 5: قوالب الإيميل

القوالب موجودة في `src/lib/email-templates/`:
- `welcome.tsx` — ترحيب بمستخدم جديد
- `notification.tsx` — إشعار عام

يمكنك تعديلها أو إضافة قوالب جديدة.

### ✅ اختبار

```bash
# في Railway shell أو محلياً
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer <YOUR_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": ["you@example.com"],
    "subject": "Test from Edu Platform",
    "html": "<p>هذا اختبار</p>"
  }'
```

---

## 5. Firebase FCM — Push Notifications

### الخطوة 1: إنشاء مشروع Firebase

1. اذهب لـ: https://console.firebase.google.com/
2. اضغط **"Add project"**
3. أدخل اسم المشروع: `edu-platform`
4. اضغط **Continue** (يمكنك تعطيل Google Analytics)
5. اضغط **"Create project"**

### الخطوة 2: فعّل Cloud Messaging

1. من القائمة الجانبية: **Messaging** (تحت Engage)
2. اضغط **"Get Started"** (لو لأول مرة)

### الخطوة 3: أنشئ Service Account

1. اذهب لـ: ⚙️ **Project Settings** (أيقونة الترس بجانب Project Overview)
2. تبويب **Service Accounts**
3. اضغط **"Generate new private key"**
4. اضغط **"Generate key"** — هينزل ملف JSON
5. افتح الملف — ستجد بداخله:
   - `project_id`
   - `client_email`
   - `private_key`
   - `database_url`

### الخطوة 4: أضف للـ env

```bash
FIREBASE_PROJECT_ID=edu-platform-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@edu-platform-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://edu-platform-xxxxx.firebaseio.com
```

> ⚠️ **مهم**: الـ `private_key` يحتوي على `\n` فعلية. احتفظ بها كما هي بين علامات اقتباس.

### الخطوة 5: إعداد Web Push (للمتصفح)

1. في Firebase Console: **Project Settings** → **Cloud Messaging**
2. تبويب **Web configuration**
3. اضغط **"Generate key pair"** تحت Web Push certificates
4. **انسخ** الـ VAPID key
5. أضفه للـ env:
   ```bash
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=BGxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### الخطوة 6: تفعيل الإشعارات على الـ Client

الكود موجود في `src/lib/push.ts`. يحتاج:
1. طلب إذن المستخدم
2. تسجيل الـ FCM token في قاعدة البيانات (`FcmToken` model)
3. استخدام الـ VAPID key

### ✅ اختبار

```bash
# في Railway shell
# سجّل دخول كـ admin، ثم:
curl -X POST 'https://fcm.googleapis.com/fcm/send' \
  -H 'Authorization: key=SERVER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Hello from Edu Platform"
    }
  }'
```

> الـ `SERVER_KEY` تجده في Firebase Console → Project Settings → Cloud Messaging → Server key

---

## 📋 قائمة Check نهائية

### قبل الإطلاق، تأكد إنك ضفت كل هذا:

```bash
# Auth
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=https://your-app.up.railway.app
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Payments
MOYASAR_SECRET_KEY=sk_live_...
MOYASAR_PUBLISHABLE_KEY=pk_live_...
MOYASAR_WEBHOOK_SECRET=wh_secret_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM="App <noreply@domain.com>"

# Push Notifications
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# Database + Cache (auto-injected by Railway)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# App config
NEXT_PUBLIC_APP_NAME="منصة تعلّم"
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NODE_ENV=production
```

---

## 🆘 مشاكل شائعة

### Google OAuth: "redirect_uri_mismatch"
- تأكد إن الـ redirect URI في Google Console = `https://yourapp.com/api/auth/callback/google` تماماً
- لا تنسَ الـ `https://` ولا `/api/auth/callback/google`

### GitHub OAuth: "The redirect_uri is not associated"
- عدّل Authorization callback URL في GitHub settings

### Moyasar: "Invalid API key"
- تأكد إنك تستخدم `sk_test_` في dev و `sk_live_` في production
- الـ publishable key يبدأ بـ `pk_` (يستخدم في الـ frontend)

### Resend: "Domain not verified"
- لو مش مع دومين مخصص، استخدم `onboarding@resend.dev` كـ from
- للإنتاج الحقيقي، لازم تضيف وتوثق دومين

### Firebase: "Permission denied"
- تأكد إن `FIREBASE_PRIVATE_KEY` بين علامات اقتباس
- الـ `\n` يجب أن تبقى كما هي (لا تستبدلها بـ newlines فعلية)

---

## 💡 نصائح

1. **استخدم test mode أولاً**: كل الخدمات لها test mode — استخدمه قبل الإطلاق
2. **احتفظ بـ backups من الـ keys**: في password manager آمن
3. **راقب الـ usage**: كل خدمة لها limits على الـ free tier
4. **فعّل 2FA**: على حسابات Google و GitHub و Railway
5. **استخدم webhook secrets**: للتحقق من صحة الـ webhooks القادمة من Moyasar
