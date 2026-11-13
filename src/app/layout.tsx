import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { DataProvider } from "@/components/DataProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "체험단 노트",
  description: "블로그 체험단 일정·리뷰 마감·절약 금액 관리",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f6fa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <DataProvider>
          <div className="app">
            <main className="content">{children}</main>
            <BottomNav />
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
