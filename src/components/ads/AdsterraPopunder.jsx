import { useEffect } from "react";

export function AdsterraPopunder() {
  useEffect(() => {
    const script = document.createElement("script");

    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://afders.org/1/c36382420e9278077e66667181a896f9";

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
