import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, Globe, Info, RefreshCcw, Save, Shield } from "lucide-react";
import { getApi, putApi } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { fetchSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("general");

  // `system/settings/all` — the unauthenticated `system/settings` is filtered
  // to a public allow-list and would not include the security keys below.
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "all"],
    queryFn: () => getApi("system/settings/all"),
  });

  const updateMutation = useMutation({
    // The endpoint takes { settings: { key: value } } and validates each key
    // against a server-side allow-list.
    mutationFn: (values) => putApi("system/settings", { settings: values }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      // Refresh the public branding used by the shell (app name, logo).
      fetchSettings();
    },
    onError: (err) => toast.error(err.message || "Failed to save settings"),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);

    const values = Object.fromEntries(
      Array.from(form.entries()).map(([key, value]) => [key, String(value)]),
    );
    // Unchecked checkboxes are absent from FormData; send them explicitly.
    values.mfaRequired = form.get("mfaRequired") === "on" ? "true" : "false";
    values.notif_user_registration =
      form.get("notif_user_registration") === "on" ? "true" : "false";

    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-64 rounded bg-gray-900 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage global configuration for your application.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-64 space-y-1" aria-label="Settings sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === id
                  ? "bg-primary-600/10 text-primary-400 border border-primary-500/20"
                  : "text-gray-400 hover:bg-gray-800 border border-transparent"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 card">
          {/*
            Rendered with `hidden` rather than unmounted, so switching tabs
            doesn't discard edits made on another tab before saving.
          */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div hidden={activeTab !== "general"} className="space-y-4">
              <Input
                label="Application name"
                name="appName"
                placeholder="My Application"
                defaultValue={settings?.appName ?? ""}
              />
              <Input
                label="Contact email"
                name="appEmail"
                type="email"
                placeholder="support@example.com"
                defaultValue={settings?.appEmail ?? ""}
              />
              <Input
                label="Support URL"
                name="supportUrl"
                placeholder="/support"
                defaultValue={settings?.supportUrl ?? ""}
              />
              <Input
                label="Logo URL"
                name="logoUrl"
                placeholder="https://…"
                defaultValue={settings?.logoUrl ?? ""}
                hint="Shown in the navigation bar. Upload one in the Media library first."
              />
            </div>

            <div hidden={activeTab !== "security"} className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <Info className="text-blue-400 shrink-0" size={20} aria-hidden="true" />
                <p className="text-sm text-blue-300">
                  Secrets (JWT signing key, database credentials, SMTP) are configured
                  through environment variables and validated at boot — they are
                  deliberately not editable here.
                </p>
              </div>

              <Input
                label="Session timeout (minutes)"
                name="sessionTimeout"
                type="number"
                min={5}
                max={1440}
                defaultValue={settings?.sessionTimeout ?? "60"}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="mfaRequired"
                  id="mfaRequired"
                  defaultChecked={settings?.mfaRequired === "true"}
                  className="rounded border-gray-700 bg-gray-800"
                />
                <label
                  htmlFor="mfaRequired"
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Require 2FA for all administrators
                </label>
              </div>
            </div>

            <div hidden={activeTab !== "notifications"} className="space-y-4">
              <p className="text-sm text-gray-400">
                Choose which events send an email notification.
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900/50">
                <label
                  htmlFor="notif_user_registration"
                  className="text-gray-300 text-sm cursor-pointer"
                >
                  User registration
                </label>
                <input
                  type="checkbox"
                  id="notif_user_registration"
                  name="notif_user_registration"
                  defaultChecked={settings?.notif_user_registration !== "false"}
                  className="rounded border-gray-700 bg-gray-800 text-primary-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={RefreshCcw}
                onClick={() => queryClient.invalidateQueries({ queryKey: ["settings"] })}
              >
                Reset
              </Button>
              <Button type="submit" icon={Save} loading={updateMutation.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
