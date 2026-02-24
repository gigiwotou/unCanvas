import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UnCanvas - 无限画布',
  description: 'AI驱动的无限画布创作工具',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
