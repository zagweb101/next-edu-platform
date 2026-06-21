/**
 * Seed script — populate the Education Platform with sample data
 * Run with: bun run db:seed
 *
 * Creates:
 * - 3 users (admin, teacher, student)
 * - 3 sample courses (one free, two paid) with modules + lessons
 * - 2 quizzes with sample questions
 * - 1 enrollment (student enrolled in free course)
 * - Sample notifications + payments
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Education Platform database...');

  // ===================================================================
  // 1. Users
  // ===================================================================
  const adminPassword = await bcrypt.hash('admin12345', 12);
  const admin = await db.user.upsert({
    where: { email: 'admin@edu-platform.dev' },
    update: {},
    create: {
      email: 'admin@edu-platform.dev',
      name: 'مدير المنصة',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      locale: 'ar',
      bio: 'مدير عام منصة التعليم',
    },
  });
  console.log(`  ✓ Admin: ${admin.email} / admin12345`);

  const teacherPassword = await bcrypt.hash('teacher12345', 12);
  const teacher = await db.user.upsert({
    where: { email: 'teacher@edu-platform.dev' },
    update: {},
    create: {
      email: 'teacher@edu-platform.dev',
      name: 'أحمد المعلم',
      password: teacherPassword,
      role: Role.TEACHER,
      isActive: true,
      locale: 'ar',
      title: 'Senior Full-Stack Developer',
      expertise: 'Web Development, React, Next.js, Node.js',
      bio: 'مطور برمجيات بخبرة 10 سنوات، شغوف بتعليم البرمجة للمبتدئين.',
      socialLinks: { twitter: '@ahmed_dev', github: 'ahmed-dev' },
    },
  });
  console.log(`  ✓ Teacher: ${teacher.email} / teacher12345`);

  const studentPassword = await bcrypt.hash('student12345', 12);
  const student = await db.user.upsert({
    where: { email: 'student@edu-platform.dev' },
    update: {},
    create: {
      email: 'student@edu-platform.dev',
      name: 'طالب مبتدئ',
      password: studentPassword,
      role: Role.STUDENT,
      isActive: true,
      locale: 'ar',
      bio: 'طالب شغوف بتعلم البرمجة',
    },
  });
  console.log(`  ✓ Student: ${student.email} / student12345`);

  // ===================================================================
  // 2. Courses
  // ===================================================================
  console.log('\n📚 Creating courses...');

  const course1 = await db.course.upsert({
    where: { slug: 'react-basics-ar' },
    update: {},
    create: {
      title: 'أساسيات React من الصفر',
      slug: 'react-basics-ar',
      description:
        'تعلّم أساسيات مكتبة React من الصفر. في هذا الكورس هتتعلم JSX، Components، State، Props، Hooks، وأكثر. مناسب للمبتدئين تماماً.',
      whatYouLearn: 'فهم JSX وكيف تكتب كود React\nإنشاء مكونات قابلة لإعادة الاستخدام\nإدارة الحالة باستخدام useState و useReducer\nالتعامل مع الـ side effects باستخدام useEffect\nبناء تطبيق حقيقي من البداية',
      requirements: 'معرفة أساسية بـ HTML و CSS\nمعرفة بأساسيات JavaScript\nجهاز كمبيوتر بإمكانيات متوسطة',
      teacherId: teacher.id,
      price: 0, // Free
      comparePrice: 199,
      level: 'BEGINNER',
      language: 'ar',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      status: 'PUBLISHED',
      isFeatured: true,
      rating: 4.8,
      enrollmentsCount: 1247,
    },
  });
  console.log(`  ✓ Course 1: ${course1.title} (free)`);

  const course2 = await db.course.upsert({
    where: { slug: 'nextjs-production-ar' },
    update: {},
    create: {
      title: 'Next.js للمشاريع الإنتاجية',
      slug: 'nextjs-production-ar',
      description:
        'كورس متقدم في Next.js يغطي App Router، Server Components، API Routes، المصادقة، قواعد البيانات، والنشر. مع مشروع عملي كامل.',
      whatYouLearn: 'إتقان App Router في Next.js 16\nبناء APIs آمنة باستخدام Server Actions\nتكامل Prisma مع PostgreSQL\nنظام مصادقة كامل باستخدام NextAuth\nنشر التطبيق على Railway و Vercel',
      requirements: 'معرفة جيدة بـ React\nفهم أساسيات TypeScript\nخبرة بـ Git و GitHub',
      teacherId: teacher.id,
      price: 299,
      comparePrice: 499,
      level: 'ADVANCED',
      language: 'ar',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      status: 'PUBLISHED',
      isFeatured: true,
      rating: 4.9,
      enrollmentsCount: 532,
    },
  });
  console.log(`  ✓ Course 2: ${course2.title} (299 SAR)`);

  const course3 = await db.course.upsert({
    where: { slug: 'typescript-mastery-ar' },
    update: {},
    create: {
      title: 'إتقان TypeScript للمحترفين',
      slug: 'typescript-mastery-ar',
      description:
        'كورس شامل في TypeScript من الأساسيات للمستوى المتقدم. يغطي Types، Generics، Decorators، وكيفية استخدامه في مشاريع حقيقية.',
      whatYouLearn: 'فهم عميق لأنواع TypeScript\nكتابة Generics متقدمة\nتكامل TypeScript مع React\nأفضل الممارسات في الصناعة\nأدوات لتحسين تجربة المطوّر',
      requirements: 'معرفة بـ JavaScript\nمعرفة بأساسيات البرمجة كائنية التوجه',
      teacherId: teacher.id,
      price: 149,
      comparePrice: 249,
      level: 'INTERMEDIATE',
      language: 'ar',
      thumbnail: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800',
      status: 'PUBLISHED',
      isFeatured: false,
      rating: 4.7,
      enrollmentsCount: 318,
    },
  });
  console.log(`  ✓ Course 3: ${course3.title} (149 SAR)`);

  // ===================================================================
  // 3. Modules + Lessons for Course 1 (React Basics)
  // ===================================================================
  console.log('\n📖 Creating modules and lessons for Course 1...');

  const module1 = await db.module.create({
    data: {
      courseId: course1.id,
      title: 'مقدمة في React',
      description: 'تعرف على React وفهم لماذا هو شائع',
      order: 0,
    },
  });

  const lesson1 = await db.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'ما هو React؟',
      description: 'مقدمة شاملة لمكتبة React وفهم مكانتها في عالم تطوير الويب',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
      videoProvider: 'youtube',
      videoDuration: 540, // 9 minutes
      order: 0,
      isPreview: true,
    },
  });

  const lesson2 = await db.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'إعداد بيئة التطوير',
      description: 'تثبيت Node.js، VS Code، وإنشاء أول مشروع React',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=MRZfsUVjBU0',
      videoProvider: 'youtube',
      videoDuration: 720, // 12 minutes
      order: 1,
      isPreview: false,
    },
  });

  const lesson3 = await db.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'فهم JSX',
      description: 'مفهوم JSX وكيفية استخدامه في React',
      type: 'ARTICLE',
      content: `# فهم JSX

JSX هو امتداد لـ JavaScript يسمح لك بكتابة كود يشبه HTML داخل JavaScript.

## مثال أساسي

\`\`\`jsx
function Welcome() {
  return <h1>مرحباً بالعالم!</h1>;
}
\`\`\`

## لماذا JSX؟

- يجعل الكود أسهل قراءة وكتابة
- يوفر وقتاً مقارنة بـ React.createElement
- يحول الأخطاء البرمجية إلى أخطاء compile-time

## القواعد الأساسية

1. يجب إرجاع عنصر جذر واحد
2. استخدم className بدل class
3. الأقواس {} لكتابة JavaScript داخل JSX
`,
      order: 2,
      isPreview: false,
    },
  });

  // Module 2: Components & Props
  const module2 = await db.module.create({
    data: {
      courseId: course1.id,
      title: 'المكونات والـ Props',
      description: 'كيف تبني مكونات قابلة لإعادة الاستخدام',
      order: 1,
    },
  });

  const lesson4 = await db.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'إنشاء المكونات',
      description: 'الفرق بين Function و Class Components',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=MRZfsUVjBU0',
      videoProvider: 'youtube',
      videoDuration: 900,
      order: 0,
      isPreview: false,
    },
  });

  const lesson5 = await db.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'الـ Props وكيفية تمريرها',
      description: 'فهم Props وكيفية استخدامها لتمرير البيانات بين المكونات',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=MRZfsUVjBU0',
      videoProvider: 'youtube',
      videoDuration: 660,
      order: 1,
      isPreview: false,
    },
  });

  // Module 3: State & Hooks (with quiz)
  const module3 = await db.module.create({
    data: {
      courseId: course1.id,
      title: 'الـ State و الـ Hooks',
      description: 'إدارة الحالة باستخدام useState و useEffect',
      order: 2,
    },
  });

  const lesson6 = await db.lesson.create({
    data: {
      moduleId: module3.id,
      title: 'useState Hook',
      description: 'كيف تدير الحالة في المكونات الوظيفية',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=MRZfsUVjBU0',
      videoProvider: 'youtube',
      videoDuration: 1080,
      order: 0,
      isPreview: false,
    },
  });

  const lesson7 = await db.lesson.create({
    data: {
      moduleId: module3.id,
      title: 'useEffect Hook',
      description: 'التعامل مع الـ side effects',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=MRZfsUVjBU0',
      videoProvider: 'youtube',
      videoDuration: 1200,
      order: 1,
      isPreview: false,
    },
  });

  // Quiz lesson
  const lesson8 = await db.lesson.create({
    data: {
      moduleId: module3.id,
      title: 'اختبار: الـ State و الـ Hooks',
      description: 'اختبر فهمك للـ useState و useEffect',
      type: 'QUIZ',
      order: 2,
      isPreview: false,
    },
  });

  // Update course duration based on lessons (sum of videoDuration)
  const totalDuration = await db.lesson.aggregate({
    where: { module: { courseId: course1.id } },
    _sum: { videoDuration: true },
  });
  await db.course.update({
    where: { id: course1.id },
    data: { duration: totalDuration._sum.videoDuration || 0 },
  });
  console.log(`  ✓ Course 1: 3 modules, 8 lessons, ${(totalDuration._sum.videoDuration || 0) / 60} min total`);

  // ===================================================================
  // 4. Quiz + Questions
  // ===================================================================
  console.log('\n❓ Creating quiz and questions...');

  const quiz = await db.quiz.create({
    data: {
      lessonId: lesson8.id,
      title: 'اختبار الـ State و الـ Hooks',
      description: '5 أسئلة لاختبار فهمك',
      passScore: 70,
      maxAttempts: 3,
    },
  });

  await db.question.createMany({
    data: [
      {
        quizId: quiz.id,
        type: 'MULTIPLE_CHOICE',
        text: 'ما هو الـ Hook المستخدم لإدارة الحالة في React؟',
        options: JSON.stringify([
          { id: 'a', text: 'useEffect' },
          { id: 'b', text: 'useState' },
          { id: 'c', text: 'useContext' },
          { id: 'd', text: 'useReducer' },
        ]),
        correctAnswer: 'b',
        explanation: 'useState هو الـ Hook الأساسي لإدارة الحالة المحلية في المكونات الوظيفية.',
        points: 1,
        order: 0,
      },
      {
        quizId: quiz.id,
        type: 'MULTIPLE_CHOICE',
        text: 'متى يتم تنفيذ useEffect بدون مصفوفة dependencies؟',
        options: JSON.stringify([
          { id: 'a', text: 'مرة واحدة فقط عند تحميل المكون' },
          { id: 'b', text: 'بعد كل render' },
          { id: 'c', text: 'عند تغير الحالة فقط' },
          { id: 'd', text: 'أبداً' },
        ]),
        correctAnswer: 'b',
        explanation: 'بدون مصفوفة dependencies، يتم تنفيذ useEffect بعد كل render.',
        points: 1,
        order: 1,
      },
      {
        quizId: quiz.id,
        type: 'TRUE_FALSE',
        text: 'يمكن استخدام Hooks في Class Components.',
        options: JSON.stringify([
          { id: 'true', text: 'صحيح' },
          { id: 'false', text: 'خطأ' },
        ]),
        correctAnswer: 'false',
        explanation: 'Hooks تعمل فقط في Function Components، لا في Class Components.',
        points: 1,
        order: 2,
      },
      {
        quizId: quiz.id,
        type: 'MULTIPLE_CHOICE',
        text: 'ماذا يجب أن يفعله useEffect لتنفيذ cleanup؟',
        options: JSON.stringify([
          { id: 'a', text: 'إرجاع promise' },
          { id: 'b', text: 'إرجاع دالة' },
          { id: 'c', text: 'استخدام try/finally' },
          { id: 'd', text: 'لا يمكن عمل cleanup' },
        ]),
        correctAnswer: 'b',
        explanation: 'useEffect يمكن أن يرجع دالة cleanup التي تُنفذ قبل unmount أو قبل الـ effect التالي.',
        points: 1,
        order: 3,
      },
      {
        quizId: quiz.id,
        type: 'MULTIPLE_CHOICE',
        text: 'ما هو الـ Hook المناسب لإدارة الحالة المعقدة؟',
        options: JSON.stringify([
          { id: 'a', text: 'useState' },
          { id: 'b', text: 'useReducer' },
          { id: 'c', text: 'useEffect' },
          { id: 'd', text: 'useRef' },
        ]),
        correctAnswer: 'b',
        explanation: 'useReducer أفضل من useState للحالة المعقدة التي تتطلب منطق تحديث متعدد الخطوات.',
        points: 1,
        order: 4,
      },
    ],
  });
  console.log(`  ✓ Quiz created with 5 questions`);

  // ===================================================================
  // 5. Enrollment + Lesson Progress (student enrolled in free course)
  // ===================================================================
  console.log('\n🎓 Creating enrollment...');

  const existingEnrollment = await db.enrollment.findUnique({
    where: {
      courseId_studentId: { courseId: course1.id, studentId: student.id },
    },
  });

  if (!existingEnrollment) {
    const enrollment = await db.enrollment.create({
      data: {
        courseId: course1.id,
        studentId: student.id,
        status: 'ACTIVE',
        progress: 25,
        lastAccessedAt: new Date(),
      },
    });

    // Mark first 2 lessons as completed
    await db.lessonProgress.createMany({
      data: [
        {
          enrollmentId: enrollment.id,
          lessonId: lesson1.id,
          completed: true,
          watchedSeconds: 540,
        },
        {
          enrollmentId: enrollment.id,
          lessonId: lesson2.id,
          completed: true,
          watchedSeconds: 720,
        },
        {
          enrollmentId: enrollment.id,
          lessonId: lesson3.id,
          completed: false,
          watchedSeconds: 120,
        },
      ],
    });
    console.log(`  ✓ Student enrolled in Course 1 (25% progress)`);
  } else {
    console.log(`  ℹ Student already enrolled in Course 1`);
  }

  // ===================================================================
  // 6. Sample review
  // ===================================================================
  const existingReview = await db.review.findUnique({
    where: {
      courseId_studentId: { courseId: course1.id, studentId: student.id },
    },
  });

  if (!existingReview) {
    await db.review.create({
      data: {
        courseId: course1.id,
        studentId: student.id,
        rating: 5,
        comment: 'كورس ممتاز جداً! الشرح واضح والأمثلة عملية. أنصح به بشدة للمبتدئين.',
      },
    });
    console.log(`  ✓ Review added (5 stars)`);
  }

  // ===================================================================
  // 7. Sample notifications
  // ===================================================================
  const existingNotifs = await db.notification.count({
    where: { userId: student.id },
  });
  if (existingNotifs === 0) {
    await db.notification.createMany({
      data: [
        {
          userId: student.id,
          title: 'مرحباً بك في منصة تعلّم!',
          body: 'تم إنشاء حسابك بنجاح. ابدأ رحلتك التعليمية الآن!',
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
        {
          userId: student.id,
          title: 'تم التسجيل في الكورس',
          body: 'تم تسجيلك في "أساسيات React من الصفر". ابدأ التعلم الآن!',
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
        {
          userId: student.id,
          title: 'درس جديد متاح',
          body: 'تم إضافة درس "useEffect Hook" في كورس React',
          type: 'info',
          channel: 'IN_APP',
          status: 'READ',
          readAt: new Date(),
        },
      ],
    });
  }

  // Teacher notifications
  const teacherNotifs = await db.notification.count({
    where: { userId: teacher.id },
  });
  if (teacherNotifs === 0) {
    await db.notification.createMany({
      data: [
        {
          userId: teacher.id,
          title: 'طالب جديد في كورسك',
          body: 'سجل طالب جديد في "أساسيات React من الصفر"',
          type: 'info',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
        {
          userId: teacher.id,
          title: 'تقييم جديد 5 نجوم',
          body: 'حصل كورسك على تقييم 5 نجوم جديد',
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
      ],
    });
  }
  console.log(`  ✓ Notifications created`);

  // ===================================================================
  // 8. Sample payments
  // ===================================================================
  for (const [i, amount] of [299, 149, 49.99].entries()) {
    await db.payment.upsert({
      where: { moyasarId: `seed_payment_${i}` },
      update: {},
      create: {
        userId: student.id,
        moyasarId: `seed_payment_${i}`,
        amount,
        currency: 'SAR',
        status: 'PAID',
        description: `اشتراك كورس - ${i + 1}`,
        method: i % 2 === 0 ? 'CREDITCARD' : 'APPLEPAY',
      },
    });
  }
  console.log(`  ✓ Sample payments created`);

  // ===================================================================
  // 9. Multi-currency support (NEW)
  // ===================================================================
  console.log('\n💱 Setting up currencies...');
  const currencies = [
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', exchangeRate: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.27 },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.25 },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', exchangeRate: 0.98 },
    { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', exchangeRate: 13.0 },
    { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك', exchangeRate: 0.082 },
  ];
  for (const cur of currencies) {
    await db.currency.upsert({
      where: { code: cur.code },
      update: {},
      create: cur,
    });
  }
  console.log(`  ✓ ${currencies.length} currencies added`);

  // ===================================================================
  // 10. Forum categories + sample topic (NEW)
  // ===================================================================
  console.log('\n💬 Setting up forum...');
  const forumCategory = await db.forumCategory.upsert({
    where: { slug: 'general' },
    update: {},
    create: {
      name: 'أسئلة عامة',
      slug: 'general',
      description: 'اسأل أي سؤال عن البرمجة',
      color: '#3B82F6',
      order: 0,
    },
  });

  const forumTopic = await db.forumTopic.create({
    data: {
      categoryId: forumCategory.id,
      authorId: student.id,
      title: 'كيف أبدأ تعلم React؟',
      slug: `how-to-start-react-${Date.now().toString(36)}`,
      content: 'أنا مبتدئ تماماً وأريد تعلم React. من أين أبدأ؟ وما الكورسات التي تنصحون بها؟',
    },
  });

  await db.forumPost.create({
    data: {
      topicId: forumTopic.id,
      authorId: teacher.id,
      content: 'أهلاً بك! أنصحك بالبدء بكورس "أساسيات React من الصفر" المتوفر في المنصة. سيعطيك أساس قوي.',
    },
  });

  await db.forumTopic.update({
    where: { id: forumTopic.id },
    data: { postsCount: 1 },
  });
  console.log(`  ✓ Forum category + sample topic created`);

  // ===================================================================
  // 11. Coupon codes (NEW)
  // ===================================================================
  console.log('\n🎟️ Creating coupon codes...');
  await db.coupon.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      description: 'خصم 50% للعملاء الجدد',
      type: 'PERCENTAGE',
      value: 50,
      maxUses: 1000,
      maxUsesPerUser: 1,
      minAmount: 50,
      isActive: true,
    },
  });

  await db.coupon.upsert({
    where: { code: 'SAVE25' },
    update: {},
    create: {
      code: 'SAVE25',
      description: 'خصم 25% على كل الكورسات',
      type: 'PERCENTAGE',
      value: 25,
      maxUses: 0, // unlimited
      maxUsesPerUser: 5,
      isActive: true,
    },
  });

  await db.coupon.upsert({
    where: { code: 'FLAT50' },
    update: {},
    create: {
      code: 'FLAT50',
      description: 'خصم ثابت 50 ر.س',
      type: 'FIXED',
      value: 50,
      maxUses: 500,
      maxUsesPerUser: 1,
      minAmount: 100,
      courseId: course2.id,
      isActive: true,
    },
  });
  console.log(`  ✓ 3 coupon codes created (WELCOME50, SAVE25, FLAT50)`);

  // ===================================================================
  // 12. Affiliate account for teacher (NEW)
  // ===================================================================
  console.log('\n💰 Creating affiliate account...');
  const affiliate = await db.affiliate.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      referralCode: 'ahmed-teacher',
      commissionRate: 15, // 15% commission
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Affiliate account created for teacher (code: ahmed-teacher)`);

  // Sample conversion
  await db.affiliateConversion.create({
    data: {
      affiliateId: affiliate.id,
      referredUserId: student.id,
      courseId: course1.id,
      type: 'ENROLLMENT',
      amount: 0,
      commission: 0,
      status: 'PAID',
    },
  });
  await db.affiliate.update({
    where: { id: affiliate.id },
    data: {
      totalClicks: 42,
      totalSignups: 8,
      totalConversions: 3,
    },
  });
  console.log(`  ✓ Sample affiliate conversion recorded`);

  // ===================================================================
  // 13. Live session (NEW)
  // ===================================================================
  console.log('\n📺 Creating sample live session...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  await db.liveSession.create({
    data: {
      title: 'سؤال وجواب مباشر: React Hooks',
      description: 'جلسة مباشرة للإجابة على أسئلة الطلاب حول React Hooks',
      teacherId: teacher.id,
      courseId: course1.id,
      provider: 'WEBRTC',
      status: 'SCHEDULED',
      scheduledStart: tomorrow,
      scheduledEnd: new Date(tomorrow.getTime() + 90 * 60 * 1000),
      webrtcRoomId: `room-${Date.now()}`,
    },
  });
  console.log(`  ✓ Sample live session created (scheduled for tomorrow)`);

  // ===================================================================
  // 14. Sample conversation (NEW)
  // ===================================================================
  console.log('\n💬 Creating sample conversation...');
  const existingConv = await db.conversation.count();
  if (existingConv === 0) {
    const conversation = await db.conversation.create({
      data: {
        participants: {
          create: [
            { userId: student.id },
            { userId: teacher.id },
          ],
        },
        lastMessageAt: new Date(),
      },
    });

    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: student.id,
        content: 'السلام عليكم، عندي سؤال عن الكورس',
      },
    });

    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: teacher.id,
        content: 'وعليكم السلام، تفضل اسأل! أنا هنا لمساعدتك.',
      },
    });
    console.log(`  ✓ Sample conversation + 2 messages created`);
  }

  console.log('\n✅ Seed completed!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin:    admin@edu-platform.dev / admin12345');
  console.log('  Teacher:  teacher@edu-platform.dev / teacher12345');
  console.log('  Student:  student@edu-platform.dev / student12345');
  console.log('\n📚 Sample courses:');
  console.log(`  1. ${course1.title} (free)`);
  console.log(`  2. ${course2.title} (299 SAR)`);
  console.log(`  3. ${course3.title} (149 SAR)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
