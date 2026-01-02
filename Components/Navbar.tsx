"use client";

import React, { useState, useEffect } from "react";
import { Menu, Search, UserCircle, X, LogOut, Home, LayoutDashboard, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check authentication status on component mount and when auth state changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const userData = localStorage.getItem("user");
      
      setLoggedIn(isLoggedIn);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    checkAuthStatus();

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  // Handle navbar visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileDropdown = () => setShowProfileDropdown(!showProfileDropdown);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("dashboardData");
    setLoggedIn(false);
    setUser(null);
    setShowProfileDropdown(false);
    
    // Trigger auth state change event
    window.dispatchEvent(new Event('authStateChange'));
    
    router.push("/");
  };

  return (
    <div className={`w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 fixed top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-slate-950/95 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">StoreForge</span>
          </a>
        </div>

        {/* Center section - Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-1">
          <li>
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Dashboard
            </a>
          </li>
        </ul>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all w-48 focus:w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Auth section */}
          {!loggedIn ? (
            <a 
              href="/Login"
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Login
            </a>
          ) : (
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserCircle className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user?.name || user?.email || 'Profile'}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">StoreForge</span>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleSidebar}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 space-y-2">
          <a 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Home</span>
          </a>
          <a 
            href="/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            {!loggedIn ? (
              <a 
                href="/Login" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">Login</span>
              </a>
            ) : (
              <>
                <div className="px-4 py-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}