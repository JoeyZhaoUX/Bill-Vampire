import React, { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateServiceWorkerRef = useRef(null);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
    updateServiceWorkerRef.current = update;
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed left-4 right-4 bottom-4 z-[90] sm:left-auto sm:right-6 sm:w-[360px] rounded-2xl border border-[rgba(201,164,106,0.28)] bg-[#171217]/95 backdrop-blur-xl shadow-2xl p-4">
      <p className="text-sm font-bold text-[#F7EFE6] mb-1">Update available</p>
      <p className="text-xs text-[#A99A91] mb-3 leading-relaxed">Refresh to load the newest Bill Vampire UI without clearing browser data.</p>
      <button
        onClick={() => {
          updateServiceWorkerRef.current?.(true);
        }}
        className="w-full py-2.5 rounded-xl bg-[#8E1D2C] text-[#F7EFE6] text-xs font-bold cursor-pointer"
      >
        Refresh safely
      </button>
    </div>
  );
}
