'use client';

import { useEffect } from 'react';

export function VercelToolbarRemover() {
  useEffect(() => {
    const removeVercelElements = () => {
      const selectors = [
        '#vercel-toolbar',
        '[id*="vercel-toolbar"]',
        '[class*="vercel-toolbar"]',
        '[class*="VercelToolbar"]',
        'iframe[src*="vercel.com"]',
        'iframe[src*="_vercel"]'
      ];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          el.remove();
        });
      });
    };

    removeVercelElements();

    const observer = new MutationObserver(() => {
      removeVercelElements();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
