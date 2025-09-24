"use client";

import React, { useState, useEffect } from "react";
import { Menu, Search, UserCircle, X, LogOut, Settings, Home, LayoutDashboard, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    <div className="w-full bg-white shadow-md font-sans">
      <nav className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <div className="text-2xl font-extrabold text-blue-600">Brand</div>
        </div>

        <div className="flex items-center space-x-4">
          <ul className="hidden lg:flex items-center space-x-2 text-gray-700 font-medium">
            <li>
              <a
                href="/"
                className="relative px-4 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 ease-in-out
                           before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-0.5 before:bg-blue-600 before:transition-all before:duration-300 before:ease-in-out
                           hover:before:w-full hover:before:left-0"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/dashboard"
                className="relative px-4 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 ease-in-out
                           before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-0.5 before:bg-blue-600 before:transition-all before:duration-300 before:ease-in-out
                           hover:before:w-full hover:before:left-0"
              >
                Dashboard
              </a>
            </li>
          </ul>

          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 w-48 focus:w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Conditional rendering based on login status */}
          {!loggedIn ? (
            <div className="relative px-4 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 ease-in-out
                           before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-0.5 before:bg-blue-600 before:transition-all before:duration-300 before:ease-in-out
                           hover:before:w-full hover:before:left-0">
              <a href="/Login">
                <span>Login</span>
              </a>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 ease-in-out"
              >
                <UserCircle className="h-6 w-6" />
                <span className="hidden md:block">{user?.name || user?.email || 'Profile'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user?.name || 'User'}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleSidebar}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">Navigation</div>
          <button
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            onClick={toggleSidebar}
            aria-label="Close navigation"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>
        <ul className="flex flex-col p-4 space-y-2">
          <li>
            <a href="/" className="block px-4 py-2 rounded-md text-gray-800 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors duration-150">
              <Home className="h-5 w-5" /> <span>Home</span>
            </a>
          </li>
          <li>
            <a href="/dashboard" className="block px-4 py-2 rounded-md text-gray-800 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors duration-150">
              <LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span>
            </a>
          </li>
          <hr className="my-2 border-gray-100" />
          
          {/* Mobile auth section */}
          {!loggedIn ? (
            <li>
              <a href="/Login" className="block px-4 py-2 rounded-md text-gray-800 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors duration-150">
                <UserCircle className="h-5 w-5" /> <span>Login</span>
              </a>
            </li>
          ) : (
            <>
              <li className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
                <div className="font-medium">{user?.name || 'User'}</div>
                <div className="text-gray-500 text-xs">{user?.email}</div>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 rounded-md text-gray-800 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-2 transition-colors duration-150"
                >
                  <LogOut className="h-5 w-5" /> <span>Logout</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}