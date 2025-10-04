"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";

export default function VerificationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (token) {
      // Si un token est présent dans l'URL, on vérifie l'email
      const verifyEmail = async () => {
        const result = await api.verify(token);
        if (result.error) {
          setVerificationStatus("error");
          setMessage(result.error);
        } else {
          setVerificationStatus("success");
          setMessage(result.message || "Email verified successfully!");
        }
      };
      verifyEmail();
    }
  }, [token]);
  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Verification
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          {token ? (
            // Cas où on vérifie un token
            <>
              {verificationStatus === "pending" && (
                <p className="text-neutral text-center">Verifying your email...</p>
              )}
              {verificationStatus === "success" && (
                <>
                  <div className="alert alert-success">
                    <span>{message}</span>
                  </div>
                  <Link href="/sign-in" className="btn btn-primary w-full">
                    Go to Sign In
                  </Link>
                </>
              )}
              {verificationStatus === "error" && (
                <>
                  <div className="alert alert-error">
                    <span>{message}</span>
                  </div>
                  <Link href="/registration" className="btn btn-primary w-full">
                    Back to Registration
                  </Link>
                </>
              )}
            </>
          ) : (
            // Cas où on affiche juste le message de vérification
            <>
              <p className="text-neutral text-center">
                Please check your email for a verification link. Click the link to
                verify your account.
              </p>
              <p className="text-neutral text-center">
                If you haven&#39;t received the email, please check your spam folder.
              </p>
              <Link href="/sign-in" className="btn btn-primary w-full mt-3">
                Go to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
