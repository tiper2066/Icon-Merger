"use client";

import { type ReactNode, useRef, useState } from "react";

type IconButtonTooltipProps = {
  label: string;
  children: ReactNode;
};

export function IconButtonTooltip({ label, children }: IconButtonTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  function showTooltip() {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 8,
    });
    setIsVisible(true);
  }

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0"
      onBlur={() => setIsVisible(false)}
      onFocus={showTooltip}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible ? (
        <span
          className="pointer-events-none fixed z-50 max-w-48 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#111620] px-3 py-2 text-xs font-medium leading-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
          role="tooltip"
          style={{
            left: position.left,
            top: position.top,
          }}
        >
          {label}
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#111620]" />
        </span>
      ) : null}
    </span>
  );
}
