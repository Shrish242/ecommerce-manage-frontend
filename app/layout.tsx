// app/layout.tsx
import React from "react";
import Navbar from "@/Components/Navbar";
import "./globals.css"; // your Tailwind & global CSS

export const metadata = {
  title: "Project1",
  description: "Your project description here",
  icons: {
    icon: "/favicon.png", // path inside /public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
