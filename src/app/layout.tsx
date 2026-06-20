/**
 * Root layout (passthrough) — only renders children.
 * The actual <html>/<body> setup lives in [locale]/layout.tsx so that
 * locale is always available from the URL segment.
 */
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
