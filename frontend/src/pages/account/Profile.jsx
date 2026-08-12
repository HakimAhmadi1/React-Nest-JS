import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Camera, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { postApi, putApi } from "@/services/api";
import { changePasswordSchema, profileSchema } from "@/utils/validation";
import FormAlert from "@/components/ui/FormAlert";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const FIELDS = [
  { name: "name", label: "Full name", required: true },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "zipCode", label: "Postal code" },
  { name: "country", label: "Country" },
];

const ProfileForm = ({ user, updateUser }) => {
  const fileInputRef = useRef(null);

  const [avatarError, setAvatarError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Derived, not mirrored into state: the store is already the source of truth
  // for the avatar, and copying it into an effect meant every re-render of an
  // identical `user` clobbered what was on screen.
  const avatar = user?.avatar ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    // The form is keyed on the user id below, so these defaults are applied
    // fresh whenever the signed-in account changes.
    defaultValues: {
      name: user?.name ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      zipCode: user?.zipCode ?? "",
      country: user?.country ?? "",
    },
  });

  /**
   * Uploads the file and stores the returned URL.
   *
   * The old version base64'd the image straight into `avatar`, a varchar(500)
   * column — which failed for any real photo — and never enforced the size or
   * type limits the UI advertised.
   */
  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError("");

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Choose a JPG, PNG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }

    const body = new FormData();
    body.append("file", file);

    setUploading(true);
    try {
      const { url } = await postApi("upload/image", body);
      const updated = await putApi("users/me", { avatar: url });
      updateUser(updated);
      toast.success("Profile picture updated");
    } catch (error) {
      setAvatarError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmitProfile = async (values) => {
    setProfileError("");
    try {
      // `/users/me`, so the server derives the target from the token instead of
      // trusting an id in the URL.
      const updated = await putApi("users/me", values);
      updateUser(updated);
      toast.success("Profile saved");
    } catch (error) {
      setProfileError(error.message || "Could not save your profile.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-2 lg:space-y-4 mb-4">
        <div className="flex items-center gap-4 text-gray-400">
          <Shield size={16} aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Secure profile
          </span>
        </div>
        <h1 className="text-2xl lg:text-4xl font-black text-black tracking-tight uppercase leading-none">
          Personal details
        </h1>
        <p className="text-gray-400 font-medium text-xs lg:text-sm max-w-lg">
          Manage your identity and account security settings.
        </p>
      </section>

      <section className="flex flex-col items-center sm:items-start gap-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="group relative w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-black flex items-center justify-center text-white text-4xl lg:text-5xl font-black ring-8 ring-white shadow-2xl overflow-hidden border-4 border-gray-100 disabled:opacity-60"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{user?.name?.charAt(0) ?? "U"}</span>
            )}
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" aria-hidden="true" />
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept={ACCEPTED_AVATAR_TYPES.join(",")}
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-lg font-black text-black uppercase tracking-tight">
            Profile picture
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            JPG, PNG, GIF or WebP • max 5 MB
          </p>
          {uploading && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Uploading…
            </p>
          )}
          {avatarError && (
            <p
              role="alert"
              className="text-[10px] font-black uppercase tracking-widest text-red-600"
            >
              {avatarError}
            </p>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-8" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {FIELDS.map(({ name, label, required }) => (
            <div key={name} className="space-y-2">
              <label
                htmlFor={`profile-${name}`}
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
              >
                {label}
              </label>
              <input
                id={`profile-${name}`}
                required={required}
                aria-invalid={Boolean(errors[name])}
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-black focus:border-black focus:outline-none transition-colors"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  {errors[name].message}
                </p>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <label
              htmlFor="profile-email"
              className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
            >
              Email
            </label>
            {/* Read-only: changing an address needs a verification flow. */}
            <input
              id="profile-email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-gray-400 bg-transparent"
            />
          </div>
        </div>

        <FormAlert message={profileError} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-5 px-10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>

      <PasswordSection />
    </div>
  );
};

/** Password change, isolated so its state can't collide with the profile form. */
const PasswordSection = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setError("");
    try {
      // camelCase, matching the API. It used to send old_password/new_password,
      // so the server received two undefined values.
      await putApi("auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed. Other sessions were signed out.");
      reset();
      setOpen(false);
    } catch (err) {
      setError(err.message || "Could not change your password.");
    }
  };

  return (
    <section className="border-t border-gray-100 pt-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black uppercase tracking-tight">
            Password
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Changing it signs out every other device
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-[10px] font-black uppercase tracking-widest text-black underline underline-offset-4 hover:text-gray-600"
        >
          {open ? "Cancel" : "Change password"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md" noValidate>
          {[
            {
              name: "currentPassword",
              label: "Current password",
              autoComplete: "current-password",
            },
            { name: "newPassword", label: "New password", autoComplete: "new-password" },
            {
              name: "confirmPassword",
              label: "Confirm new password",
              autoComplete: "new-password",
            },
          ].map(({ name, label, autoComplete }) => (
            <div key={name} className="space-y-2">
              <label
                htmlFor={`pw-${name}`}
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
              >
                {label}
              </label>
              <input
                id={`pw-${name}`}
                type="password"
                autoComplete={autoComplete}
                aria-invalid={Boolean(errors[name])}
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-black focus:border-black focus:outline-none transition-colors"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  {errors[name].message}
                </p>
              )}
            </div>
          ))}

          <FormAlert message={error} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-5 px-10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </section>
  );
};

/**
 * Keyed on the account id so react-hook-form's defaultValues are re-applied
 * when the signed-in user changes, without an effect that fights the inputs.
 */
const Profile = () => {
  const { user, updateUser } = useAuth();
  return (
    <ProfileForm key={user?.id ?? "anonymous"} user={user} updateUser={updateUser} />
  );
};

export default Profile;
