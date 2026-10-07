import React, { useEffect, useRef } from "react";

export function AdsterraAd({ className = "", label = "Sponsored Partner" }) {
  const adContainer = useRef(null);

  useEffect(() => {
    const container = adContainer.current;
    if (!container) return;

    if (container.dataset.loaded === "true") return;
    container.dataset.loaded = "true";

    // Clear any existing children before injecting
    container.innerHTML = "";

    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.text = `
      atOptions = {
        'key' : '9bd4f7fd440b2649e2c1e7749df994e2',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    const adScript = document.createElement("script");
    adScript.type = "text/javascript";
    adScript.src = "https://bicea.org/22/9bd4f7fd440b2649e2c1e7749df994e2";
    adScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(adScript);

    return () => {
      if (container) {
        container.innerHTML = "";
        delete container.dataset.loaded;
      }
    };
  }, []);

  return (
    <div className={`w-full max-w-2xl mx-auto my-6 px-3 ${className}`}>
      {/* Subtle Ad Disclosure Header */}
      <div className="w-full max-w-[468px] mx-auto flex items-center justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-1 pb-1 mb-1 border-b border-neutral-100 dark:border-neutral-800/80">
        <span className="flex items-center gap-1.5 font-semibold text-neutral-500 dark:text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          {label}
        </span>
        <span className="opacity-60 text-[9px]">Advertisement</span>
      </div>

      {/* Styled Responsive Container (Prevents mobile overflow and layout shift) */}
      <div className="w-full max-w-[468px] mx-auto bg-neutral-50/70 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-2 sm:p-2.5 flex items-center justify-center overflow-x-auto no-scrollbar shadow-xs">
        <div
          ref={adContainer}
          style={{
            width: "468px",
            minHeight: "60px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </div>
    </div>
  );
}

export default AdsterraAd;
