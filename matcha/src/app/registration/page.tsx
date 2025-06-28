import React, { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label: string;
  icon?: ReactNode;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function Field({ label, icon, hint, ...props }: FieldProps) {
  return (
    <fieldset className="fieldset w-full">
      <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
        {label}
      </legend>
      <label
        className="
        relative
        input validator
        flex items-center gap-2
        px-3 py-2
        bg-white
        transition-all duration-150
        w-full
        "
      >
        {icon && <span>{icon}</span>}
        <input className="text-base" {...props} />
      </label>
      <p className="text-xs text-gray-400 min-h-[1.1em]">{hint}</p>
    </fieldset>
  );
}

export default function RegistrationPage() {
  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Registration
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          <Field
            label="E-mail"
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
            hint="Enter valid email address"
          />
          <Field
            label="Username"
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
            hint="3-30 characters: letters, numbers or hyphen (-)"
          />
          <Field
            label="Firstname"
            type="text"
            placeholder="Firstname"
            icon={null}
            hint=""
          />
          <Field
            label="Lastname"
            type="text"
            placeholder="Lastname"
            icon={null}
            hint=""
          />
          <Field
            label="Password"
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
            hint="8+ characters, lowercase, uppercase and number"
          />
          <button
            type="submit"
            className="btn btn-primary shadow-lg font-bold
            text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
