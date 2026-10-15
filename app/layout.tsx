import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HADI Dev Studio",
  description: "Private multi-agent software development control plane",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
