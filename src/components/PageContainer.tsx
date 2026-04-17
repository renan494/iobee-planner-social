import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

/**
 * Container padrão das páginas internas do app.
 * Aplica `mx-auto max-w-[1400px] px-4 py-8 sm:px-6` por padrão.
 *
 * - Use `maxWidth` para variantes mais estreitas (forms focados, etc.):
 *   "default" | "1000" | "4xl" | "3xl" | "2xl"
 * - `className` é mesclado por último — pode ser usado para ajustes pontuais
 *   (ex: trocar `py-8` por `py-6` em telas com muita altura útil).
 */
const MAX_WIDTHS = {
  default: "max-w-[1400px]",
  "1000": "max-w-[1000px]",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
  "2xl": "max-w-2xl",
} as const;

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: keyof typeof MAX_WIDTHS;
}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, maxWidth = "default", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto px-4 py-8 sm:px-6",
          MAX_WIDTHS[maxWidth],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

PageContainer.displayName = "PageContainer";
