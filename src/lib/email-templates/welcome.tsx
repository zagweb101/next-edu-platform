/**
 * Welcome Email Template — sent on user registration
 */
import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  locale?: string;
  appUrl?: string;
}

export const WelcomeEmail = ({
  userName,
  locale = 'ar',
  appUrl,
}: WelcomeEmailProps) => {
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const url = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{isAr ? 'أهلاً بك في البلاتفورم!' : 'Welcome to the platform!'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {isAr ? `أهلاً بك${userName ? ` ${userName}` : ''}! 👋` : `Welcome${userName ? ` ${userName}` : ''}! 👋`}
          </Heading>
          <Text style={paragraph}>
            {isAr
              ? 'تم إنشاء حسابك بنجاح. ابدأ رحلتك معنا الآن واستكشف جميع الميزات المتاحة.'
              : 'Your account has been created successfully. Start your journey with us and explore all available features.'}
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>
              {isAr ? 'ادخل للوحة التحكم' : 'Go to Dashboard'}
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            {isAr
              ? 'إذا لم تكن أنت من أنشأ هذا الحساب، يرجى تجاهل هذا الإيميل.'
              : 'If you did not create this account, please ignore this email.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '24px 0',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '32px',
  maxWidth: '560px',
  margin: '0 auto',
};

const heading = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0 0 16px 0',
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};
