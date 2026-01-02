import React, { useState, useEffect } from 'react';
import {
  Home, ShoppingCart, Users, Package, BarChart2, Settings, LogOut, Menu, X, Sparkles
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

  useEffect(() => {
    const checkAuth = () => {
      try {
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
        
        const savedDashboardData = localStorage.getItem("dashboardData");
        if (savedDashboardData) {
          try {
            const parsed = JSON.parse(savedDashboardData);
            const completeData = { ...initialDashboardData, ...parsed };
            setDashboardData(completeData);
          } catch (error) {
            console.error("Error parsing dashboard data:", error);
            setDashboardData(initialDashboardData);
            localStorage.setItem("dashboardData", JSON.stringify(initialDashboardData));
          }
        } else {
          localStorage.setItem("dashboardData", JSON.stringify(initialDashboardData));
          setDashboardData(initialDashboardData);
        }
        
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

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      try {
        localStorage.setItem("dashboardData", JSON.stringify(dashboardData));
      } catch (error) {
        console.error("Error saving dashboard data:", error);
      }
    }
  }, [dashboardData, isAuthenticated]);

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
        localStorage.removeItem("authToken");
        localStorage.removeItem("dashboardData");
        localStorage.removeItem("products");
        
        window.dispatchEvent(new Event('authStateChange'));
      }
      
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row pt-16">
      {/* Sidebar */}
      <aside className={`fixed top-16 bottom-0 left-0 bg-white dark:bg-slate-900 w-64 border-r border-slate-200 dark:border-slate-800 shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:top-0 lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          </div>
          <button
            className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* User info */}
        <div className="p-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Welcome back!</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">{user?.name || user?.email || 'User'}</div>
          </div>
        </div>
        
        <nav className="px-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'dashboard' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <Home size={20} className="mr-3" /> Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('orders')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'orders' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <ShoppingCart size={20} className="mr-3" /> Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('products')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'products' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <Package size={20} className="mr-3" /> Products
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('Automation')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'Automation' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <Users size={20} className="mr-3" /> Alert and Automation
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'analytics' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <BarChart2 size={20} className="mr-3" /> Analytics
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 ${activeSection === 'settings' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900' : ''}`}
              >
                <Settings size={20} className="mr-3" /> Settings
              </button>
            </li>
          </ul>
        </nav>
        
        {/* Logout button at the bottom of the sidebar */}
        <div className="absolute bottom-6 left-0 w-full px-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200"
          >
            <LogOut size={20} className="mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button - Fixed at top */}
      <button
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Removed dashboard header to avoid clash with main navbar */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;