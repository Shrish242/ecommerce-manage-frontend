import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  ShoppingCart, DollarSign, UserPlus, CreditCard, Award,
  Activity, Repeat, Truck, AlertTriangle, Package, Users
} from 'lucide-react';

// Type definitions
interface SalesDataPoint {
  name: string;
  sales: number;
}

interface Product {
  id: string;
  name: string;
  sales?: number;
  category?: string;
  revenue?: number;
  stockLow?: boolean;
  stock?: number;
}

interface Order {
  id: string;
  customer: string;
  total?: number;
  status?: string;
  date: string;
}

interface CustomerSegment {
  name: string;
  value: number;
}

interface DashboardData {
  totalRevenue?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  newCustomers?: number;
  uniqueVisitors?: number;
  sessions?: number;
  returningCustomers?: number;
  totalCustomers?: number;
  avgOrdersPerCustomer?: number;
  refundedOrders?: number;
  refundedAmount?: number;
  cartsCreated?: number;
  cartsCompleted?: number;
  cartAbandonmentRate?: number;
  inventoryLowCount?: number;
  avgDaysToShip?: number;
  nps?: number;
  uptime?: string;
  activeStores?: number;
  gmvProcessed?: number;
  salesData?: SalesDataPoint[];
  topProducts?: Product[];
  recentOrders?: Order[];
  customerSegments?: CustomerSegment[];
  revenuePeriod?: string;
  ordersPeriod?: string;
  salesPeriod?: string;
}

// Helper functions
const formatCurrency = (v?: number) => {
  if (v == null) return '$0';
  return `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatShortCurrency = (v?: number) => {
  if (!v && v !== 0) return '$0';
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v}`;
};

const formatPercent = (v?: number, digits = 2) => {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
};

const safeDivide = (num?: number, den?: number) => {
  if (!num && num !== 0) return undefined;
  if (!den && den !== 0) return undefined;
  if (den === 0) return undefined;
  return num! / den!;
};

// Components
const MetricCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
}> = ({ title, value, subtitle, icon }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
    <div className="ml-4 opacity-90">{icon}</div>
  </div>
);

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const base = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
  if (status === 'Delivered') return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
  if (status === 'Pending') return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status}</span>;
  if (status === 'Cancelled') return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
  if (status === 'Paid') return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
  if (status === 'Unpaid') return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status}</span>;
  if (status === 'Refunded') return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
  return <span className={`${base} bg-gray-100 text-gray-800`}>{status ?? 'Unknown'}</span>;
};

// Main component
const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://70.153.25.251:3001/api';

  // Helper to get auth token (matches your OrdersTrackingDashboard pattern)
  const getAuthToken = (): string | null => {
    try {
      return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwtToken") ||
        localStorage.getItem("auth") ||
        localStorage.getItem("session") ||
        null
      );
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token using the same method as OrdersTrackingDashboard
      const token = getAuthToken();
      
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch products and orders in parallel
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers }),
        fetch(`${API_BASE}/orders`, { headers })
      ]);

      if (!productsRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const products = await productsRes.json();
      const orders = await ordersRes.json();

      // Process data
      const processedData = processBackendData(products, orders);
      setData(processedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processBackendData = (products: any[], orders: any[]): DashboardData => {
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get unique customers
    const uniqueCustomers = new Set(orders.map(o => o.customerName));
    const totalCustomers = uniqueCustomers.size;

    // Calculate revenue by month (last 12 months)
    const salesByMonth: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
      if (order.orderDate) {
        const date = new Date(order.orderDate);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + Number(order.totalAmount || 0);
      }
    });

    const salesData: SalesDataPoint[] = Object.entries(salesByMonth)
      .slice(-12)
      .map(([name, sales]) => ({ name, sales }));

    // Top products by revenue
    const productRevenue = new Map<number, { product: any; revenue: number; sales: number }>();
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const existing = productRevenue.get(item.productId) || { 
            product: products.find(p => p.id === item.productId),
            revenue: 0,
            sales: 0
          };
          existing.revenue += Number(item.totalPrice || 0);
          existing.sales += Number(item.quantity || 0);
          productRevenue.set(item.productId, existing);
        });
      }
    });

    const topProducts: Product[] = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(({ product, revenue, sales }) => ({
        id: product?.id?.toString() || '',
        name: product?.name || 'Unknown Product',
        sales,
        category: 'Product',
        revenue,
        stockLow: (product?.stock || 0) < 10,
        stock: product?.stock || 0
      }));

    // Recent orders (last 5)
    const recentOrders: Order[] = orders
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id?.toString() || '',
        customer: order.customerName || 'Unknown',
        total: Number(order.totalAmount || 0),
        status: order.orderStatus || 'Unknown',
        date: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'
      }));

    // Customer segments by order status
    const statusCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      const status = order.orderStatus || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const customerSegments: CustomerSegment[] = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }));

    // Payment metrics
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;
    const refundedOrders = orders.filter(o => o.paymentStatus === 'Refunded').length;
    const refundedAmount = orders
      .filter(o => o.paymentStatus === 'Refunded')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Inventory metrics
    const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;

    // Delivery time calculation
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered' && o.orderDate && o.deliveryDate);
    const avgDaysToShip = deliveredOrders.length > 0
      ? deliveredOrders.reduce((sum, o) => {
          const orderDate = new Date(o.orderDate);
          const deliveryDate = new Date(o.deliveryDate);
          const days = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / deliveredOrders.length
      : undefined;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: avgOrderValue,
      newCustomers: totalCustomers,
      totalCustomers,
      refundedOrders,
      refundedAmount,
      inventoryLowCount: lowStockCount,
      avgDaysToShip: avgDaysToShip ? Math.round(avgDaysToShip * 10) / 10 : undefined,
      salesData,
      topProducts,
      recentOrders,
      customerSegments,
      revenuePeriod: 'All time',
      ordersPeriod: 'All time',
      salesPeriod: 'Monthly',
      activeStores: 1,
      gmvProcessed: totalRevenue,
      uptime: '99.9%'
    };
  };

  // Computed metrics
  const totalRevenue = data?.totalRevenue ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const avgOrderValue = data?.averageOrderValue ?? 0;
  const newCustomers = data?.newCustomers ?? 0;

  const conversionRate = safeDivide(totalOrders, data?.uniqueVisitors);
  const repeatPurchaseRate = safeDivide(data?.returningCustomers, data?.totalCustomers);
  const customerLTV = data?.avgOrdersPerCustomer ? avgOrderValue * data.avgOrdersPerCustomer : undefined;
  const refundRate = safeDivide(data?.refundedOrders, totalOrders);
  const cartAbandonment = data?.cartAbandonmentRate;
  const lowStockCount = data?.inventoryLowCount;
  const ordersPerCustomer = safeDivide(totalOrders, data?.totalCustomers);
  const avgDaysToShip = data?.avgDaysToShip;

  if (loading) {
    return (
      <main className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Dashboard</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const salesData = data?.salesData ?? [];
  const topProducts = data?.topProducts ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const customerSegments = data?.customerSegments ?? [];

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="space-x-2">
          <button className="px-3 py-2 bg-white rounded-md border text-sm">Export</button>
          <button 
            onClick={fetchDashboardData}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={<span>{formatCurrency(totalRevenue)}</span>}
          subtitle={data?.revenuePeriod ? `Period: ${data.revenuePeriod}` : undefined}
          icon={<DollarSign size={36} className="text-emerald-500" />}
        />

        <MetricCard
          title="Total Orders"
          value={<span>{(totalOrders ?? 0).toLocaleString()}</span>}
          subtitle={data?.ordersPeriod ? `Period: ${data.ordersPeriod}` : undefined}
          icon={<ShoppingCart size={36} className="text-indigo-500" />}
        />

        <MetricCard
          title="Avg Order Value"
          value={<span>{formatCurrency(avgOrderValue)}</span>}
          subtitle="Per transaction"
          icon={<CreditCard size={36} className="text-purple-500" />}
        />

        <MetricCard
          title="Total Customers"
          value={<span>{(newCustomers ?? 0).toLocaleString()}</span>}
          subtitle="Unique customers"
          icon={<Users size={36} className="text-yellow-500" />}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Refund Rate"
          value={<span>{refundRate == null ? '—' : formatPercent(refundRate)}</span>}
          subtitle={data?.refundedOrders ? `${data.refundedOrders} refunded orders` : 'No refunds'}
          icon={<AlertTriangle size={36} className="text-rose-500" />}
        />

        <MetricCard
          title="Low Stock Items"
          value={<span>{lowStockCount ?? 0}</span>}
          subtitle="Items below threshold"
          icon={<Package size={36} className="text-orange-500" />}
        />

        <MetricCard
          title="Avg Days to Ship"
          value={<span>{avgDaysToShip == null ? '—' : `${avgDaysToShip} days`}</span>}
          subtitle="Delivery time"
          icon={<Truck size={36} className="text-blue-500" />}
        />

        <MetricCard
          title="Orders per Customer"
          value={<span>{ordersPerCustomer == null ? '—' : ordersPerCustomer.toFixed(2)}</span>}
          subtitle="Average frequency"
          icon={<Repeat size={36} className="text-teal-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Trends */}
        <section className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Sales Trends</h3>
            <div className="text-sm text-gray-400">{data?.salesPeriod || 'Monthly'}</div>
          </div>

          {salesData.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No sales data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => `Period: ${label}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}
                />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Top Products */}
        <aside className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top 5 Products</h3>

          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No products to show</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topProducts.map((p) => (
                <li key={p.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-500">
                      {(p.sales ?? 0).toLocaleString()} sold • Stock: {p.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-700">{formatCurrency(p.revenue ?? 0)}</div>
                    {p.stockLow && <div className="text-xs text-rose-500">Low stock</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h3>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No recent orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">#{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={order.status ?? 'Unknown'} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Order Status Distribution */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Status Distribution</h3>

          {customerSegments.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No order data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerSegments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()} orders`} 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }} 
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="text-sm">
              <div className="text-xs text-gray-500">Total Products</div>
              <div className="mt-1 font-semibold text-gray-900">{topProducts.length > 0 ? '—' : '0'}</div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">GMV Processed</div>
              <div className="mt-1 font-semibold text-gray-900">{formatShortCurrency(data?.gmvProcessed)}</div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">Active Stores</div>
              <div className="mt-1 font-semibold text-gray-900">{data?.activeStores ?? 1}</div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">Uptime</div>
              <div className="mt-1 font-semibold text-gray-900">{data?.uptime ?? '—'}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardOverview;