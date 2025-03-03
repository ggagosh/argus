import React from "react";
import MongoDBAnalyzer from "../components/MongoDBAnalyzer";
import { Geist } from "next/font/google";
import Head from "next/head";
import Image from "next/image";

const geist = Geist({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className={`min-h-screen bg-background ${geist.className}`}>
      <Head>
        <title>Argus</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <header className="border-b">
        <div className="container flex h-14 items-center px-4 max-w-6xl mx-auto">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="Argus"
                width={24}
                height={24}
                className="dark:invert"
              />
              <h1 className="font-bold">Argus</h1>
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-700/30">
                Beta
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <MongoDBAnalyzer />
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row max-w-6xl mx-auto px-4">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Tailwind CSS, and Shadcn UI
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Argus
          </p>
        </div>
      </footer>
    </div>
  );
}
