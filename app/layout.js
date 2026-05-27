import "./globals.css";

export const metadata = {
  title: "Vesper Cosmic Blueprint",
  description:
    "High-end spiritual boutique for BaZi reports, crystal energy pieces, and custom press-on nails.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
