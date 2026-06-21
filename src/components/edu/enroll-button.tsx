'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, ShoppingCart } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface EnrollButtonProps {
  courseSlug: string;
  price: number;
  locale: string;
  isLoggedIn: boolean;
}

export function EnrollButton({ courseSlug, price, locale, isLoggedIn }: EnrollButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/enroll`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'ALREADY_ENROLLED') {
          toast({
            title: locale === 'ar' ? 'أنت مسجل بالفعل' : 'Already enrolled',
            description: locale === 'ar' ? 'يمكنك متابعة الكورس' : 'You can continue the course',
          });
          router.push(`/courses/${courseSlug}/learn`);
          return;
        }
        throw new Error(data.error || 'Failed to enroll');
      }

      // If payment URL exists, redirect to Moyasar checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free or dev mode enrollment
      toast({
        title: locale === 'ar' ? 'تم التسجيل بنجاح!' : 'Enrolled successfully!',
        description:
          locale === 'ar'
            ? 'يمكنك الآن البدء في تعلم الكورس'
            : 'You can now start learning the course',
      });
      router.push(`/courses/${courseSlug}/learn`);
      router.refresh();
    } catch (e: any) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleEnroll}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin me-2" />
      ) : !isLoggedIn ? (
        <LogIn className="h-4 w-4 me-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 me-2" />
      )}
      {!isLoggedIn
        ? locale === 'ar' ? 'سجل الدخول للتسجيل' : 'Login to enroll'
        : price === 0
        ? locale === 'ar' ? 'التسجيل مجاناً' : 'Enroll for Free'
        : locale === 'ar' ? 'اشترك الآن' : 'Enroll Now'}
    </Button>
  );
}
