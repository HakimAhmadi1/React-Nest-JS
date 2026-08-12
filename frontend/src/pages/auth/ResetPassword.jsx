import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { postApi } from "@/services/api";
import { resetPasswordSchema } from "@/utils/validation";
import FormField from "@/components/ui/FormField";
import FormAlert from "@/components/ui/FormAlert";

const REDIRECT_DELAY_MS = 4000;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  // Cleared on unmount — the old version navigated after the component was gone.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/login"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const onSubmit = async ({ password }) => {
    setFormError("");
    if (!token) {
      setFormError("This reset link is missing its token. Request a new one.");
      return;
    }

    try {
      // Token in the body, matching the endpoint. This used to POST to a route
      // that expected it as a path segment, so every reset 404'd.
      await postApi("auth/reset-password", { token, password }, null, false);
      setSuccess(true);
    } catch (error) {
      setFormError(error.message || "Reset failed. The link may have expired.");
    }
  };

  if (success) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 bg-white animate-in fade-in duration-1000">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase leading-none italic">
              Password updated
            </h1>
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              All existing sessions have been signed out. Redirecting you to sign in…
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center py-5 px-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 transition-all"
          >
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 bg-white animate-in fade-in duration-1000">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
            New Password
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            Choose a strong password
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          {!token && (
            <FormAlert message="This reset link is missing its token. Request a new one." />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-2" noValidate>
            <FormField
              label="New password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              registration={register("password")}
            />

            <FormField
              label="Confirm password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              registration={register("confirmPassword")}
            />

            <FormAlert message={formError} />

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full flex justify-center py-6 px-4 rounded-full shadow-2xl shadow-black/20 text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Update password"
                )}
              </button>

              <Link
                to="/login"
                className="block text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
