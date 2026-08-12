import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, ShieldCheck, UserPlus, Users } from "lucide-react";
import { getApi } from "@/services/api";

const StatCard = ({ title, value, hint, icon: Icon }) => (
  <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-primary-500/30 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-600/20 group-hover:text-primary-400 transition-colors">
        <Icon size={24} aria-hidden="true" />
      </div>
      {hint && <span className="text-xs font-bold text-gray-500">{hint}</span>}
    </div>
    <h3 className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-1">
      {title}
    </h3>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const relativeTime = (iso) => {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, secondsPerUnit] of units) {
    const value = Math.floor(seconds / secondsPerUnit);
    if (value >= 1) return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

const DashboardPage = () => {
  // Real data from GET /api/dashboard. This page previously rendered a
  // hardcoded array while importing useQuery and never calling it.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getApi("dashboard"),
  });

  const stats = data?.stats;

  const cards = [
    { title: "Total users", value: stats?.total ?? 0, icon: Users },
    { title: "Active users", value: stats?.active ?? 0, icon: Activity },
    { title: "Administrators", value: stats?.admins ?? 0, icon: ShieldCheck },
    {
      title: "New (30 days)",
      value: stats?.last30Days ?? 0,
      icon: UserPlus,
    },
  ];

  const peakSignups = Math.max(1, ...(data?.signupsByDay ?? []).map((d) => d.count));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
          <Clock size={14} className="text-primary-500" aria-hidden="true" />
          System overview
        </p>
      </div>

      {isError && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          {error.message || "Failed to load dashboard data."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse"
              />
            ))
          : cards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
            Registrations (last 14 days)
          </h2>

          {isLoading ? (
            <div className="h-32 rounded-lg bg-gray-800 animate-pulse" />
          ) : (
            <div
              className="flex items-end gap-1 h-32"
              role="img"
              aria-label="Daily registrations"
            >
              {(data?.signupsByDay ?? []).map((day) => (
                <div key={day.date} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="bg-primary-600/70 rounded-t transition-all hover:bg-primary-500"
                    style={{ height: `${(day.count / peakSignups) * 100}%` }}
                    title={`${day.date}: ${day.count}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
            Recent activity
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : data?.recentActivity?.length ? (
            <ul className="space-y-3">
              {data.recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 border-b border-gray-800 pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      {entry.description || entry.action}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.userName ?? "system"} · {entry.module}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {relativeTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
