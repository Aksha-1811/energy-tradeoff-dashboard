import { useEffect, useState } from "react";

export function useChartGuide(
  behaviorChartRef: React.RefObject<HTMLDivElement>,
) {
  const [showChartGuide, setShowChartGuide] = useState(false);

  useEffect(() => {
    if (!behaviorChartRef.current) return;

    let repeatInterval: ReturnType<typeof setInterval> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const showGuide = () => {
      setShowChartGuide(true);

      hideTimer = setTimeout(() => {
        setShowChartGuide(false);
      }, 3000);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          showGuide();

          repeatInterval = setInterval(showGuide, 120000);
        } else {
          setShowChartGuide(false);

          if (repeatInterval) clearInterval(repeatInterval);
          if (hideTimer) clearTimeout(hideTimer);
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(behaviorChartRef.current);

    return () => {
      observer.disconnect();

      if (repeatInterval) clearInterval(repeatInterval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [behaviorChartRef]);

  return showChartGuide;
}
