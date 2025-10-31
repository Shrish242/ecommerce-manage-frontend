// app/layout.tsx

import React from "react";
import Navbar from "@/Components/Navbar";
import "./globals.css"; // your tailwind & global CSS

// app/layout.js or your root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    
    <html lang="en">
      
      <body 
        suppressHydrationWarning={true}
      >
        <Navbar/>
        {children}
      </body>
    </html>
  )
}
