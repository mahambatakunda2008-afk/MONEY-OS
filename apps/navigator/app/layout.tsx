import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money OS",
  description: "A financial navigator for planning and comparing money movement.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
