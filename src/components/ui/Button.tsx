import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-brand hover:bg-brand/90 text-white shadow-md shadow-brand/20 dark:shadow-brand/10",
    secondary: "bg-brand-orange hover:bg-brand-orange/90 text-white shadow-md",
    outline: "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-navy dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
    ghost: "bg-transparent text-navy dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
}
