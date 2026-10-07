import { useEffect } from "react";

export function AdsterraPopunder() {
  useEffect(() => {
    const SCRIPT_URL = "https://afders.org/1/c36382420e9278077e66667181a896f9";

    // Prevent duplicate injection
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-cfasync", "false");
    script.src = SCRIPT_URL;

    document.body.appendChild(script);

    return () => {
      // Keep script active for popunder event bindings
    };
  }, []);

  return null;
}

export default AdsterraPopunder;
