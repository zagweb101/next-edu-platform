/**
 * Notification Email Template — generic transactional email
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

interface NotificationEmailProps {
  title: string;
  body: string;
  link?: string;
  userName?: string;
  locale?: string;
}

export const NotificationEmail = ({
  title,
  body,
  link,
  userName,
  locale = 'ar',
}: NotificationEmailProps) => {
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          {userName && (
            <Text style={paragraph}>
              {isAr ? `مرحباً ${userName}،` : `Hello ${userName},`}
            </Text>
          )}
          <Text style={paragraph}>{body}</Text>
          {link && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button style={button} href={link}>
                {isAr ? 'عرض التفاصيل' : 'View Details'}
              </Button>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            {isAr
              ? 'هذه الرسالة أُرسلت تلقائياً. لا ترد عليها.'
              : 'This is an automated message. Please do not reply.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;

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
  fontSize: '24px',
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
