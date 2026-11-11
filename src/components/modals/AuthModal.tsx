"use client";

import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCircuitStore } from "@/store/useCircuitStore";
import { getTranslation } from "@/i18n/translations";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  customMessage,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const { theme, locale } = useCircuitStore();
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    resetPasswordForEmail,
    isLoading,
    error: authError,
    clearError,
  } = useAuthStore();

  const isDark = theme === "dark";
  const t = getTranslation(locale).auth;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSuccessMessage(null);
    clearError();

    if (!email || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (mode === "forgot") {
      const res = await resetPasswordForEmail(email);
      if (res.success) {
        setResetSuccessMessage(t.resetSent);
      }
      return;
    }

    if (!password || password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signin") {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        onSuccess?.();
        onClose();
      }
    } else {
      const res = await signUpWithEmail(email, password);
      if (res.success) {
        onSuccess?.();
        onClose();
      }
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLocalError(null);
    setResetSuccessMessage(null);
    clearError();
    const res = await signInWithOAuth(provider);
    if (res.success) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-[390px] rounded-2xl border p-7 shadow-2xl relative animate-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-[#11131a] border-zinc-800 text-zinc-100"
            : "bg-white border-zinc-200/90 text-zinc-900"
        }`}
      >
        {/* Subtle close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isDark
              ? "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          }`}
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">
            {mode === "signin"
              ? t.welcomeBack
              : mode === "signup"
              ? t.createAccount
              : t.resetTitle}
          </h2>
          <p
            className={`text-xs mt-1.5 ${
              isDark ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {mode === "signin"
              ? t.loginSubtitle
              : mode === "signup"
              ? t.createAccountSubtitle
              : t.resetSubtitle}
          </p>
        </div>

        {/* Custom Context Message (e.g. for Forking) */}
        {customMessage && (
          <div
            className={`mb-4 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
              isDark
                ? "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-400" />
            <span>{customMessage}</span>
          </div>
        )}

        {/* Success message */}
        {resetSuccessMessage && (
          <div className="mb-4 px-3 py-2 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Error message */}
        {(localError || authError) && (
          <div className="mb-4 px-3 py-2 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Social Logins: Google & GitHub (shown on signin & signup) */}
        {mode !== "forgot" && (
          <>
            <div className="space-y-2.5">
              {/* Google Login */}
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={isLoading}
                className={`w-full h-10 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs ${
                  isDark
                    ? "bg-[#181c26] hover:bg-[#202533] border-zinc-700/80 text-zinc-100"
                    : "bg-white hover:bg-zinc-50 border-zinc-200/90 text-zinc-900"
                }`}
              >
                {/* Clean Google Vector */}
                <svg
                  className="w-4 h-4 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.24 10.285V13.4h6.887C18.2 16.1 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.815.535 3.86 1.415l2.42-2.42C16.89 3.48 14.7 2.6 12.24 2.6 7.055 2.6 2.85 6.805 2.85 12s4.205 9.4 9.39 9.4c5.42 0 9.02-3.81 9.02-9.18 0-.665-.07-1.3-.19-1.935H12.24z" />
                </svg>
                <span>
                  {mode === "signin" ? t.loginWithGoogle : t.signupWithGoogle}
                </span>
              </button>

              {/* GitHub Login */}
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={isLoading}
                className={`w-full h-10 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs ${
                  isDark
                    ? "bg-[#181c26] hover:bg-[#202533] border-zinc-700/80 text-zinc-100"
                    : "bg-white hover:bg-zinc-50 border-zinc-200/90 text-zinc-900"
                }`}
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>
                  {mode === "signin" ? t.loginWithGithub : t.signupWithGithub}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div
                className={`border-t w-full ${
                  isDark ? "border-zinc-800" : "border-zinc-200"
                }`}
              />
              <span
                className={`absolute px-3 text-[11px] font-normal ${
                  isDark
                    ? "bg-[#11131a] text-zinc-500"
                    : "bg-white text-zinc-400"
                }`}
              >
                {t.orDivider}
              </span>
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email-input"
              className={`block text-xs font-semibold ${
                isDark ? "text-zinc-200" : "text-zinc-900"
              }`}
            >
              {t.emailLabel}
            </label>
            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors ${
                isDark
                  ? "bg-[#161a24] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600"
                  : "bg-white border-zinc-200/90 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
              }`}
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password-input"
                  className={`block text-xs font-semibold ${
                    isDark ? "text-zinc-200" : "text-zinc-900"
                  }`}
                >
                  {t.passwordLabel}
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setLocalError(null);
                      setResetSuccessMessage(null);
                    }}
                    className={`text-[11px] font-medium transition-colors hover:underline ${
                      isDark
                        ? "text-zinc-400 hover:text-zinc-200"
                        : "text-zinc-800 hover:text-black"
                    }`}
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors ${
                  isDark
                    ? "bg-[#161a24] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600"
                    : "bg-white border-zinc-200/90 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : mode === "signin" ? (
              t.loginBtn
            ) : mode === "signup" ? (
              t.signupBtn
            ) : (
              t.sendResetLink
            )}
          </button>
        </form>

        {/* Footer info */}
        <div
          className={`mt-6 text-center text-xs ${
            isDark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {mode === "signin" ? (
            <>
              {t.noAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setLocalError(null);
                  setResetSuccessMessage(null);
                }}
                className={`underline underline-offset-3 font-medium transition-colors ${
                  isDark
                    ? "text-zinc-200 hover:text-white"
                    : "text-zinc-800 hover:text-black"
                }`}
              >
                {t.signUp}
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              {t.haveAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setLocalError(null);
                  setResetSuccessMessage(null);
                }}
                className={`underline underline-offset-3 font-medium transition-colors ${
                  isDark
                    ? "text-zinc-200 hover:text-white"
                    : "text-zinc-800 hover:text-black"
                }`}
              >
                {t.signIn}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setLocalError(null);
                setResetSuccessMessage(null);
              }}
              className={`underline underline-offset-3 font-medium transition-colors ${
                isDark
                  ? "text-zinc-200 hover:text-white"
                  : "text-zinc-800 hover:text-black"
              }`}
            >
              {t.rememberPassword || "Remember password? Login"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
