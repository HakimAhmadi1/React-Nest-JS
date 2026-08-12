import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/utils/validation";
import { ADMIN_ROLES } from "@/utils/permissions";
import FormField from "@/components/ui/FormField";
import FormAlert from "@/components/ui/FormAlert";

/** Only follow same-origin relative paths, never an absolute URL. */
function safeRedirect(raw) {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : null;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setFormError("");
    try {
      const session = await login(values);
      const isAdminUser = session.roles?.some((r) => ADMIN_ROLES.includes(r));
      const redirect = safeRedirect(searchParams.get("redirect"));
      navigate(redirect ?? (isAdminUser ? "/admin" : "/"), { replace: true });
    } catch (error) {
      // The API's real message, not a hardcoded fallback: `message.detail`
      // never existed on this payload, so users only ever saw generic text.
      setFormError(error.message || "Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 bg-white animate-in fade-in duration-1000">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-black tracking-tighter uppercase leading-none italic">
              Welcome Back
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
              Sign in to your account
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-50" />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 relative z-10"
            noValidate
          >
            <FormField
              label="Email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
            />

            <div className="space-y-3">
              <FormField
                label="Password"
                type="password"
                icon={Lock}
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                registration={register("password")}
              />
              <div className="flex justify-end px-1">
                <Link
                  to="/forgot-password"
                  className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <FormAlert message={formError} />

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-6 px-4 border border-transparent rounded-full shadow-2xl shadow-black/20 text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                  New here?
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link
                to="/register"
                className="w-full flex justify-center py-6 px-4 border-2 border-gray-200 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-black hover:border-black hover:bg-gray-50 transition-all text-center"
              >
                Create an account
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-loose">
            By signing in, you accept our{" "}
            <Link
              to="/terms"
              className="text-gray-400 hover:text-black underline underline-offset-4"
            >
              Terms
            </Link>{" "}
            &{" "}
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-black underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
