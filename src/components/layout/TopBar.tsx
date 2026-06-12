"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Bell, Globe, LogOut, Search, User, ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

export default function TopBar() {
  const { user, logout, agency } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-20">
      <div className={`flex items-center gap-4 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="relative w-full max-w-md">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
          <input
            type="text"
            placeholder={t("search")}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all ${isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3"}`}
          />
        </div>
      </div>

      <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="uppercase">{language}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {showLangMenu && (
            <div className={`absolute top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px] ${isRTL ? "left-0" : "right-0"}`}>
              <button
                onClick={() => { setLanguage("en"); setShowLangMenu(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${language === "en" ? "text-brand font-medium" : "text-slate-700"} ${isRTL ? "text-right" : "text-left"}`}
              >
                English
              </button>
              <button
                onClick={() => { setLanguage("ar"); setShowLangMenu(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${language === "ar" ? "text-brand font-medium" : "text-slate-700"} ${isRTL ? "text-right" : "text-left"}`}
              >
                العربية
              </button>
            </div>
          )}
        </div>

        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-deep-blue text-white flex items-center justify-center text-xs font-bold">
              {getInitials(user?.name || "U")}
            </div>
            <div className={`hidden md:block text-left ${isRTL ? "text-right" : "text-left"}`}>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className={`absolute top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px] ${isRTL ? "left-0" : "right-0"}`}>
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{agency?.name}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <User className="w-4 h-4" />
                <span>{t("profile")}</span>
              </button>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
