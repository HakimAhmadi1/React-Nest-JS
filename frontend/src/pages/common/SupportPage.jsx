import { useLocation, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function SupportPage() {
  const location = useLocation();
  const path = location.pathname.split("/").pop()?.replace(/-/g, " ");
  const title = path ? path.charAt(0).toUpperCase() + path.slice(1) : "Support";

  return (
    <div className="min-h-screen bg-white pt-12 pb-20 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-8">
          <Link to="/" className="hover:text-black transition">
            Home
          </Link>
          <ChevronRight size={10} />
          <span className="text-black">{title}</span>
        </div>

        <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-8">
          {title}
        </h1>

        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-6">
          <p className="text-lg text-black font-medium">
            This page for {title} is currently under construction.
          </p>
          <p>
            We are working hard to bring you the best experience. In the meantime, if you
            have any urgent questions, please feel free to reach out to our support team.
          </p>

          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-black font-bold uppercase tracking-widest text-xs mb-4">
              Quick Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/products"
                className="p-6 border border-gray-100 rounded-2xl hover:border-black transition-all group"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-black transition">
                  Explore
                </p>
                <p className="font-bold text-black flex items-center gap-2">
                  Shop All Products <ChevronRight size={14} />
                </p>
              </Link>
              <Link
                to="/contact"
                className="p-6 border border-gray-100 rounded-2xl hover:border-black transition-all group"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-black transition">
                  Direct Help
                </p>
                <p className="font-bold text-black flex items-center gap-2">
                  Contact Support <ChevronRight size={14} />
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
