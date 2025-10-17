import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, AlertCircle, Brain, Sparkles, RefreshCw, ChevronRight, Activity, Target, Award } from 'lucide-react';

// --- Global Configuration and Types ---

// Placeholder base URL for fetching orders/products. Replace with your actual backend URL.
const API_BASE = "http://localhost:3001";

// Gemini API configuration
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// TypeScript Interfaces inferred from component usage
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
    orderStatus: 'Pending' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Unpaid' | 'Paid' | 'Refunded';
    createdAt: string; // Assuming an ISO date string
}

interface Insights {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    warnings: string[];
}

// JSON Schema for structured AI response
const INSIGHTS_SCHEMA = {
    type: "OBJECT",
    properties: {
        summary: { type: "STRING", description: "A one-sentence overview of the analysis." },
        keyInsights: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "3-4 main performance takeaways."
        },
        criticalIssues: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2-3 urgent problems like high cancellations or payment issues."
        },
        growthOpportunities: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "3-4 actionable recommendations for market or product growth."
        },
        revenueStrategies: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2-3 strategies for optimizing pricing or average order value."
        },
        inventoryRecommendations: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Specific advice on stocking, based on low stock alerts."
        }
    },
    required: ["summary", "keyInsights", "criticalIssues", "growthOpportunities", "inventoryRecommendations"]
};

// --- Helper Functions ---

// Function to handle API calls with exponential backoff for robustness
const backoffFetch = async (url: string, options: RequestInit, retries: number = 3): Promise<Response> => {
    const apiKey = ""; // Canvas platform will inject the key
    const fullUrl = url.includes('generativelanguage.googleapis.com') ? `${url}?key=${apiKey}` : url;
    
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(fullUrl, options);
            if (res.ok) return res;

            // For rate limits or temporary server errors (5xx), we retry
            if (res.status === 429 || res.status >= 500) {
                console.warn(`Attempt ${i + 1} failed with status ${res.status}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                continue; 
            }
            
            // For permanent errors (4xx), throw immediately
            const errorText = await res.text();
            throw new Error(`API Error ${res.status}: ${errorText}`);

        } catch (error) {
            if (
                i === retries - 1 ||
                (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('API Error'))
            ) {
                throw error;
            }
            console.error(`Attempt ${i + 1} failed due to network/fetch error. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error("Failed to fetch after multiple retries.");
};


const Analytics = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState<Insights | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
    const [error, setError] = useState<string | null>(null);


    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setAiInsights(null); // Clear previous insights

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found.');
            }
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Use the backoffFetch helper for all data fetching
            const [ordersRes, productsRes] = await Promise.all([
                backoffFetch(`${API_BASE}/api/orders`, { headers }),
                backoffFetch(`${API_BASE}/api/products`, { headers })
            ]);

            const ordersData: Order[] = await ordersRes.json();
            const productsData: Product[] = await productsRes.json();

            // Ensure numeric fields are converted
            const parsedOrders = ordersData.map(o => ({
                ...o,
                totalAmount: Number(o.totalAmount),
            }));

            const parsedProducts = productsData.map(p => ({
                ...p,
                price: Number(p.price),
                stock: p.stock ?? 0, // Fallback for stock if missing
                ordersReceived: p.ordersReceived ?? 0, // Fallback if missing
            }));

            setOrders(parsedOrders);
            setProducts(parsedProducts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Function to reliably parse the structured JSON output from the LLM
    const parseAIResponse = (responseText: string | null): Insights | null => {
        if (!responseText) return null;
        try {
            const json = JSON.parse(responseText.trim());
            
            // Combine related lists for simpler UI display
            const recommendations = (json.growthOpportunities || []).concat(json.revenueStrategies || []);
            const warnings = (json.criticalIssues || []).concat(json.inventoryRecommendations || []);

            return {
                summary: json.summary || "Analysis complete.",
                keyInsights: json.keyInsights || [],
                recommendations: recommendations,
                warnings: warnings
            };
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", e);
            return null; 
        }
    };

    const generateFallbackInsights = (data: any): Insights => ({
        summary: "Could not connect to AI. Analysis based on core metrics.",
        keyInsights: [
            `Average order value of $${data.averageOrderValue.toFixed(2)} indicates ${data.averageOrderValue > 100 ? 'strong' : 'moderate'} customer spending.`,
            `${data.orderStatusBreakdown.delivered} delivered orders show ${data.orderStatusBreakdown.delivered > data.orderStatusBreakdown.pending ? 'efficient' : 'improving'} fulfillment.`,
            `${data.lowStockProducts} products need restocking soon.`
        ],
        recommendations: [
            data.lowStockProducts > 0 ? "Restock low inventory items immediately to avoid lost sales." : "Maintain current inventory levels.",
            data.orderStatusBreakdown.pending > 5 ? "Review and accelerate processing for pending orders." : "Continue efficient order processing."
        ],
        warnings: data.lowStockProducts > 0 || data.paymentStatusBreakdown.unpaid > 0
            ? [
                ...(data.lowStockProducts > 0 ? [`${data.lowStockProducts} products at risk of stockout.`] : []),
                ...(data.paymentStatusBreakdown.unpaid > 0 ? [`High risk of bad debt from unpaid orders.`] : [])
            ]
            : []
    });

    const generateAIInsights = async () => {
        setLoadingInsights(true);
        setAiInsights(null);

        // 1. Prepare analytics summary for Gemini
        const analyticsData = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) / orders.length : 0,
            totalProducts: products.length,
            lowStockProducts: products.filter(p => (p.stock || 0) < 10).length,
            topSellingProducts: products.sort((a, b) => (b.ordersReceived || 0) - (a.ordersReceived || 0)).slice(0, 3).map(p => ({
                name: p.name,
                orders: p.ordersReceived,
                revenue: (p.ordersReceived || 0) * Number(p.price)
            })),
            orderStatusBreakdown: {
                delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
                pending: orders.filter(o => o.orderStatus === 'Pending').length,
                cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length
            },
            paymentStatusBreakdown: {
                paid: orders.filter(o => o.paymentStatus === 'Paid').length,
                unpaid: orders.filter(o => o.paymentStatus === 'Unpaid').length,
                refunded: orders.filter(o => o.paymentStatus === 'Refunded').length
            },
        };

        const prompt = `
            Act as a seasoned business analyst. Analyze the following e-commerce data and provide actionable, structured insights in the required JSON format. Focus on identifying performance drivers and mitigating risks.

            --- DATA SUMMARY ---
            - Total Orders: ${analyticsData.totalOrders}
            - Total Revenue: $${analyticsData.totalRevenue.toFixed(2)}
            - Average Order Value: $${analyticsData.averageOrderValue.toFixed(2)}
            - Total Products: ${analyticsData.totalProducts}
            - Low Stock Products: ${analyticsData.lowStockProducts}
            
            Order Status: Delivered: ${analyticsData.orderStatusBreakdown.delivered}, Pending: ${analyticsData.orderStatusBreakdown.pending}, Cancelled: ${analyticsData.orderStatusBreakdown.cancelled}
            Payment Status: Paid: ${analyticsData.paymentStatusBreakdown.paid}, Unpaid: ${analyticsData.paymentStatusBreakdown.unpaid}, Refunded: ${analyticsData.paymentStatusBreakdown.refunded}
            
            Top Products (Name, Orders, Revenue): ${JSON.stringify(analyticsData.topSellingProducts)}
            
            Based on this data, fill in the JSON structure with professional advice.
        `;
        
        try {
            // 2. Configure the payload to request structured JSON output
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: INSIGHTS_SCHEMA,
                }
            };

            // 3. Make the API call with exponential backoff
            const response = await backoffFetch(GEMINI_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            const insights = parseAIResponse(responseText);

            if (insights) {
                setAiInsights(insights);
            } else {
                setAiInsights(generateFallbackInsights(analyticsData));
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            setAiInsights(generateFallbackInsights(analyticsData));
        } finally {
            setLoadingInsights(false);
        }
    };

    // Calculate metrics using useMemo for performance
    const { totalRevenue, totalOrders, avgOrderValue, pendingOrders, lowStockProducts, revenueData, orderStatusData, topProducts } = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;
        const lowStockProducts = products.filter(p => (p.stock || 0) < 10);
        
        // Calculate daily order trend (Last 30 days)
        const getOrderTrend = () => {
            const last30Days = [];
            const today = new Date();
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayOrders = orders.filter(order => {
                    // Check if order.createdAt is a valid date string before splitting
                    if (!order.createdAt) return false;
                    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                    return orderDate === dateStr;
                });
                
                last30Days.push({
                    date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                    orders: dayOrders.length,
                    revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
                });
            }
            return last30Days;
        };

        const revenueData = getOrderTrend();
        
        const orderStatusData = [
            { name: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length, color: '#10b981' },
            { name: 'Pending', value: orders.filter(o => o.orderStatus === 'Pending').length, color: '#f59e0b' },
            { name: 'Cancelled', value: orders.filter(o => o.orderStatus === 'Cancelled').length, color: '#ef4444' }
        ];

        const topProducts = products
            .sort((a, b) => (b.ordersReceived || 0) - (a.ordersReceived || 0))
            .slice(0, 5)
            .map(p => ({
                name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                orders: p.ordersReceived || 0,
                revenue: (p.ordersReceived || 0) * Number(p.price)
            }));
            
        return { totalRevenue, totalOrders, avgOrderValue, pendingOrders, lowStockProducts, revenueData, orderStatusData, topProducts };
    }, [orders, products]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading analytics data...</p>
                    {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header and Controls */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                            <p className="text-gray-600">Comprehensive insights for the last 30 days, powered by AI.</p>
                        </div>
                        <div className="flex gap-3">
                            <select 
                                value={selectedTimeRange}
                                onChange={(e) => setSelectedTimeRange(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                            >
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                            </select>
                            <button 
                                onClick={generateAIInsights}
                                disabled={loadingInsights}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                            >
                                {loadingInsights ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Brain className="w-5 h-5" />
                                )}
                                {loadingInsights ? 'Analyzing...' : 'AI Insights'}
                            </button>
                            <button 
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Insights Panel */}
                {aiInsights && (
                    <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 border-b border-white/20 pb-4">
                            <Sparkles className="w-8 h-8" />
                            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                            <p className="text-sm italic ml-auto">{aiInsights.summary}</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Key Insights */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-200">
                                    <Target className="w-5 h-5" /> Key Performance
                                </h3>
                                <ul className="space-y-2">
                                    {aiInsights.keyInsights.map((insight, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-200">
                                    <Award className="w-5 h-5" /> Actionable Growth
                                </h3>
                                <ul className="space-y-2">
                                    {aiInsights.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Warnings */}
                            {aiInsights.warnings && aiInsights.warnings.length > 0 && (
                                <div className="bg-red-500/20 backdrop-blur rounded-xl p-4 border border-red-300">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-200">
                                        <AlertCircle className="w-5 h-5" /> Attention Required
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiInsights.warnings.map((warning, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-300" />
                                                <span>{warning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-2">from all time</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                        <p className="text-sm text-blue-600 mt-2">{pendingOrders} pending</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
                        <p className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-2">current average</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                            {lowStockProducts.length > 0 && <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Low Stock Alert</p>
                        <p className="text-3xl font-bold text-gray-900">{lowStockProducts.length}</p>
                        <p className="text-sm text-orange-600 mt-2">Products need restocking</p>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trend */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend ({selectedTimeRange})</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#9ca3af" 
                                    angle={-15} 
                                    textAnchor="end" 
                                    height={50}
                                    tick={{fontSize: 10}}
                                />
                                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={2}
                                    fill="url(#colorRevenue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Order Status */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={orderStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    dataKey="value"
                                    labelLine={false}
                                >
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
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                        <span className="text-sm text-gray-600 font-medium">{status.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{status.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Performing Products (Orders)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fontSize: 12}} />
                            <XAxis type="number" stroke="#9ca3af" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                formatter={(value, name) => [
                                    name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                                    name === 'revenue' ? 'Revenue' : 'Orders'
                                ]}
                            />
                            <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Orders Received" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Low Stock Alert */}
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
                                    <p className="text-sm text-gray-600 mt-1">Stock: <span className="font-bold text-red-600">{product.stock}</span></p>
                                    <p className="text-xs text-gray-500">Last Orders: {product.ordersReceived || 0}</p>
                                </div>
                            ))}
                            {lowStockProducts.length > 8 && <div className="p-4 text-center text-sm text-gray-600 self-center">... and {lowStockProducts.length - 8} more</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
