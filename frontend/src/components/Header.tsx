import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineLineChart } from "react-icons/ai";

const Header: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <header className="bg-white border-b border-gray-100 px-10 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-[#1a1a2e] rounded-lg w-9 h-9 flex items-center justify-center">
          <AiOutlineLineChart className="text-[#c8b8f8] text-lg" />
        </div>
        <div>
          <p className="font-serif text-[17px] text-gray-900 leading-tight tracking-tight">
            Lena Müller
          </p>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-light">
            Data Visualization · MSc Thesis
          </p>
        </div>
      </div>

      <nav className="flex gap-8">
        {[
          { label: "Project", to: "/" },
          { label: "About", to: "/about" },
          { label: "Contact", to: "/contact" },
        ].map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className={`text-[13px] transition-colors ${
              pathname === to
                ? "text-gray-900 font-medium"
                : "text-gray-400 hover:text-gray-700 font-normal"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
