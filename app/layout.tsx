import type { Metadata } from "next";
import { Geist, Geist_Mono, Jua, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// 제목에 쓰는 둥글둥글한 글꼴(한글 지원).
const juaHeading = Jua({ weight: "400", subsets: ["latin"], variable: "--font-heading", preload: false });

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나의 글쓰기 책",
  description: "육하원칙으로 글감을 정하고 그림을 보며 글을 쓰는 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", outfit.variable, juaHeading.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
