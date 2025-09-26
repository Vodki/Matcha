import "../styles/globals.css";
import Image from "next/image";

import { GlobalAppContextProvider } from "./contexts/GlobalAppContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        data-theme="valentine"
        className="w-full h-full relative bg-base-200"
      >
        <GlobalAppContextProvider>
          {children}
          <div className="fixed bottom-0 right-0 p-4 z-50">
            <Image
              src="/tea-cup.svg"
              alt="Matcha Logo"
              width={64}
              height={64}
              className="w-15 h-15 md:w-20 md:h-20"
            />
          </div>
        </GlobalAppContextProvider>
      </body>
    </html>
  );
}
