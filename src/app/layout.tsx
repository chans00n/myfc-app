import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./nike-colors.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "My Face Coach",
  description: "Your personal face workout companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
