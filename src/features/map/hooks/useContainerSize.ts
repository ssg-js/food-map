"use client";

import { useEffect, useState, type RefObject } from "react";

import type { ContainerSize } from "@/shared/types/coordinate";

const INITIAL_SIZE: ContainerSize = { width: 0, height: 0 };

export function useContainerSize(
  containerRef: RefObject<HTMLElement | null>,
): ContainerSize {
  const [size, setSize] = useState<ContainerSize>(INITIAL_SIZE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}
