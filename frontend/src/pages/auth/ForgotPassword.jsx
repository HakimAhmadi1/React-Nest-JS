import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import { postApi } from "@/services/api";
import { forgotPasswordSchema } from "@/utils/validation";
import FormField from "@/components/ui/FormField";
import FormAlert from "@/components/ui/FormAlert";

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }) => {
    setFormError("");
    try {
      await postApi("auth/forgot-password", { email }, null, false);
      setSubmitted(true);
    } catch (error) {
      setFormError(error.message || "Failed to send reset link. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 bg-white animate-in fade-in duration-1000">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase leading-none italic">
              Check your inbox
            </h1>
            {/*
              Deliberately does not confirm whether the address exists — the
              server returns the same response either way.
            */}
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              If that email is registered, we’ve sent a reset link. It expires in one
              hour.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-5 px-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to sign in
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
            Reset Password
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            We’ll email you a reset link
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            <FormField
              label="Email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
            />

            <FormAlert message={formError} />

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-6 px-4 rounded-full shadow-2xl shadow-black/20 text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                <ArrowLeft size={12} strokeWidth={3} />
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
