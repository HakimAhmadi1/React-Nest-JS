import { Link } from "react-router-dom";
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const Banner = () => {
  return (
    <div className="relative bg-black text-white py-3 px-4 overflow-hidden group">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-transparent to-primary-600/20 animate-pulse"></div>

      <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary-400 animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
            v1.2 Release: Improved Admin Dashboard & Premium UI Kit is now live
          </p>
        </div>

        <Link
          to="/about"
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border-b border-white/30 hover:border-white transition-all pb-0.5"
        >
          Explore Updates{" "}
          <ArrowRight
            size={10}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
};

export default Banner;
