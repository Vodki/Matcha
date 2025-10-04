"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Field from "../../utils/Field";
import Link from "next/link";
import api from "../../services/api";

export default function SignIn() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
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
    
    setIsLoading(false);
    
    if (result.error) {
      setErrorMessage(result.error);
    } else {
      // Redirection vers la page d'accueil
      router.push("/home");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-8">
          Sign In
        </div>
        <form onSubmit={handleLogin} className="bg-base-100/95 shadow-lg px-6 py-8 card w-[430px] flex flex-col items-center h-auto">
          {errorMessage && (
            <div className="alert alert-error w-full mb-4">
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="flex flex-col gap-2 w-full">
            <Field
              label="Username *"
              type="text"
              placeholder="Username"
              pattern="[A-Za-z][A-Za-z0-9\-]*"
              title="Only letters, numbers or hyphen (-) allowed"
              icon={
                <svg
                  className="h-[1.2em] opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </g>
                </svg>
              }
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              error={
                userName && !isUsernameValid
                  ? "Username must be 3-30 characters long and can only contain letters, numbers, or hyphens."
                  : ""
              }
              isValid={isUsernameValid}
            />
            <Field
              label="Password *"
              type="password"
              placeholder="Password"
              icon={
                <svg
                  className="h-[1.2em] opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                    <circle
                      cx="16.5"
                      cy="7.5"
                      r=".5"
                      fill="currentColor"
                    ></circle>
                  </g>
                </svg>
              }
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={
                password && !isPasswordValid
                  ? "Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, and one number."
                  : ""
              }
              isValid={isPasswordValid}
            />
          </div>
          <button className="link link-primary text-sm self-center mt-2 mb-0">
            <Link href={"/verification"}>Forgot password</Link>
          </button>
          <button
            type="submit"
            className="btn btn-primary shadow-lg font-bold
            text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
