// components/Analytics.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Activity,
  Target,
  Award,
} from "lucide-react";

// client-side env module (kept in components/ per your request)
import { NEXT_PUBLIC_API_URL } from "./clientEnv";

/**
 * Analytics component with automated business intelligence.
 * Suggestions are generated using built-in business rules and heuristics
 * from your orders and products data - no external AI services required.
 */

const API_BASE = NEXT_PUBLIC_API_URL || "http://70.153.25.251:3001";

// Types
interface Product {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  ordersReceived?: number;
}
interface Order {
  id: number;
  totalAmount: number | string;
  orderStatus: "Pending" | "Delivered" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid" | "Refunded";
  createdAt: string;
}
interface Insights {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  warnings: string[];
}

// Exponential-backoff fetch helper
const backoffFetch = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      const errText = await res.text();
      throw new Error(`API Error ${res.status}: ${errText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error("Failed after retries");
};

const Analytics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30days");
  const [error, setError] = useState<string | null>(null);

  // Fetch orders & products from your backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token not found.");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const [ordersRes, productsRes] = await Promise.all([
        backoffFetch(`${API_BASE}/api/orders`, { headers }),
        backoffFetch(`${API_BASE}/api/products`, { headers }),
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      setOrders(ordersData.map((o: any) => ({ ...o, totalAmount: Number(o.totalAmount) })));
      setProducts(
        productsData.map((p: any) => ({
          ...p,
          price: Number(p.price),
          stock: p.stock ?? 0,
          ordersReceived: p.ordersReceived ?? 0,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to fetch analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Business intelligence engine - analyzes data and generates insights
  const computeRevenueChangeLast7 = (orders: Order[]) => {
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    const getRangeSum = (fromDaysAgo: number, toDaysAgo: number) => {
      const from = new Date(today.getTime() - toDaysAgo * dayMs);
      const to = new Date(today.getTime() - fromDaysAgo * dayMs);
      return orders
        .filter((o) => {
          if (!o.createdAt) return false;
          const d = new Date(o.createdAt);
          return d >= from && d <= to;
        })
        .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    };
    const last7 = getRangeSum(0, 7);
    const prev7 = getRangeSum(7, 14);
    const pct = prev7 === 0 ? (last7 === 0 ? 0 : 100) : ((last7 - prev7) / Math.abs(prev7)) * 100;
    return { last7, prev7, pctChange: Number(pct.toFixed(2)) };
  };

  const generateLocalInsights = (orders: Order[], products: Product[]): Insights => {
    if (!orders || !products || products.length === 0) {
      return {
        summary: "Not enough data to generate insights.",
        keyInsights: [],
        recommendations: ["Collect more sales and product data to enable automated suggestions."],
        warnings: [],
      };
    }

    // Basic metrics
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lowStock = products.filter((p) => (p.stock ?? 0) < 10);
    const topProducts = products
      .slice()
      .sort((a, b) => (b.ordersReceived || 0) - (a.ordersReceived || 0))
      .slice(0, 5);
    const topRevenue = topProducts.reduce((s, p) => s + (Number(p.price || 0) * (p.ordersReceived || 0)), 0);
    const productRevenueTotal = products.reduce((s, p) => s + Number(p.price || 0) * (p.ordersReceived || 0), 0) || 1;
    const topSharePct = Number(((topRevenue / productRevenueTotal) * 100).toFixed(1));
    const unpaid = orders.filter((o) => o.paymentStatus === "Unpaid").length;
    const pending = orders.filter((o) => o.orderStatus === "Pending").length;
    const recentRevenue = computeRevenueChangeLast7(orders);

    // Build insights
    const insights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    insights.push(`Total revenue ${totalRevenue ? `$${totalRevenue.toFixed(2)}` : "$0.00"} across ${totalOrders} orders.`);
    insights.push(`Average order value is $${avgOrderValue.toFixed(2)}.`);

    if (topProducts.length > 0) {
      insights.push(`Top products by orders: ${topProducts.map((p) => p.name).join(", ")}.`);
      insights.push(`Top 5 products account for ~${topSharePct}% of product-revenue (estimated).`);
    }

    // Revenue trend insight
    if (recentRevenue.pctChange > 10) {
      insights.push(`Revenue increased by ${recentRevenue.pctChange}% over the last 7 days vs previous 7.`);
      recommendations.push("Consider increasing inventory for high-demand SKUs and scale marketing budget for top performers.");
    } else if (recentRevenue.pctChange < -10) {
      insights.push(`Revenue dropped by ${Math.abs(recentRevenue.pctChange)}% over the last 7 days vs previous 7.`);
      warnings.push("Recent revenue decline detected. Investigate stock, site errors, or ad performance.");
      recommendations.push("Run a quick promotion to recover traffic and review fulfillment delays.");
    } else {
      insights.push(`Revenue change week-over-week is ${recentRevenue.pctChange}% — relatively stable.`);
    }

    // Low stock / inventory suggestions
    if (lowStock.length > 0) {
      warnings.push(`${lowStock.length} products are critically low in stock (below 10 units).`);
      recommendations.push(
        `Restock the top ${Math.min(5, lowStock.length)} low-stock items immediately to avoid lost sales: ${lowStock
          .slice(0, 5)
          .map((p) => `${p.name} (stock ${p.stock})`)
          .join(", ")}.`
      );
    } else {
      insights.push("Inventory levels appear healthy for most SKUs.");
    }

    // Payment / fulfillment suggestions
    if (unpaid > 0) {
      warnings.push(`${unpaid} unpaid orders detected.`);
      recommendations.push(
        `Follow up on unpaid orders: send automated reminders and consider a 48-hour hold policy before cancellation if unpaid.`
      );
    }
    if (pending > 10) {
      warnings.push(`${pending} orders pending fulfillment — backlog risk.`);
      recommendations.push("If pending orders remain high, allocate more staff or speed up fulfillment pipeline for at-risk SKUs.");
    }

    // Concentration risk & product strategy
    if (topSharePct > 60) {
      warnings.push("Revenue concentration risk: a few SKUs drive most revenue.");
      recommendations.push(
        "Diversify inventory focus: promote mid-performing SKUs with targeted discounts and consider bundling top sellers with slower movers."
      );
    } else if (topSharePct < 30 && totalOrders > 50) {
      insights.push("Revenue is well distributed across products — strong product breadth.");
      recommendations.push("Focus on improving AOV with bundles and cross-sells to increase revenue without heavy acquisition costs.");
    }

    // Pricing and promo suggestions
    if (avgOrderValue < 50) {
      recommendations.push("Consider upsell and cross-sell flows at checkout (related products, bundles) to raise average order value.");
    } else if (avgOrderValue > 150) {
      recommendations.push("Consider loyalty incentives or subscription offers to increase repeat purchase frequency.");
    }

    // Quick marketing plays
    if (totalOrders > 0) {
      recommendations.push(
        `Top quick-win marketing plays: 1) SMS/Email retargeting for carts and repeat buyers; 2) Launch a 48-hour flash sale for slow-moving inventory; 3) Boost top performing ads for highest ROI SKUs.`
      );
    }

    // Operational suggestions
    recommendations.push("Add a daily 10-minute operations check: unpaid orders, pending queue, and top 5 low-stock alerts.");

    // Final summary
    const summaryParts = [
      `Revenue ${totalRevenue ? `$${totalRevenue.toFixed(2)}` : "$0.00"} • AOV $${avgOrderValue.toFixed(2)}`,
      `${lowStock.length} low-stock SKUs`,
      `${unpaid} unpaid orders • ${pending} pending`,
      `7d revenue change ${recentRevenue.pctChange}%`,
    ];
    const summary = summaryParts.join(" • ");

    // Deduplicate trivial recommendations/warnings and trim
    const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 10);
    const uniqueWarnings = Array.from(new Set(warnings)).slice(0, 10);

    return {
      summary,
      keyInsights: insights.slice(0, 8),
      recommendations: uniqueRecommendations,
      warnings: uniqueWarnings,
    };
  };

  // Generate business insights and recommendations
  const generateSuggestions = async () => {
    setLoadingInsights(true);
    setInsights(null);
    setError(null);
    try {
      // Simulate brief analysis time for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));
      const suggestions = generateLocalInsights(orders, products);
      setInsights(suggestions);
    } catch (err: any) {
      console.error("Insights generation error:", err);
      setError("Failed to generate insights.");
    } finally {
      setLoadingInsights(false);
    }
  };

  // Derived metrics
  const {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    pendingOrders,
    lowStockProducts,
    revenueData,
    orderStatusData,
    topProducts,
  } = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders.filter((o) => o.orderStatus === "Pending").length;
    const lowStockProducts = products.filter((p) => (p.stock || 0) < 10);

    const getOrderTrend = () => {
      const last30: { date: string; orders: number; revenue: number }[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayOrders = orders.filter((o) => {
          if (!o.createdAt) return false;
          return new Date(o.createdAt).toISOString().split("T")[0] === dateStr;
        });
        last30.push({
          date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
        });
      }
      return last30;
    };

    const revenueData = getOrderTrend();
    const orderStatusData = [
      { name: "Delivered", value: orders.filter((o) => o.orderStatus === "Delivered").length, color: "#10b981" },
      { name: "Pending", value: orders.filter((o) => o.orderStatus === "Pending").length, color: "#f59e0b" },
      { name: "Cancelled", value: orders.filter((o) => o.orderStatus === "Cancelled").length, color: "#ef4444" },
    ];

    const topProducts = products
      .slice()
      .sort((a, b) => (b.ordersReceived || 0) - (a.ordersReceived || 0))
      .slice(0, 5)
      .map((p) => ({ name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name, orders: p.ordersReceived || 0, revenue: (p.ordersReceived || 0) * Number(p.price) }));

    return { totalRevenue, totalOrders, avgOrderValue, pendingOrders, lowStockProducts, revenueData, orderStatusData, topProducts };
  }, [orders, products]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header + Controls */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights for the last 30 days with automated business intelligence.</p>
          </div>
          <div className="flex gap-3">
            <select value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl">
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>

            <button onClick={generateSuggestions} disabled={loadingInsights} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl disabled:opacity-50">
              {loadingInsights ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              {loadingInsights ? "Analyzing..." : "Analyze Business"}
            </button>

            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl">
              <RefreshCw className="w-5 h-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Business Intelligence Insights */}
        {insights && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4 border-b border-white/20 pb-4">
              <Sparkles className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Business Intelligence</h2>
              <p className="text-sm italic ml-auto">{insights.summary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-200"><Target className="w-5 h-5" /> Key Performance</h3>
                <ul className="space-y-2">{insights.keyInsights.map((ins, i) => <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 mt-0.5" /><span>{ins}</span></li>)}</ul>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-200"><Award className="w-5 h-5" /> Actionable Growth</h3>
                <ul className="space-y-2">{insights.recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 mt-0.5" /><span>{rec}</span></li>)}</ul>
              </div>

              {insights.warnings && insights.warnings.length > 0 && (
                <div className="bg-red-500/20 backdrop-blur rounded-xl p-4 border border-red-300">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-200"><AlertCircle className="w-5 h-5" /> Attention Required</h3>
                  <ul className="space-y-2">{insights.warnings.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm"><AlertCircle className="w-4 h-4 mt-0.5" /><span>{w}</span></li>)}</ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4"><div className="p-3 bg-green-100 rounded-full"><DollarSign className="w-6 h-6 text-green-600" /></div><TrendingUp className="w-5 h-5 text-green-500" /></div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">from all time</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4"><div className="p-3 bg-blue-100 rounded-full"><ShoppingCart className="w-6 h-6 text-blue-600" /></div><Activity className="w-5 h-5 text-blue-500" /></div>
            <p className="text-gray-600 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-sm text-blue-600 mt-2">{pendingOrders} pending</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4"><div className="p-3 bg-purple-100 rounded-full"><Users className="w-6 h-6 text-purple-600" /></div><TrendingUp className="w-5 h-5 text-purple-500" /></div>
            <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">current average</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4"><div className="p-3 bg-orange-100 rounded-full"><Package className="w-6 h-6 text-orange-600" /></div>{lowStockProducts.length > 0 && <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />}</div>
            <p className="text-gray-600 text-sm mb-1">Low Stock Alert</p>
            <p className="text-3xl font-bold text-gray-900">{lowStockProducts.length}</p>
            <p className="text-sm text-orange-600 mt-2">Products need restocking</p>
          </div>
        </div>

        {/* Charts & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend ({selectedTimeRange})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" angle={-15} textAnchor="end" height={50} tick={{ fontSize: 10 }} />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" labelLine={false}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {orderStatusData.map((status) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm text-gray-600 font-medium">{status.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Performing Products (Orders)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" />
              <XAxis type="number" stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} formatter={(value, name) => [name === "revenue" ? `$${Number(value).toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]} />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Orders Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-900">Critical Low Stock Alert</h3>
              <span className="ml-auto text-red-600 font-semibold">{lowStockProducts.length} items risk stockout</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lowStockProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="bg-white rounded-lg p-4 border border-red-100 transition-shadow hover:shadow-lg">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Stock: <span className="font-bold text-red-600">{product.stock}</span>
                  </p>
                  <p className="text-xs text-gray-500">Last Orders: {product.ordersReceived || 0}</p>
                </div>
              ))}
              {lowStockProducts.length > 8 && <div className="p-4 text-center text-sm text-gray-600 self-center">... and {lowStockProducts.length - 8} more</div>}
            </div>
          </div>
        )}

        {error && <div className="mt-6 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default Analytics;


