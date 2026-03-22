import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Navigator",
  description: "Indoor navigation for ALU Kigali campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
