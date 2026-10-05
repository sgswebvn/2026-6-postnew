import { useEffect, useRef } from "react";

export default function AdsterraAd() {
  const adContainer = useRef(null);

  useEffect(() => {
    if (!adContainer.current) return;

    const optionsScript = document.createElement("script");
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
    adScript.src =
      "https://bicea.org/22/9bd4f7fd440b2649e2c1e7749df994e2";
    adScript.async = true;

    adContainer.current.appendChild(optionsScript);
    adContainer.current.appendChild(adScript);

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
        width: "468px",
        minHeight: "60px",
        margin: "20px auto",
        textAlign: "center",
      }}
    />
  );
}
