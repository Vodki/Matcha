"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";

export default function SignIn() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userNameRegex = /^[A-Za-z][A-Za-z0-9\-]*$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

  const isUsernameValid =
    userNameRegex.test(userName) &&
    userName.trim().length >= 3 &&
    userName.trim().length <= 30;
  const isPasswordValid =
    passwordRegex.test(password) && password.trim().length > 0;

  const isFormValid = isUsernameValid && isPasswordValid;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage("");

    const result = await api.login({
      username: userName,
      password: password,
    });

    if (result.error) {
      setIsLoading(false);
      setErrorMessage(result.error);
      return;
    }

    const userResult = await api.getCurrentUser();
    setIsLoading(false);

    if (userResult.data) {
      const user = userResult.data;
      const isProfileComplete = user.gender && user.bio && user.location;

      if (isProfileComplete) {
        router.push("/home");
      } else {
        router.push("/informations");
      }
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-hero flex items-center justify-center py-8 px-4">
      <div className="flex flex-col gap-6 items-center w-full max-w-md mx-auto animate-fade-in">
        <div className="text-center animate-slide-up">
          <div className="text-6xl mb-4">🍵</div>
          <h1 className="text-4xl font-extrabold text-neutral mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral/70">Sign in to continue your journey</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="glass rounded-3xl shadow-xl w-full px-8 py-10 flex flex-col gap-5 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {errorMessage && (
            <div className="alert alert-error rounded-2xl shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Username
            </legend>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral/50">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <input
                type="text"
                className={`input w-full pl-12 pr-4 py-3 bg-white/80 rounded-xl border-2 transition-all duration-200 ${
                  userName
                    ? isUsernameValid
                      ? "border-success focus:border-success"
                      : "border-error focus:border-error"
                    : "border-transparent focus:border-primary"
                }`}
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              {userName && isUsernameValid && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
          </fieldset>

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Password
            </legend>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral/50">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className={`input w-full pl-12 pr-12 py-3 bg-white/80 rounded-xl border-2 transition-all duration-200 ${
                  password
                    ? isPasswordValid
                      ? "border-success focus:border-success"
                      : "border-error focus:border-error"
                    : "border-transparent focus:border-primary"
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral/50 hover:text-neutral transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </fieldset>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full mt-2"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-neutral/20"></div>
            <span className="text-sm text-neutral/50">or</span>
            <div className="flex-1 h-px bg-neutral/20"></div>
          </div>

          <div className="text-center">
            <p className="text-neutral/70">
              Do not have an account?{" "}
              <Link
                href="/registration"
                className="text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </form>

        <p
          className="text-xs text-neutral/50 text-center animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          Find your perfect match with Matcha 💕
        </p>
      </div>
    </div>
  );
}
