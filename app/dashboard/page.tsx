"use client";
import React, { useState } from "react";
import Dashboard from "@/Components/Dashboard"; // or wherever the component is

// Ensure this matches how you've exported your component
export default function ProductsPage() {
  const [products, setProducts] = useState([]); // You can preload your products here if needed

  return (
    <div className="min-h-screen bg-gray-100">
        <Dashboard />
    </div>
  );
}
