import { forwardRef } from "react";

const variants = {
  primary:
    "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20",
  secondary: "bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700",
  danger: "bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30",
  ghost: "hover:bg-gray-800 text-gray-400 hover:text-gray-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

const tooltipStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const tooltipArrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
};

/**
 * Reusable Button component
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon: Icon,
      className = "",
      tooltip,
      tooltipLocation = "top",
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        // Explicit default: a bare <button> inside a <form> submits it.
        type={type}
        className={`inline-flex items-center justify-center font-medium rounded-lg
          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${tooltip ? "relative group" : ""}
          ${variants[variant]} ${sizes[size]} ${className}`}
        // `disabled` is destructured out of props above, so the spread can no
        // longer overwrite this and re-enable a loading button.
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        ) : Icon ? (
          <Icon size={14} aria-hidden="true" />
        ) : null}
        {children}

        {tooltip && (
          <div
            className={`absolute z-10 whitespace-nowrap px-2 py-1 text-[10px] font-bold tracking-wider text-gray-100 bg-gray-800 rounded shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 ${tooltipStyles[tooltipLocation]}`}
          >
            {tooltip}
            <div
              className={`absolute border-[5px] ${tooltipArrowStyles[tooltipLocation]}`}
            />
          </div>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
