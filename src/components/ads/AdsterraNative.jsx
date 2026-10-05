import { useEffect, useRef } from "react";

export default function AdsterraNative() {
  const adContainer = useRef(null);

  useEffect(() => {
    if (!adContainer.current) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://bicea.org/21/4ab1dc20201c1333a16ab21c0213771b";

    adContainer.current.appendChild(script);

    return () => {
      if (adContainer.current) {
        adContainer.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={adContainer}
      style={{
        width: "100%",
        minHeight: "100px",
        margin: "20px auto",
      }}
    >
      <div id="container-4ab1dc20201c1333a16ab21c0213771b" />
    </div>
  );
}
