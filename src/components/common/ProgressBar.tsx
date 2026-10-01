"use client";

import NextTopLoader from 'nextjs-toploader';

export default function ProgressBar() {
  return (
    <NextTopLoader
      color="var(--primary-color, #F85606)"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px var(--primary-color, #F85606),0 0 5px var(--primary-color, #F85606)"
      zIndex={16000000}
    />
  );
}
