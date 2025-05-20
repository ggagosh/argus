'use client';

import React from 'react';
import { Header } from '@/components/ui/header';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">About Argus</h1>
          <p className="text-muted-foreground mb-4">
            Argus analyzes MongoDB slow query logs and offers insights to help
            optimize your database performance.
          </p>
          <p className="text-muted-foreground">
            Built with Next.js and powered by AI, this project is currently in
            beta. Feedback and contributions are welcome.
          </p>
        </section>
      </main>
    </div>
  );
}
