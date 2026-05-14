import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAH Tool - Dashboard",
  description: "Dashboard Next.js cho SAH Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
