import type { Metadata } from "next";

import "@/app/globals.css";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Generator Operations Management",
  description: "Generator asset, inspection, maintenance, and analytics operations system"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
