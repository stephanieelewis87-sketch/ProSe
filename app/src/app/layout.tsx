import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProSe",
  description: "Handle your own civil case: deadlines, damages, letters and forms, with the law cited.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
