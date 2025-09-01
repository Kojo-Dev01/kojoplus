import { Inter } from "next/font/google";
import "./globals.css";
import Head from 'next/head';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';


const inter = Inter({ subsets: ['latin'] });
export const metadata = {
  title: "KojoPlus",
  description: "Kojo Plus Dashboard",
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </Head>
      <body
        className={` antialiased`}
      >
        <ThemeProvider>
        <AuthProvider>
        {children}
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
