import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  disabled = false,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? 'span' : 'button';

  const baseClasses = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-binance-yellow focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-binance-yellow text-binance-dark hover:bg-binance-yellow-dark font-semibold shadow-lg hover:shadow-xl',
    destructive: 'bg-binance-red text-white hover:bg-red-600 font-semibold shadow-lg hover:shadow-xl',
    outline: 'border border-binance-dark-border bg-binance-dark-secondary text-binance-text-primary hover:bg-binance-dark-tertiary font-medium',
    secondary: 'bg-binance-dark-secondary text-binance-text-primary hover:bg-binance-dark-tertiary font-medium',
    ghost: 'text-binance-text-primary hover:bg-binance-dark-tertiary hover:text-binance-text-primary',
    link: 'text-binance-yellow underline-offset-4 hover:underline',
    success: 'bg-binance-green text-white hover:bg-green-600 font-semibold shadow-lg hover:shadow-xl',
    warning: 'bg-binance-yellow text-binance-dark hover:bg-binance-yellow-dark font-semibold shadow-lg hover:shadow-xl',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };

  return (
    <Comp
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Comp>
  );
});

Button.displayName = 'Button';

export { Button };
