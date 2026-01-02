import React, { useEffect, useState } from "react";
import {
  Trash2,
  Edit,
  AlertCircle,
  RefreshCw,
  User,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  LogOut,
  Loader2,
  Shield,
  Key,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend-template-58uoqaq4r-srs-projects-c448f20f.vercel.app";

/* ---------------------- Types ---------------------- */
type UserDetails = {
  fullName: string;
  username: string;
  companyName: string;
  email: string;
  contactNumber: string;
  panNumber: string;
  accountCreatedDate: string | null;
};

type UserSession = {
  id?: number;
  email?: string;
  organizationId?: number;
};

type Message = { type: "error" | "success"; text: string } | null;

/* ---------------------- Auth helpers ---------------------- */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem("authToken") || 
           localStorage.getItem("jwtToken") || 
           localStorage.getItem("token") || 
           null;
  } catch (e) {
    console.warn("Error reading token:", e);
    return null;
  }
}

function getUserFromLocalStorage(): UserSession | null {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return {
        id: u.id ?? u.userId ?? undefined,
        email: u.email ?? undefined,
        organizationId: u.organization_id ?? u.organizationId ?? u.orgId ?? undefined,
      };
    }
  } catch (e) {
    console.warn("Failed to parse user from localStorage", e);
  }
  return null;
}

/* ---------------------- API Helper ---------------------- */
async function apiFetch<T>(path: string, token: string | null, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers as Record<string, string> || {}) },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      msg = json?.message || json?.error || msg;
    } catch {
      // Ignore parse error
    }
    throw new Error(msg);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }

  return await res.json();
}

/* ---------------------- Toast Component ---------------------- */
const MessageToast: React.FC<{ message: Message; onDismiss: () => void }> = ({ message, onDismiss }) => {
  if (!message) return null;
  
  const bgColor = message.type === "error" ? "bg-red-600" : "bg-green-600";
  
  return (
    <div className={`fixed bottom-5 right-5 ${bgColor} p-4 rounded-lg shadow-xl text-white max-w-sm z-[100] animate-slide-up`}>
      <div className="flex justify-between items-center gap-4">
        <div className="text-sm">{message.text}</div>
        <button 
          onClick={onDismiss} 
          className="text-white opacity-80 hover:opacity-100 text-2xl leading-none font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/* ---------------------- Main Component ---------------------- */
export default function Settings() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const t = getAuthToken();
    const u = getUserFromLocalStorage();
    setToken(t);
    setUser(u);
  }, []);

  // Fetch details when token is available
  useEffect(() => {
    if (token) {
      fetchDetails();
    } else {
      setError("Not authenticated. Please log in.");
      setDetails(null);
    }
  }, [token]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorage = () => {
      const t = getAuthToken();
      const u = getUserFromLocalStorage();
      setToken(t);
      setUser(u);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const showMessage = (type: "error" | "success", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /* ---------------------- Fetch Details ---------------------- */
  const fetchDetails = async () => {
    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) {
      setError("Not authenticated");
      setDetails(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = await apiFetch<Record<string, any>>("/api/details", effectiveToken);
      
      const mapped: UserDetails = {
        fullName: body.fullName ?? body.organization_name ?? body.companyName ?? "",
        username: body.username ?? "",
        companyName: body.companyName ?? body.organization_name ?? "",
        email: body.email ?? "",
        contactNumber: body.contactNumber ?? body.contact_number ?? "",
        panNumber: body.panNumber ?? body.pan_number ?? "",
        accountCreatedDate: body.accountCreatedDate ?? body.created_at ?? null,
      };

      if (mapped.accountCreatedDate) {
        try {
          const date = new Date(mapped.accountCreatedDate);
          mapped.accountCreatedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch {
          mapped.accountCreatedDate = null;
        }
      }

      setDetails(mapped);
    } catch (err: any) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        handleLogout(false);
        showMessage("error", "Session expired. Please log in again.");
        setError("Session expired");
        return;
      }
      
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch details";
      setError(errorMsg);
      setDetails(null);
      console.error("fetchDetails error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Logout ---------------------- */
  const handleLogout = (showMsg = true) => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    setToken(null);
    setUser(null);
    setDetails(null);
    setError("Not authenticated. Please log in.");
    
    if (showMsg) {
      showMessage("success", "Logged out successfully.");
    }
  };

  /* ---------------------- Password Change (Future Enhancement) ---------------------- */
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("error", "All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      showMessage("error", "Password must be at least 8 characters with uppercase and number.");
      return;
    }

    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) {
      showMessage("error", "Not authenticated. Please log in.");
      return;
    }

    try {
      setChangingPassword(true);
      
      // Note: This endpoint needs to be implemented in backend
      await apiFetch("/api/change-password", effectiveToken, {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      showMessage("success", "Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        handleLogout(false);
        showMessage("error", "Session expired. Please log in.");
        return;
      }
      showMessage("error", err instanceof Error ? err.message : "Password change failed");
    } finally {
      setChangingPassword(false);
    }
  };

  /* ---------------------- Render ---------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">Account Settings</h1>
            <p className="text-slate-600">Manage your profile information and account preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-700 font-medium">{user?.email ?? "Not logged in"}</div>
            
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div className="text-slate-600 font-medium">Loading your settings...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={fetchDetails} 
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <RefreshCw size={18} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Details State */}
        {!loading && !error && !details && token && (
          <div className="bg-white rounded-xl shadow-lg border border-yellow-200 p-6 mb-6 text-center">
            <AlertCircle className="text-yellow-600 mx-auto mb-3" size={48} />
            <p className="text-yellow-800 text-lg mb-2">No account details found.</p>
            <p className="text-slate-600 text-sm mb-4">Your account information could not be retrieved.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={fetchDetails} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content - User Details */}
        {!loading && details && (
          <>
            {/* User Information Card */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-6 border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User size={22} />
                    User Information
                  </h2>
                  <button 
                    onClick={() => showMessage("success", "Edit functionality coming soon!")}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                    <span className="font-medium">Edit</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.fullName || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.username || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company Name</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.companyName || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg break-all">{details.email || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Number</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.contactNumber || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PAN Number</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.panNumber || "-"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Created</p>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">{details.accountCreatedDate ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings Card */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-6 border border-slate-200">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield size={22} />
                  Security Settings
                </h2>
              </div>

              <div className="p-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-purple-700 font-medium">
                    🔒 Keep your account secure by using a strong password.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 text-lg flex items-center gap-2">
                        <Key size={20} />
                        Password
                      </h3>
                      <p className="text-sm text-slate-600">Last changed: Never (using initial password)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <Key size={18} />
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">Account Management</p>
                  <p className="text-sm text-blue-700">
                    Your account data is securely stored and managed. For account deletion or data modification requests, please contact support.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Key size={24} />
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-slate-500 mt-1">Min 8 characters, 1 uppercase, 1 number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MessageToast message={message} onDismiss={() => setMessage(null)} />
    </div>
  );
}