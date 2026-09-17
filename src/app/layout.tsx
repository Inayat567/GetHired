import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GetHired — Autonomous AI Job Discovery & Outreach Copilot',
  description: 'Open-source AI copilot that monitors global ATS boards, LinkedIn posts, and remote channels to discover high-signal software engineering roles and draft tailored outreach pitches.',
  keywords: ['gethired', 'job search copilot', 'AI job hunter', 'remote work', 'react native jobs', 'software engineer jobs', 'autonomous agent'],
  authors: [{ name: 'Inayat Ali', url: 'https://innunext.com' }],
  metadataBase: new URL('https://gethired.innunext.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GetHired — Autonomous AI Job Discovery & Outreach Copilot',
    description: 'Open-source AI copilot that monitors global ATS boards, LinkedIn posts, and remote channels to discover high-signal software engineering roles.',
    url: 'https://gethired.innunext.com',
    siteName: 'GetHired Copilot',
    images: [{ url: '/logo.svg', width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetHired — Autonomous AI Job Discovery & Outreach Copilot',
    description: 'Autonomous AI copilot that discovers verified high-signal developer jobs and drafts tailored outreach.',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="h-full flex flex-col bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
