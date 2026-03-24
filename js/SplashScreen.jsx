import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onLoaded }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onLoaded) onLoaded();
    }, 3000); // Show for 3 seconds
    return () => clearTimeout(timer);
  }, [onLoaded]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <video
        autoPlay
        muted
        playsInline
        className="h-32 w-32 md:h-48 md:w-48 rounded-full shadow-2xl"
      >
        <source src="/assets/videos/matchpoint-logo.mp4" type="video/mp4" />
      </video>
      <p className="absolute bottom-10 text-slate-400 text-sm animate-pulse">
        Initializing emotional telemetry…
      </p>
    </div>
  );
}
