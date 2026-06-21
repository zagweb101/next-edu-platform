'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  locale: string;
}

export function CopyButton({ text, locale }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button onClick={copy} variant={copied ? 'default' : 'outline'} className="shrink-0">
      {copied ? (
        <>
          <Check className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'تم النسخ' : 'Copied'}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
        </>
      )}
    </Button>
  );
}
