// app/layout.tsx

"use client";
import React from "react";
import Navbar from "@/Components/Navbar";
import "./globals.css"; // your tailwind & global CSS

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
