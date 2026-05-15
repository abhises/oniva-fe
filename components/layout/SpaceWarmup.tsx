'use client';

import { useEffect } from 'react';

/**
 * SpaceWarmup component
 * This component triggers the /api/keepalive endpoint on the client side.
 * It's designed to be placed in the root Providers or Layout so it runs once per session.
 * This "wakes up" the Hugging Face spaces (Geocoding, OSRM, MapTiles) as soon as the user opens the app.
 */
export function SpaceWarmup() {
  useEffect(() => {
    // Only run in production or if you want to test it in dev
    const warmUp = async () => {
      try {
        console.log('Initiating background warm-up for map services...');
        // We don't await this, let it run in the background
        fetch('/api/keepalive').catch(() => {
          // Ignore errors, it's just a warm-up
        });
      } catch (e) {
        // Ignore
      }
    };

    warmUp();
    
    // Optional: Repeat every 5 minutes while the tab is open to keep it fresh
    const interval = setInterval(warmUp, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
