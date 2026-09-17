import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Geist has no Kannada glyphs; this keeps ಕನ್ನಡ text consistent across devices.
const kannada = Noto_Sans_Kannada({ variable: "--font-kannada", subsets: ["kannada"] });

const title = "Shabd Coach — learn job English by talking";
const description =
  "A voice coach that teaches English words for interviews and work, explained in English, Hinglish or Kannada. 5 words, 5 minutes.";

export const metadata: Metadata = {
  metadataBase: new URL("https://shabd-coach.vercel.app"),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Shabd Coach" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${kannada.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-muted/40">{children}</body>
    </html>
  );
}
