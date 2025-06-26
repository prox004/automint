import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Providers from "@/providers/Web3Providers";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoMint - Web3 Invoicing Made Simple",
  description: "Create professional Web3 invoices in seconds. Get paid faster with crypto payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Web3Providers>
            <Layout>
              {children}
            </Layout>
          </Web3Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
