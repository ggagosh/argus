import React from "react";
import MongoDBAnalyzer from "../components/MongoDBAnalyzer";
import { Geist } from "next/font/google";
import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/ui/footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "Argus - MongoDB Slow Query Analyzer",
  description:
    "AI-powered MongoDB slow query analyzer for performance optimization",
  icons: {
    icon: "/logo.svg",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4 max-w-6xl mx-auto">
          <div className="flex flex-1 items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt="Argus"
                  width={24}
                  height={24}
                  className="dark:invert"
                  priority
                />
                <h1 className="font-bold">Argus</h1>
                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-700/30">
                  Beta
                </span>
              </div>
            </Link>
            <a
              href="https://github.com/ggagosh/argus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md w-9 px-0"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="container flex-1 max-w-6xl mx-auto px-4 py-6">
        <MongoDBAnalyzer />
      </main>

      <Footer />
    </div>
  );
}
