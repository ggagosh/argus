import React from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-10">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
            <p className="font-semibold mb-2">Argus</p>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              AI-powered MongoDB slow query analyzer for better database performance
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-6 mb-4">
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              
              <Link 
                href="/upload" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Upload
              </Link>
              
              <Link 
                href="/dashboard" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              
              <a 
                href="https://github.com/ggagosh/argus"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                <Github className="h-4 w-4 mr-1" />
                GitHub
              </a>
            </div>
            
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Argus. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 