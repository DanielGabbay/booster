import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,box-shadow,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-[0_1px_0_color-mix(in_oklab,black_12%,transparent),0_8px_16px_color-mix(in_oklab,var(--color-accent)_28%,transparent)] hover:brightness-[1.04]",
        sage: "bg-sage text-sage-fg shadow-[0_8px_16px_color-mix(in_oklab,var(--color-sage)_24%,transparent)] hover:brightness-[1.05]",
        secondary:
          "bg-surface text-ink shadow-[0_0_0_1px_var(--color-border),0_4px_10px_color-mix(in_oklab,var(--color-ink)_6%,transparent)] hover:bg-cream",
        ghost: "bg-transparent text-ink hover:bg-cream",
      },
      size: {
        md: "h-11 px-5 rounded-[12px] text-base",
        lg: "h-14 px-6 rounded-[16px] text-lg",
        xl: "h-16 px-7 rounded-[20px] text-xl",
        icon: "size-11 rounded-[12px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "h-12 w-full rounded-[12px] bg-surface px-4 text-base text-ink",
        "shadow-[0_0_0_1px_var(--color-border)] outline-none",
        "placeholder:text-subtle",
        "focus-visible:shadow-[0_0_0_2px_var(--color-accent)]",
        className,
      )}
      {...rest}
    />
  );
}

export function Screen({
  title,
  onBack,
  children,
  footer,
}: {
  title?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex min-h-12 shrink-0 items-center gap-2">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="חזרה">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        ) : (
          <span className="size-11" />
        )}
        <h1 className="flex-1 text-center font-display text-xl font-bold text-ink">{title ?? "מטבעות זהב"}</h1>
        <span className="size-11" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">{children}</div>
      {footer ? <div className="shrink-0 bg-paper pt-3">{footer}</div> : null}
    </div>
  );
}
