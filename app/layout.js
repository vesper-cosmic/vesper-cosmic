import "./globals.css";
import Providers from "@/components/Providers";
import { CartProvider } from "@/lib/cartContext";
import SiteHeader from "@/components/SiteHeader";
import CartDrawer from "@/components/shop/CartDrawer";

export const metadata = {
  title: "Vesper Cosmos",
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
        <Providers>
          <CartProvider>
            <SiteHeader />
            {children}
            <CartDrawer />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}