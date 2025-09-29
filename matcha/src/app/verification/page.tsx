import React from "react";
import Link from "next/link";

export default function VerificationPage() {
  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Verification
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          <p className="text-neutral text-center">
            Please check your email for a verification link. Click the link to
            verify your account.
          </p>
          <p className="text-neutral text-center">
            If you haven&#39;t received the email, please check your spam folder
            or request a new verification email.
          </p>
          <button
            type="submit"
            className="btn btn-primary shadow-lg font-bold
            text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
          >
            <Link href={"/verification"}>New verification email</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
