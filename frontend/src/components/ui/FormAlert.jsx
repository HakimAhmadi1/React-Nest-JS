/** Form-level error/success banner, announced to screen readers. */
export default function FormAlert({ message, tone = "error" }) {
  if (!message) return null;

  const styles =
    tone === "success"
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : "bg-red-50 border-red-100 text-red-600";

  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={`border-2 p-5 rounded-3xl animate-in slide-in-from-top-4 duration-500 ${styles}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-center">
        {message}
      </p>
    </div>
  );
}
