import React from "react";
import { useSettings } from "@/hooks/useSettings";
import { Link } from "react-router-dom";
import { Layout, Shield, Cpu, Zap, Globe, Smartphone, PlugZap } from "lucide-react";

export default function Home() {
  const { settings } = useSettings();

  const features = [
    {
      title: "Modular Backend",
      desc: "NestJS powered architecture with domain-driven kernels for scalable business logic.",
      icon: Cpu,
    },
    {
      title: "Modern Frontend",
      desc: "React 19 + Vite with TailwindCSS v4 for high-performance user interfaces.",
      icon: PlugZap,
    },
    {
      title: "Secure Auth",
      desc: "JWT & Passport integration with role-based access control and persistent sessions.",
      icon: Shield,
    },
    {
      title: "Cloud Ready",
      desc: "Pre-configured for AWS S3 and Cloudinary for seamless media management.",
      icon: Globe,
    },
    {
      title: "Mobile First",
      desc: "Responsive design that looks great on every screen size from phone to ultra-wide.",
      icon: Smartphone,
    },
    {
      title: "Standard UI",
      desc: "A library of reusable, premium UI components like Modals, Tables, and Buttons.",
      icon: Layout,
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-black">
        {/* Banner Image Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-banner.png"
            alt="Hero Banner"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Generic Full-Stack <br />
              <span className="text-gray-500">Development Template</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 font-medium max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              A high-performance boilerplate designed for speed, scalability, and
              developer experience. Built with the latest industry standards to jumpstart
              your next project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link
                to="/register"
                className="bg-white text-black px-10 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl"
              >
                Get Started Now
              </Link>
              <Link
                to="/login"
                className="bg-transparent border border-white/20 text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-10 rounded-3xl border border-gray-100 hover:border-black transition-colors duration-500 group shadow-sm hover:shadow-xl"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-colors duration-500">
                  <f.icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black mb-4">
                  {f.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion Section */}
      <section className="py-24 lg:py-48">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="bg-black rounded-3xl lg:rounded-[4rem] p-12 lg:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              {/* SVG Noise or Grid background could go here */}
            </div>
            <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-10 relative z-10 leading-none">
              Stop Building from Scratch. <br />
              Start Shipping Today.
            </h2>
            <Link
              to="/register"
              className="inline-block bg-white text-black px-12 py-6 rounded-full text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all relative z-10"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Meta Info */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            &copy; {new Date().getFullYear()} {settings.appName || "PLATFORM"} ADMIN
            TEMPLATE / VERSION 1.0.0
          </div>
          <div className="flex gap-8">
            <Link
              to="/about"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black"
            >
              Documentation
            </Link>
            <Link
              to="/support"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black"
            >
              Support
            </Link>
            <Link
              to="/contact"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
