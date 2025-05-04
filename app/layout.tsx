// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/globals.css'; // Ensure correct path

// Assign CSS variable for the font
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter', // Define the CSS variable name
    display: 'swap', // Improve font loading performance
});

// Metadata Export
export const metadata: Metadata = {
  title: 'Planet Beauty AI Assistant',
  description: 'Planet Beauty AI Chatbot - Discover personalized beauty products with our smart assistant.',
};

// Viewport Export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'var(--bg-light)' }, // Use CSS var
    { media: '(prefers-color-scheme: dark)', color: 'var(--bg-dark)' },   // Use CSS var
  ],
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Apply the font variable to the html tag
    // Add suppressHydrationWarning for theme switching without flicker
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
         {/* Font Awesome CDN (keep if icons used directly, otherwise remove if only using react-icons) */}
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
         {/* Favicon Link */}
         <link rel="icon" href="https://www.planetbeauty.com/cdn/shop/files/pb-monogram-logo-black.png?v=1694652991&width=32" type="image/png" />
      </head>
      {/* Body doesn't strictly need font-sans if html has it, but doesn't hurt */}
      <body className="font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}