import type { Metadata } from "next";
import "./globals.css";
import PageVisibilityRefresh from "@/components/PageVisibilityRefresh";

export const metadata: Metadata = {
  title: "House Work Share",
  description: "Sistema de gestión de tareas domésticas con puntos",
  themeColor: "#0095e6",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "House Work Share",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <PageVisibilityRefresh />
      </body>
    </html>
  );
}
