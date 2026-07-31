import "./globals.css";
import { CartProvider } from "@/lib/cartContext";

export const metadata = {
  title: "Vesper Cosmic Blueprint",
  description:
    "High-end spiritual boutique for BaZi reports, crystal energy pieces, and custom press-on nails.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8ECEF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
