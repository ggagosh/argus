'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import ShikiHighlighter from 'react-shiki';

const themes = {
  light: 'github-light',
  dark: 'github-dark'
};

export function ThemeAwareShikiHighlighter({ children, language, ...props }) {
  const { theme: currentTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  // Handle mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme to get the actual theme value
  const theme = mounted ? (resolvedTheme === 'dark' ? themes.dark : themes.light) : themes.light;
  
  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="h-[100px] rounded-md bg-muted animate-pulse" />;
  }

  return (
    <div className="relative rounded-md overflow-hidden">
      <ShikiHighlighter
        key={theme}
        language={language}
        theme={theme}
        {...props}
      >
        {children}
      </ShikiHighlighter>
    </div>
  );
}

// Preload the themes to avoid flash of unstyled content
export async function preloadShikiThemes() {
  const { getHighlighter } = await import('shiki');
  await getHighlighter({
    themes: [themes.light, themes.dark],
    langs: ['javascript', 'typescript', 'json', 'mongodb'],
  });
} 