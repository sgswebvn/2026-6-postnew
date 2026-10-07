import React, { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

export function AdsterraNative({ 
  className = "", 
  title = "Sponsored Stories & Recommended Insights" 
}) {
  const adContainer = useRef(null);

  useEffect(() => {
    const container = adContainer.current;
    if (!container) return;

    if (container.dataset.loaded === "true") return;
    container.dataset.loaded = "true";

    // Clear any leftover content first
    container.innerHTML = "";

    const nativeDiv = document.createElement("div");
    nativeDiv.id = "container-4ab1dc20201c1333a16ab21c0213771b";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://bicea.org/21/4ab1dc20201c1333a16ab21c0213771b";

    container.appendChild(nativeDiv);
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
        delete container.dataset.loaded;
      }
    };
  }, []);

  return (
    <div className={`w-full my-8 ${className}`}>
      <div className="bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 shadow-sm transition-all">
        {/* Magazine-style Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
            Sponsored
          </span>
        </div>

        {/* Adsterra Native Container */}
        <div ref={adContainer} className="w-full min-h-[120px] overflow-hidden" />
      </div>
    </div>
  );
}

export default AdsterraNative;
