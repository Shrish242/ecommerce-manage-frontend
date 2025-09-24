"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Register from "@/Components/Register"; // or wherever the component is

export default function RegisterPage() {
  return (
      <div className="min-h-screen bg-gray-100">
          <Register />
      </div>
)}