import "~/styles/globals.css";
import { Geist } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geist = Geist({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}