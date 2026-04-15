import "../styles/globals.css";
import { GlobalAppContextProvider } from "@/contexts/GlobalAppContext";

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
        <GlobalAppContextProvider>{children}</GlobalAppContextProvider>
      </body>
    </html>
  );
}
