import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Label + input + error, wired for accessibility:
 * `htmlFor`/`id` are linked, and the error is announced via `aria-describedby`
 * and `aria-invalid` rather than being colour-only.
 */
export default function FormField({
  label,
  type = "text",
  icon: Icon,
  error,
  registration,
  ...props
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [reveal, setReveal] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && reveal ? "text" : type;

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1"
      >
        {label}
      </label>

      <div className="relative group/field">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within/field:text-black transition-colors">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}

        <input
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`block w-full ${Icon ? "pl-14" : "pl-6"} ${
            isPassword ? "pr-14" : "pr-6"
          } py-5 border-2 rounded-3xl bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-black/5 transition-all text-sm font-bold text-black ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-50 focus:border-black"
          }`}
          {...registration}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-300 hover:text-black transition-colors cursor-pointer"
          >
            {reveal ? (
              <EyeOff size={18} strokeWidth={2.5} />
            ) : (
              <Eye size={18} strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-[10px] font-black uppercase tracking-widest text-red-600 ml-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
