"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  /** Tailwind background class, ör: "bg-sky-50" */
  bg?: string;
  /** Tailwind text color class, ör: "text-sky-600" */
  color?: string;
  className?: string;
};

export function IconBadge({ children, bg = "bg-neutral-100", color = "text-neutral-700", className }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-2 py-1 text-sm",
        bg,
        color,
        className
      )}
    >
      {children}
    </span>
  );
}
