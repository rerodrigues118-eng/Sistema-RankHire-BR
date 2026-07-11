"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type AdminProfile = {
  email?: string | null;
};

export default function Topbar({ admin }: { admin: AdminProfile | null }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("admin-theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("admin-theme", next);
    setTheme(next);
  };

  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <div className="topbar-title">RankHire BR Admin</div>
      </div>
      <div className="topbar-actions">
        <div className="topbar-email">{admin?.email ?? ""}</div>
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
