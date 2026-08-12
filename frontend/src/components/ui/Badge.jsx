/**
 * Badge component
 * variant: 'default' | 'success' | 'warning' | 'danger' | 'info'
 */
const variantMap = {
  default: "bg-gray-700 text-gray-300",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border border-red-500/30",
  info: "bg-primary-500/15 text-primary-400 border border-primary-500/30",
};

const Badge = ({ children, variant = "default", className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantMap[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
