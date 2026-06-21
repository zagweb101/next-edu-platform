/**
 * Certificates page — for students to view/download their certificates
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Share2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/certificates`);
  }

  const certificates = await db.certificate.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        select: { id: true, title: true, slug: true, thumbnail: true },
      },
      enrollment: {
        select: { completedAt: true },
      },
    },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'شهاداتي' : 'My Certificates'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? `${certificates.length} شهادة مكتملة`
            : `${certificates.length} certificates earned`}
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2">
              {locale === 'ar' ? 'لا توجد شهادات بعد' : 'No certificates yet'}
            </h3>
            <p className="text-muted-foreground">
              {locale === 'ar'
                ? 'أكمل كورس للحصول على شهادة'
                : 'Complete a course to earn a certificate'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">{cert.course.title}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">
                      {cert.certificateNumber}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {locale === 'ar' ? 'تاريخ الإصدار' : 'Issued'}
                    </p>
                    <p className="font-medium">{formatDate(cert.issuedAt, locale, { dateStyle: 'medium' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {locale === 'ar' ? 'الطالب' : 'Student'}
                    </p>
                    <p className="font-medium">{session.user.name}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'تحميل' : 'Download'}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
