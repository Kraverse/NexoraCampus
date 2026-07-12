import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoraCampus — Your Student Community Super-App",
  description:
    "Discover internships, events, resources, second-hand deals & help — all in one AI-powered student community.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="nx-ambient" aria-hidden />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
