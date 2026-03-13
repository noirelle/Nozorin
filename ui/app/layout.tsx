import type { Metadata } from "next";
import { StatsProvider } from "@/contexts/StatsContext";
import { BrowserGuard } from "@/components/BrowserGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nozorin — Talk to Strangers | Call Strangers (No Login Required)",
  description: "Experience the fastest way to talk to strangers. Instantly call or chat with people worldwide with no registration or login required. Your privacy is our priority—enjoy simple, anonymous, and hassle-free connections today.",
  keywords: [
    "talk to strangers no login",
    "call strangers no login",
    "talking to strangers no sign up",
    "anonymous voice chat",
    "instant chat no login",
    "chat with strangers no registration",
    "free random chat",
    "Nozorin"
  ],
  openGraph: {
    title: "Nozorin — Talk to Strangers Instantly (No Login)",
    description: "Start talking or calling strangers in seconds. No sign-up, no login, just instant and private connections.",
    type: "website",
    url: "https://nozorin.com",
    siteName: "Nozorin",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nozorin — Talk to Strangers | No Login Required",
    description: "Instantly chat or call strangers worldwide. No registration, no login, complete privacy.",
  },
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <BrowserGuard />
        <StatsProvider>
          {children}
        </StatsProvider>
      </body>
    </html>
  );
}
