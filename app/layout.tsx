import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, M_PLUS_Rounded_1c, Noto_Sans_JP, Nunito } from "next/font/google";
import "./globals.css";

// 英数字：丸みのある Nunito / 和文：M PLUS Rounded 1c（丸ゴシック）
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  preload: false,
});

// 丸ゴシックで欠ける字形のフォールバック
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lexis Lab | 能動語彙化トレーニング",
  description: "受容語彙を産出語彙へ引き上げる4技能循環型トレーニング",
};

export const viewport: Viewport = {
  themeColor: "#58c322",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${nunito.variable} ${rounded.variable} ${notoSansJP.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink font-sans selection:bg-sky-light selection:text-sky-dark">
        {children}
      </body>
    </html>
  );
}
