import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema } from "@/utils/validation";
import FormField from "@/components/ui/FormField";
import FormAlert from "@/components/ui/FormAlert";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: signUp } = useAuth();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, password }) => {
    setFormError("");
    try {
      await signUp({ name, email, password });
      const redirect = searchParams.get("redirect");
      navigate(redirect?.startsWith("/") ? decodeURIComponent(redirect) : "/", {
        replace: true,
      });
    } catch (error) {
      // Surfaces the real reason (e.g. "Email already registered").
      setFormError(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 bg-white animate-in fade-in duration-1000">
      <div className="max-w-xl w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-5xl lg:text-7xl font-black text-black tracking-tighter uppercase leading-none italic">
            Sign Up
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            Create your account
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            <FormField
              label="Full name"
              icon={User}
              autoComplete="name"
              placeholder="Jane Doe"
              error={errors.name?.message}
              registration={register("name")}
            />

            <FormField
              label="Email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
            />

            <FormField
              label="Password"
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

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-6 px-4 rounded-full shadow-2xl shadow-black/20 text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-black underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
