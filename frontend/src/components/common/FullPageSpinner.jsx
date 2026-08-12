const FullPageSpinner = ({ label = "Loading" }) => (
  <div
    className="min-h-screen flex items-center justify-center bg-white"
    role="status"
    aria-live="polite"
  >
    <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-black" />
    <span className="sr-only">{label}</span>
  </div>
);

export default FullPageSpinner;
