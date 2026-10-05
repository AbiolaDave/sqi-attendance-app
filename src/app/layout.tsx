import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQI College of ICT — Academic Portal",
  description: "Academic management platform for SQI College of ICT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
