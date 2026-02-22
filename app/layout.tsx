import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "House Work Share",
  description: "Sistema de gestión de tareas domésticas con puntos",
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
