"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Field from "../../utils/Field";
import BirthdatePicker from "../../components/BirthdatePicker";
import { parseISO, subYears, isAfter } from "date-fns";
import api from "../../services/api";
import Link from "next/link";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Weak", color: "bg-error" };
    if (score <= 4) return { level: 2, label: "Medium", color: "bg-warning" };
    return { level: 3, label: "Strong", color: "bg-success" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="w-full mt-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : "bg-base-300"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs mt-1 ${
          strength.level === 1
            ? "text-error"
            : strength.level === 2
              ? "text-warning"
              : "text-success"
        }`}
      >
        {strength.label}
      </p>
    </div>
  );
}

export default function RegistrationPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isAdult = useMemo(() => {
    if (!birthdate) return false;
    const latest = subYears(new Date(), 18);
    return !isAfter(parseISO(birthdate), latest);
  }, [birthdate]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const userNameRegex = /^[A-Za-z][A-Za-z0-9\-]*$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

  const isEmailValid = emailRegex.test(email) && email.trim().length > 0;
  const isUsernameValid =
    userNameRegex.test(userName) &&
    userName.trim().length >= 3 &&
    userName.trim().length <= 30;
  const isFirstNameValid = firstName.trim().length > 0;
  const isLastNameValid = lastName.trim().length > 0;
  const isPasswordValid =
    passwordRegex.test(password) && password.trim().length > 0;
  const isBirthdateValid = birthdate !== "" && isAdult;

  const isFormValid =
    isEmailValid &&
    isUsernameValid &&
    isFirstNameValid &&
    isLastNameValid &&
    isPasswordValid &&
    isBirthdateValid;

  const completedFields = [
    isEmailValid,
    isUsernameValid,
    isFirstNameValid,
    isLastNameValid,
    isBirthdateValid,
    isPasswordValid,
  ].filter(Boolean).length;
  const progress = (completedFields / 6) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage("");

    const result = await api.register({
      username: userName,
      password: password,
      email: email,
      first_name: firstName,
      last_name: lastName,
      birthday: birthdate,
    });

    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      router.push("/verification");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-hero flex items-center justify-center py-8">
      <div className="flex flex-col gap-4 items-center w-full max-w-md mx-auto px-4 animate-fade-in">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-extrabold text-neutral mb-2 animate-slide-up">
            Create Account
          </h1>
          <p className="text-neutral/70 animate-slide-up animate-delay-100">
            Join Matcha and find your perfect match
          </p>
        </div>

        <div className="w-full glass rounded-full h-2 overflow-hidden animate-slide-up animate-delay-200">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral/60 -mt-2 animate-slide-up animate-delay-200">
          {completedFields}/6 fields completed
        </p>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-3xl shadow-xl w-full px-6 py-8 flex flex-col gap-5 animate-slide-up animate-delay-300 card-hover relative z-10"
        >
          {errorMessage && (
            <div className="alert alert-error rounded-2xl shadow-md animate-fade-in">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
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

          <Field
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={
              <svg
                className="h-5 w-5 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
            hint={!email ? "We will send a verification email" : ""}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={
              email && !isEmailValid ? "Please enter a valid email address" : ""
            }
            isValid={isEmailValid}
          />

          <Field
            label="Username"
            type="text"
            placeholder="johndoe"
            pattern="[A-Za-z][A-Za-z0-9\-]*"
            icon={
              <svg
                className="h-5 w-5 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            hint={
              !userName ? "3-30 characters, letters, numbers or hyphen" : ""
            }
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            error={
              userName && !isUsernameValid
                ? "3-30 characters, start with a letter"
                : ""
            }
            isValid={isUsernameValid}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="First Name"
              type="text"
              placeholder="John"
              icon={null}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={firstName !== "" && !isFirstNameValid ? "Required" : ""}
              isValid={isFirstNameValid}
            />
            <Field
              label="Last Name"
              type="text"
              placeholder="Doe"
              icon={null}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={lastName !== "" && !isLastNameValid ? "Required" : ""}
              isValid={isLastNameValid}
            />
          </div>

          <BirthdatePicker
            value={birthdate}
            onChange={setBirthdate}
            label="Date of Birth"
            minYear={1900}
            minAge={18}
            required
            error={
              birthdate && !isAdult
                ? "You must be at least 18 years old"
                : undefined
            }
          />

          <div className="relative">
            <Field
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              icon={
                <svg
                  className="h-5 w-5 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={
                password && !isPasswordValid
                  ? "Min 8 chars with uppercase, lowercase & number"
                  : ""
              }
              isValid={isPasswordValid}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-neutral/50 hover:text-neutral transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <PasswordStrength password={password} />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 mt-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-neutral/70 mt-2">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="link link-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-xs text-neutral/50 text-center max-w-sm animate-slide-up animate-delay-400 relative z-0">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
