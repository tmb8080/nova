import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({
  className,
  type = 'text',
  error,
  label,
  required,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none text-gray-700 dark:text-binance-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-lg border border-gray-300 dark:border-binance-dark-border bg-white dark:bg-binance-dark-secondary px-4 py-3 text-sm text-gray-900 dark:text-binance-text-primary placeholder:text-gray-500 dark:placeholder-binance-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-binance-yellow focus-visible:border-binance-yellow transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-binance-red focus-visible:ring-binance-red',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-binance-red">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
