import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0.1,
  triggerOnce: boolean = true
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, isVisible };
}
