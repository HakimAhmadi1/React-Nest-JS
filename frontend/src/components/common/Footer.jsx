import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { Instagram, Twitter, Facebook, Youtube, Github } from "lucide-react";

export default function Footer() {
  const { settings } = useSettings();

  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Navigation",
      links: [
        { label: "Home", to: "/" },
        { label: "About Us", to: "/about" },
        { label: "Careers", to: "/careers" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", to: "/contact" },
        { label: "Help & FAQ", to: "/faq" },
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
      ],
    },

    {
      title: "User",
      links: [
        { label: "My Profile", to: "/account/profile" },
        { label: "Dashboard", to: "/account" },
      ],
    },
  ];

  return (
    <footer className="bg-black text-white pt-24 pb-12 border-t border-gray-900 mt-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand/Bio */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="text-2xl font-black uppercase tracking-[0.2em] mb-6 block"
            >
              {settings.appName}
            </Link>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-8 max-w-[240px]">
              A high-performance full-stack boilerplate designed for speed, scalability,
              and developer experience.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <Link
                  key={i}
                  to="#"
                  className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 hover:text-white hover:border-white transition-all duration-300"
                >
                  <Icon size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white mb-8">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Lower Bar */}
        <div className="pt-12 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-600">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p>
              &copy; {currentYear} {settings.appName || "PLATFORM"}. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition">
                Terms & Conditions
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <div className="w-8 h-8 rounded-md bg-gray-900 border border-gray-800"></div>
            <div className="w-8 h-8 rounded-md bg-gray-900 border border-gray-800"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
