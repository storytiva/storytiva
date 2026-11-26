import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storytiva - vuelve a escribir",
  description:
    "Un espacio de escritura que te ayuda a organizar tu libro y retomarlo con facilidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

