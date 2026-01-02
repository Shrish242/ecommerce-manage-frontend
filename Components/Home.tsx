"use client";
import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3, 
  Palette, 
  Package, 
  Globe,
  Check,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Palette,
      title: "AI-Powered Design",
      description: "Intelligent design systems that adapt to your brand identity."
    },
    {
      icon: Package,
      title: "Enterprise Infrastructure",
      description: "Scalable architecture built for high-volume operations."
    },
    {
      icon: Zap,
      title: "Global Performance",
      description: "Edge-optimized delivery network ensuring fast load times."
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "SOC 2 certified with end-to-end encryption."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time business intelligence with predictive modeling."
    },
    {
      icon: Globe,
      title: "International Commerce",
      description: "Multi-currency processing and localized checkout."
    }
  ];

  const stats = [
    { value: "500+", label: "Active Users" },
    { value: "150+", label: "Projects" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero - adjusted for navbar */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Enterprise Commerce<br />
            <span className="text-blue-600 dark:text-blue-400">Built for Scale</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            The intelligent ecommerce platform powering fast-growing brands with enterprise reliability and startup agility.
          </p>
          <a href="/dashboard"><button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Get Started
          </button></a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Features</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade capabilities engineered for exceptional experiences.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">About StoreForge</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400">
            <p>
              Founded in 2023, StoreForge started as a passion project to revolutionize how businesses build their online presence. What began as a small team of developers has grown into a thriving platform serving hundreds of users worldwide.
            </p>
            <p>
              Our mission is to make powerful ecommerce tools accessible to everyone - from solo entrepreneurs to growing businesses. We believe great technology should empower, not complicate.
            </p>
            <p>
              We're constantly innovating, listening to our community, and building features that actually matter.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Ready to transform your commerce experience?
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">storeforge100@gmail.com</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">977 980001000</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-1">Location</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Kathmandu, Nepal</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-12">
            <a href="https://x.com/ShrishDhakal" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/shrishdhakal/" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com/Shrish242" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">StoreForge</span>
          </div>
          <p>© 2024 StoreForge Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Terms</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}