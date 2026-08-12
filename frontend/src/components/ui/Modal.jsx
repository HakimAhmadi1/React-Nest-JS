import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: labelled, focus-trapped, scroll-locked, and it restores
 * focus to whatever opened it. Previously it was a bare div that only listened
 * for Escape, so keyboard users could tab straight out into the page behind.
 */
const Modal = ({ isOpen, onClose, title, size = "md", children }) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement;

    // Prevent the page behind the dialog from scrolling.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog.
    const focusables = panelRef.current?.querySelectorAll(FOCUSABLE);
    (focusables?.[0] ?? panelRef.current)?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!items?.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      // Wrap focus at both ends so it never escapes the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl animate-in fade-in duration-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 id={titleId} className="text-base font-semibold text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
