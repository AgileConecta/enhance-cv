import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENHANCE_CV",
  description:
    "Workspace de curriculos para criar, importar, versionar e adaptar resumes por vaga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(232,243,225,0.8),_transparent_38%),linear-gradient(180deg,_#f7f3ea_0%,_#f2ede2_45%,_#ebe3d4_100%)] text-stone-900">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6">
          <header className="flex items-center justify-between border-b border-stone-900/10 py-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold tracking-[0.24em] text-stone-100">
                EC
              </span>
              <div>
                <p className="text-sm font-semibold tracking-[0.28em] text-stone-900">
                  ENHANCE_CV
                </p>
                <p className="text-xs text-stone-600">
                  Candidate-first resume workspace
                </p>
              </div>
            </Link>

            <nav className="flex items-center gap-2 text-sm text-stone-700">
              <Link
                href="/resumes"
                className="rounded-full px-4 py-2 transition hover:bg-stone-900/5 hover:text-stone-950"
              >
                Biblioteca
              </Link>
              <Link
                href="/resumes/new"
                className="rounded-full bg-stone-900 px-4 py-2 font-medium text-stone-50 transition hover:bg-stone-800"
              >
                Novo curriculo
              </Link>
            </nav>
          </header>

          <main className="flex-1 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
