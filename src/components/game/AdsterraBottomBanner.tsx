import { useEffect, useRef } from "react";

export function AdsterraBottomBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof document === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://globalimmaturelunatic.com/94/73/22/947322d91198dd15603d923801f636ed.js";
    script.async = true;
    container.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clear any ad content injected by the network script on unmount.
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label="Advertisement"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[90px] w-full items-center justify-center border-t bg-background/95 backdrop-blur supports-[height:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]"
    />
  );
}
