// Fixed Dashboard.tsx - Add missing properties to initialDashboardData

import React, { useState, useEffect } from 'react';
import {
  Home, ShoppingCart, Users, Package, BarChart2, Settings, LogOut, Menu, X, Search, Bell
} from 'lucide-react';
import { useRouter } from "next/navigation";

// Import your existing components
import DashboardOverview from './DashboardOverview';
import ProductManagement from './ProductManagement';
import OrdersManagement from './OrderManagement';
import Automation from './Automation';
import Analytics from './Analytics';
import SettingsComponent from './Settings';

// Import types from your existing types file
import type { Product, DashboardData } from './types';

interface User {
  name?: string;
  email?: string;
  id?: number;
  organization_id?: number;
  organizationId?: number;
  orgId?: number;
  [key: string]: any;
}

// ✅ FIXED: Add all missing properties that DashboardOverview expects
const initialDashboardData: DashboardData = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  newCustomers: 0,
  activeStores: 0,
  recentOrders: [],
  topProducts: [],
  gmvProcessed: 0,
  salesData: [],
  customerSegments: [],
  uptime: '',
  globalReach: ''
};

const initialProducts: Product[] = [];

function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if we're in the browser
        if (typeof window === 'undefined') {
          return;
        }

        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = localStorage.getItem("user");
        
        if (!isLoggedIn) {
          router.push("/Login");
          return;
        }
        
        setIsAuthenticated(true);
        
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (error) {
            console.error("Error parsing user data:", error);
            setUser(null);
          }
        }
        
        // Load or initialize dashboard data
        const savedDashboardData = localStorage.getItem("dashboardData");
        if (savedDashboardData) {
          try {
            const parsed = JSON.parse(savedDashboardData);
            // ✅ FIXED: Ensure all required properties exist with defaults
            const completeData = { ...initialDashboardData, ...parsed };
            setDashboardData(completeData);
          } catch (error) {
            console.error("Error parsing dashboard data:", error);
            setDashboardData(initialDashboardData);
            localStorage.setItem("dashboardData", JSON.stringify(initialDashboardData));
          }
        } else {
          // Initialize with default data for new user
          localStorage.setItem("dashboardData", JSON.stringify(initialDashboardData));
          setDashboardData(initialDashboardData);
        }
        
        // Load or initialize products
        const savedProducts = localStorage.getItem("products");
        if (savedProducts) {
          try {
            setProducts(JSON.parse(savedProducts));
          } catch (error) {
            console.error("Error parsing products data:", error);
            setProducts(initialProducts);
            localStorage.setItem("products", JSON.stringify(initialProducts));
          }
        } else {
          localStorage.setItem("products", JSON.stringify(initialProducts));
          setProducts(initialProducts);
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [router]);

  // Save dashboard data to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("dashboardData", JSON.stringify(dashboardData));
      } catch (error) {
        console.error("Error saving dashboard data:", error);
      }
    }
  }, [dashboardData, isAuthenticated]);

  // Save products data to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("products", JSON.stringify(products));
      } catch (error) {
        console.error("Error saving products data:", error);
      }
    }
  }, [products, isAuthenticated]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return React.createElement(DashboardOverview as any, { data: dashboardData });
      case 'products':
        return <ProductManagement products={products} setProducts={setProducts} />;
      case 'orders':
        return <OrdersManagement />;
      case 'Automation':
        return <Automation />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return React.createElement(DashboardOverview as any, { data: dashboardData });
    }
  };

  const handleNavClick = (section: string) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authToken"); // ✅ Also remove auth token
        localStorage.removeItem("dashboardData");
        localStorage.removeItem("products");
        
        // Trigger auth state change event
        window.dispatchEvent(new Event('authStateChange'));
      }
      
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      router.push("/");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard content if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-64 p-6 shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold text-indigo-700">StoreForge</h1>
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* User info */}
        <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
          <div className="text-sm font-medium text-indigo-700">Welcome back!</div>
          <div className="text-xs text-indigo-600">{user?.name || user?.email || 'User'}</div>
        </div>
        
        <nav>
          <ul>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <Home size={20} className="mr-3" /> Dashboard
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('orders')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'orders' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <ShoppingCart size={20} className="mr-3" /> Orders
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('products')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'products' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <Package size={20} className="mr-3" /> Products
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('Automation')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'customers' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <Users size={20} className="mr-3" /> Alert and Automation
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'analytics' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <BarChart2 size={20} className="mr-3" /> Analytics
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center text-gray-700 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 ${activeSection === 'settings' ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <Settings size={20} className="mr-3" /> Settings
              </button>
            </li>
          </ul>
        </nav>
        
        {/* Logout button at the bottom of the sidebar */}
        <div className="absolute bottom-6 left-0 w-full px-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center text-gray-700 hover:text-red-600 font-medium p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut size={20} className="mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header for the main content area */}
        <header className="bg-white p-4 shadow-sm flex items-center justify-between lg:justify-start">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          
          {/* Welcome message */}
          <div className="hidden lg:block ml-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
            <p className="text-sm text-gray-600">
              Welcome back, {user?.name || user?.email || 'User'}
            </p>
          </div>
        </header>
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;