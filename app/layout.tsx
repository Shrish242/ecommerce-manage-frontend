// app/layout.tsx
import React from "react";
import Navbar from "@/Components/Navbar";
import "./globals.css"; // your Tailwind & global CSS


export const metadata = {
 title: "StoreForge",
description: "A dynamic e-commerce management platform that allows admins to manage products, track sales, and analyze customer data. Built with a React frontend, Node.js backend, and integrated with cloud databases for real-time inventory and analytics management.",
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
    <html suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
