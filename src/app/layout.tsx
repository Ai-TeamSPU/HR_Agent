import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/pagefront/providers/LocaleProvider";
import { ThemeProvider } from "@/pagefront/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";


export const metadata: Metadata = {
  title: "HR AI Agent — Recruitment System",
  description: "ระบบสรรหาบุคลากรอัจฉริยะ ขับเคลื่อนด้วย AI Agent — HR AI Agent Recruitment System powered by AI",
  keywords: ["HR", "AI", "Recruitment", "Hiring", "สรรหาบุคลากร", "ระบบ HR"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="theme-pink-light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


