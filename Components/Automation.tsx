import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Package, Settings, TrendingDown, AlertCircle, CheckCircle, Clock, Filter, Plus, X, Edit, Trash2, Play, Pause, ChevronRight, BarChart3, ShoppingCart, AlertTriangle, Activity, Target, Zap, Eye, Calendar, Search, Loader2, RefreshCw } from 'lucide-react';

// --- API Configuration and Types ---
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://70.153.25.251:3001";

type RuleStatus = 'active' | 'paused';
type AlertType = 'warning' | 'error' | 'success' | 'info';
type AlertStatus = 'read' | 'unread';
type CurrentView = 'rules' | 'alerts';

interface Rule {
    id: number;
    name: string;
    trigger: string;
    action: string;
    status: RuleStatus;
    lastRun: string;
}

interface Alert {
    id: number;
    type: AlertType;
    title: string;
    message: string;
    time: string;
    status: AlertStatus;
}

interface NewRuleForm {
    name: string;
    triggerType: 'inventory' | 'time' | 'order' | 'price' | '';
    condition: 'below' | 'above' | 'equals' | '';
    value: string;
    action: string;
}

// --- API Helper Functions ---
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

const apiFetch = async <T,>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) throw new Error("UNAUTHORIZED: Session expired or invalid token.");
    if (!res.ok) {
        try {
            const body = await res.json();
            throw new Error(body?.message || `HTTP ${res.status}`);
        } catch {
            throw new Error(`HTTP ${res.status}`);
        }
    }
    
    // Handle empty responses
    const text = await res.text();
    return text ? JSON.parse(text) : (null as unknown as T);
};

const AutomationDashboard = () => {
    const [currentView, setCurrentView] = useState<CurrentView>('rules');
    const [rules, setRules] = useState<Rule[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [token, setToken] = useState<string | null>(null);

    // Form state for creating a new rule
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState<NewRuleForm>({ name: '', triggerType: '', action: '', condition: '', value: '' });

    // Filter/Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // --- Initialize token on mount ---
    useEffect(() => {
        const t = getAuthToken();
        setToken(t);
    }, []);

    // Keep token in sync with storage events
    useEffect(() => {
        const onStorage = () => {
            setToken(getAuthToken());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // --- Data Fetching Functions ---
    const fetchRules = async () => {
        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) {
            setError("Not authenticated. Please log in.");
            setRules([]);
            return;
        }
        
        setLoadingRules(true);
        setError(null);
        try {
            const data = await apiFetch<Rule[]>(`/api/rules`, effectiveToken);
            setRules(Array.isArray(data) ? data : []);
            console.debug("Rules loaded:", data);
        } catch (err) {
            console.error("Failed to fetch rules", err);
            setError(err instanceof Error ? err.message : "Failed to load rules.");
            setRules([]);
        } finally {
            setLoadingRules(false);
        }
    };

    const fetchAlerts = async () => {
        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) {
            setError("Not authenticated. Please log in.");
            setAlerts([]);
            return;
        }
        
        setLoadingAlerts(true);
        setError(null);
        try {
            const data = await apiFetch<Alert[]>(`/api/alerts`, effectiveToken);
            setAlerts(Array.isArray(data) ? data : []);
            console.debug("Alerts loaded:", data);
        } catch (err) {
            console.error("Failed to fetch alerts", err);
            setError(err instanceof Error ? err.message : "Failed to load alerts.");
            setAlerts([]);
        } finally {
            setLoadingAlerts(false);
        }
    };

    // Fetch data when token becomes available
    useEffect(() => {
        if (token && currentView === 'rules') {
            fetchRules();
        }
    }, [token, currentView]);

    useEffect(() => {
        if (token && currentView === 'alerts') {
            fetchAlerts();
        }
    }, [token, currentView]);

    // --- Rule CRUD Operations ---
    const handleCreateRule = async () => {
        if (!newRule.name || !newRule.triggerType || !newRule.action || 
            (newRule.triggerType === 'inventory' && (!newRule.condition || !newRule.value))) {
            return alert("Please fill in all required fields.");
        }

        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) {
            return alert("Authentication required. Please log in.");
        }

        try {
            setLoadingRules(true);
            
            const triggerSummary = newRule.triggerType === 'inventory' 
                ? `Inventory ${newRule.condition} ${newRule.value} units`
                : newRule.triggerType;

            const payload = {
                name: newRule.name,
                trigger: triggerSummary,
                action: newRule.action,
                status: 'active',
            };

            await apiFetch<Rule>(`/api/rules`, effectiveToken, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setNewRule({ name: '', triggerType: '', action: '', condition: '', value: '' });
            setShowRuleModal(false);
            alert("Rule created successfully!");
            await fetchRules();
        } catch (err) {
            console.error("Create rule failed:", err);
            alert(err instanceof Error ? err.message : "Failed to create rule.");
        } finally {
            setLoadingRules(false);
        }
    };

    const toggleRuleStatus = async (id: number, currentStatus: RuleStatus) => {
        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) return alert("Authentication required.");

        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            await apiFetch(`/api/rules/${id}`, effectiveToken, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            alert(`Rule status updated to ${newStatus}.`);
            fetchRules();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to update rule status.");
        }
    };

    const deleteRule = async (id: number) => {
        if (!window.confirm(`Are you sure you want to delete Rule ID ${id}?`)) return;

        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) return alert("Authentication required.");

        try {
            await apiFetch(`/api/rules/${id}`, effectiveToken, { method: 'DELETE' });
            alert(`Rule ${id} deleted.`);
            fetchRules();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to delete rule.");
        }
    };

    // --- Alert Operations ---
    const markAlertAsRead = async (id: number) => {
        const effectiveToken = token ?? getAuthToken();
        if (!effectiveToken) return;

        try {
            await apiFetch(`/api/alerts/${id}/status`, effectiveToken, {
                method: 'PUT',
                body: JSON.stringify({ status: 'read' })
            });
            fetchAlerts();
        } catch (err) {
            console.error("Failed to mark alert as read:", err);
        }
    };

    // --- Calculations & Filters ---
    const stats = useMemo(() => ({
        totalRules: rules.length,
        activeRules: rules.filter(r => r.status === 'active').length,
        alertsToday: alerts.length,
        actionsExecuted: 156
    }), [rules, alerts]);

    const filteredRules = useMemo(() => 
        rules.filter(rule => 
            rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.trigger.toLowerCase().includes(searchTerm.toLowerCase())
        ), [rules, searchTerm]);

    const filteredAlerts = useMemo(() => 
        alerts.filter(alert => {
            const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 alert.message.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' || alert.type === filterType;
            return matchesSearch && matchesFilter;
        }), [alerts, searchTerm, filterType]);

    // --- View Components ---
    const AutomationRulesView = () => (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-600" /> Automation Rules
                    </h1>
                    <button
                        onClick={() => setShowRuleModal(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 text-white shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Rule</span>
                    </button>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Zap} title="Total Rules" value={stats.totalRules} color="blue" />
                    <StatCard icon={Activity} title="Active Rules" value={stats.activeRules} color="green" />
                    <StatCard icon={Bell} title="Total Alerts" value={stats.alertsToday} color="yellow" />
                    <StatCard icon={Target} title="Actions Executed" value={stats.actionsExecuted} color="purple" />
                </div>

                {/* Rules List */}
                <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Rules Management ({filteredRules.length} found)</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 w-64"
                                placeholder="Search rules..."
                            />
                        </div>
                    </div>
                    
                    {loadingRules ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="ml-3 text-gray-600">Loading rules...</p>
                        </div>
                    ) : error && currentView === 'rules' ? (
                        <div className="text-red-600 text-center bg-red-100 p-4 rounded-lg">{error}</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRules.map((rule) => (
                                <div key={rule.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">{rule.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                                    rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {rule.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="text-gray-500 font-medium">Trigger:</span> {rule.trigger}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 font-medium">Action:</span> {rule.action}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 font-medium">Last Run:</span> {rule.lastRun}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => toggleRuleStatus(rule.id, rule.status)}
                                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                                title={rule.status === 'active' ? 'Pause Rule' : 'Activate Rule'}
                                            >
                                                {rule.status === 'active' ? <Pause className="w-5 h-5 text-yellow-600" /> : <Play className="w-5 h-5 text-green-600" />}
                                            </button>
                                            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="Edit Rule">
                                                <Edit className="w-5 h-5 text-blue-600" />
                                            </button>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="p-2 hover:bg-red-100 text-red-600 rounded-full transition-colors"
                                                title="Delete Rule"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredRules.length === 0 && <p className="text-center text-gray-500 p-8">No rules found matching your criteria.</p>}
                        </div>
                    )}
                </div>
            </div>
            <RuleCreationModal />
        </div>
    );

    const AlertsView = () => (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-purple-600" /> Automation Alerts
                    </h1>
                    <button
                        onClick={fetchAlerts}
                        className="flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors text-gray-800 shadow-sm"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Refresh Alerts</span>
                    </button>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <AlertStatCard icon={AlertTriangle} title="Warnings" value={alerts.filter(a => a.type === 'warning').length} color="yellow" />
                    <AlertStatCard icon={AlertCircle} title="Errors" value={alerts.filter(a => a.type === 'error').length} color="red" />
                    <AlertStatCard icon={CheckCircle} title="Success" value={alerts.filter(a => a.type === 'success').length} color="green" />
                    <AlertStatCard icon={Eye} title="Unread" value={alerts.filter(a => a.status === 'unread').length} color="blue" />
                </div>

                {/* Alerts List Header & Controls */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-700">Recent Alerts ({filteredAlerts.length} found)</h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 w-64"
                                placeholder="Search alerts..."
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                            <option value="all">All Types</option>
                            <option value="warning">Warnings</option>
                            <option value="error">Errors</option>
                            <option value="success">Success</option>
                            <option value="info">Info</option>
                        </select>
                    </div>
                </div>

                {/* Alerts List */}
                {loadingAlerts ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        <p className="ml-3 text-gray-600">Loading alerts...</p>
                    </div>
                ) : error && currentView === 'alerts' ? (
                    <div className="text-red-600 text-center bg-red-100 p-4 rounded-lg">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`bg-white rounded-xl p-6 border transition-all cursor-pointer ${
                                    alert.status === 'unread' ? 'border-blue-400 shadow-md' : 'border-gray-200'
                                } hover:shadow-lg`}
                                onClick={() => alert.status === 'unread' && markAlertAsRead(alert.id)}
                            >
                                <div className="flex items-start space-x-4">
                                    <AlertIcon type={alert.type} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-lg text-gray-900">{alert.title}</h3>
                                            <div className="flex items-center space-x-3">
                                                {alert.status === 'unread' && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread"></span>
                                                )}
                                                <span className="text-sm text-gray-500 flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {alert.time}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600">{alert.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredAlerts.length === 0 && <p className="text-center text-gray-500 p-8">No alerts found matching your criteria.</p>}
                    </div>
                )}
            </div>
        </div>
    );

    // --- Helper Components ---
    const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: number, color: string }) => {
        const colorMap = {
            blue: 'border-blue-500 bg-blue-100 text-blue-600',
            green: 'border-green-500 bg-green-100 text-green-600',
            yellow: 'border-yellow-500 bg-yellow-100 text-yellow-600',
            purple: 'border-purple-500 bg-purple-100 text-purple-600'
        };
        const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;
        const [borderColor, bgColor, textColor] = colors.split(' ');
        
        return (
            <div className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${borderColor} transition-all hover:shadow-xl`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${bgColor} rounded-lg`}>
                        <Icon className={`w-6 h-6 ${textColor}`} />
                    </div>
                    <span className="text-3xl font-bold text-gray-900">{value}</span>
                </div>
                <p className="text-gray-600 text-sm">{title}</p>
            </div>
        );
    };

    const AlertStatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: number, color: string }) => {
        const colorMap = {
            red: 'from-red-50 to-red-100 border-red-200 text-red-600',
            yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
            green: 'from-green-50 to-green-100 border-green-200 text-green-600',
            blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600'
        };
        const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;
        const [fromColor, toColor, borderColor, textColor] = colors.split(' ');
        
        return (
            <div className={`bg-gradient-to-br ${fromColor} ${toColor} rounded-xl p-6 border ${borderColor}`}>
                <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-6 h-6 ${textColor}`} />
                    <span className="text-2xl font-bold text-gray-900">{value}</span>
                </div>
                <p className="text-gray-600">{title}</p>
            </div>
        );
    };

    const AlertIcon = ({ type }: { type: AlertType }) => {
        const iconMap = {
            warning: { Icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
            error: { Icon: AlertCircle, color: 'bg-red-100 text-red-600' },
            success: { Icon: CheckCircle, color: 'bg-green-100 text-green-600' },
            info: { Icon: Bell, color: 'bg-blue-100 text-blue-600' }
        };
        const { Icon, color } = iconMap[type] || iconMap.info;
        const [bgColor, textColor] = color.split(' ');
        
        return (
            <div className={`p-3 rounded-lg ${bgColor}`}>
                <Icon className={`w-6 h-6 ${textColor}`} />
            </div>
        );
    };

    const RuleCreationModal = () => (
        showRuleModal ? (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Rule</h2>
                        <button
                            onClick={() => setShowRuleModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name</label>
                            <input
                                type="text"
                                value={newRule.name}
                                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                placeholder="e.g., Auto Reorder High Volume Items"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Trigger Type</label>
                            <select
                                value={newRule.triggerType}
                                onChange={(e) => setNewRule({...newRule, triggerType: e.target.value as NewRuleForm['triggerType']})}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="">Select trigger condition</option>
                                <option value="inventory">Inventory Level Change</option>
                                <option value="time">Time-based Schedule</option>
                                <option value="order">Order Status Change</option>
                                <option value="price">External Price Change</option>
                            </select>
                        </div>

                        {newRule.triggerType === 'inventory' && (
                            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Condition</label>
                                    <select
                                        value={newRule.condition}
                                        onChange={(e) => setNewRule({...newRule, condition: e.target.value as NewRuleForm['condition']})}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    >
                                        <option value="">Select</option>
                                        <option value="below">Drops Below</option>
                                        <option value="above">Rises Above</option>
                                        <option value="equals">Equals</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Value (Units)</label>
                                    <input
                                        type="number"
                                        value={newRule.value}
                                        onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Action</label>
                            <select
                                value={newRule.action}
                                onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="">Select action to perform</option>
                                <option value="Send email notification">Send Email Notification</option>
                                <option value="Create purchase order">Create Purchase Order</option>
                                <option value="Update price">Update Selling Price</option>
                                <option value="Update status">Change Product Status</option>
                            </select>
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <button
                                onClick={handleCreateRule}
                                disabled={loadingRules}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all text-white font-semibold disabled:opacity-50"
                            >
                                {loadingRules ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Create Rule'}
                            </button>
                            <button
                                onClick={() => setShowRuleModal(false)}
                                className="flex-1 bg-gray-200 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors text-gray-800 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    );

    // --- Main Render ---
    const NavigationBar = () => (
        <div className="w-full bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
                <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-600" /> Automation
                </h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setCurrentView('rules')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentView === 'rules' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Rules Management
                    </button>
                    <button
                        onClick={() => setCurrentView('alerts')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                            currentView === 'alerts' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Alerts Log
                        {stats.alertsToday > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {stats.alertsToday}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <NavigationBar />
            {currentView === 'rules' ? <AutomationRulesView /> : <AlertsView />}
        </>
    );
};

export default AutomationDashboard;