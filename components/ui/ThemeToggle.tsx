"use client";

import React from "react";
import { useTheme } from "@/components/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-md bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800 dark:bg-slate-900/80 dark:border-slate-800 dark:text-amber-400 light:bg-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
      title={theme === "dark" ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
      aria-label="Alternar Tema"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
