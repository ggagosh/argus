import { Github, Sparkles } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-14 items-center justify-between max-w-6xl mx-auto px-4">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          Built with AI using{" "}
          <Link
            href="https://cursor.sh"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Cursor Editor
          </Link>
          {" "}by someone who can't code but knows how to ask nicely{" "}
          <Sparkles className="h-4 w-4" />
        </p>
        <Link
          href="https://github.com/cpojer/mongoslowqueries"
          target="_blank"
          rel="noreferrer"
          className="flex items-center"
        >
          <Github className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </Link>
      </div>
    </footer>
  );
} 