import "~/styles/globals.css";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

const geist = Geist({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}