"use client";

import React, { useState } from "react";
import Link from "next/link";
import Field from "../../utils/Field";

export default function RegistrationPage() {
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

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

  const isFormValid =
    isEmailValid &&
    isUsernameValid &&
    isFirstNameValid &&
    isLastNameValid &&
    isPasswordValid;

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Registration
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          <Field
            label="E-mail *"
            type="email"
            placeholder="mail@site.com"
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
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </g>
              </svg>
            }
            hint={
              !isEmailValid && email
                ? "Email non valide"
                : "Enter valid email address"
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!isEmailValid && email ? "Invalid email format" : ""}
            isValid={isEmailValid}
          />
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
            hint={
              userName && !isUsernameValid
                ? "3-30 characters, letters, numbers or hyphen (-)"
                : "3-30 characters, letters, numbers or hyphen (-)"
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
            label="Firstname *"
            type="text"
            placeholder="Firstname"
            icon={null}
            hint={firstName === "" ? "Firstname is required" : ""}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={firstName === "" ? "Firstname is required" : ""}
            isValid={firstName.trim().length > 0}
          />
          <Field
            label="Lastname *"
            type="text"
            placeholder="Lastname"
            icon={null}
            hint={lastName === "" ? "Lastname is required" : ""}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={lastName === "" ? "Lastname is required" : ""}
            isValid={lastName.trim().length > 0}
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
            title="8+ characters, 1 lowercase, 1 uppercase, 1 number minimum"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            hint={
              password && !isPasswordValid
                ? "Weak password"
                : "8+ characters, lowercase, uppercase and number"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={
              password && !isPasswordValid
                ? "Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, and one number."
                : ""
            }
            isValid={isPasswordValid}
          />
          {/*Will need to handle sending the verification email from there once the backend is done*/}
          <button
            type="submit"
            className="btn btn-primary shadow-lg font-bold
            text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
            disabled={!isFormValid}
          >
            <Link href={"/verification"}>Register</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
