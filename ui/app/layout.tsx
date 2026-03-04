import type { Metadata } from "next";
import { StatsProvider } from "@/contexts/StatsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nozorin - Meet Strangers Instantly",
  description: "Connect globally through voice or text chat. No registration required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StatsProvider>
          {children}
        </StatsProvider>
      </body>
    </html>
  );
}
