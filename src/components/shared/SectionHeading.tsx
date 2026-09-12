import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Shared page/section heading used across the whole platform:
 * small uppercase eyebrow and bold logo-inspired display typography.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "center",
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col",
        align === "center"
          ? "mx-auto max-w-3xl items-center text-center"
          : "items-start text-start",
        className,
      )}
    >
      {eyebrow && <p className="eyebrow text-muted-foreground">{eyebrow}</p>}
      <h2 className="display-xl mt-4 text-4xl sm:text-5xl lg:text-6xl">
        {title}
        {accent && (
          <>
            {" "}
            <span className="display-accent">{accent}</span>
          </>
        )}
      </h2>
      {description && <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{description}</p>}
      {children}
    </Reveal>
  );
}
