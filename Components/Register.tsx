"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Building, User, Mail, Phone, MapPin, CreditCard, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend-template-jj60ntkqp-srs-projects-c448f20f.vercel.app";

const Register: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    contactNumber: "",
    panNumber: "",
    location: "",
    acceptTerms: false,
  });

  type FormDataKeys = keyof typeof formData;
  type ErrorsType = Partial<Record<FormDataKeys, string>>;
  const [errors, setErrors] = useState<ErrorsType>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topMessage, setTopMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputName = name as FormDataKeys;

    setFormData((prev) => ({
      ...prev,
      [inputName]: type === "checkbox" ? checked : value,
    }));

    if ((errors as any)[inputName]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete (copy as any)[inputName];
        return copy;
      });
    }
  };

  function validatePan(value: string) {
    const v = String(value || "").trim();
    if (!v) return "PAN number is required";
    if (!/^\d+$/.test(v)) return "PAN must contain digits only";
    if (v.length < 8) return "PAN must be at least 8 digits";
    if (v.length >= 10) return "PAN must be less than 10 digits";
    return "";
  }

  function handlePanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = String(e.target.value || "");
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 9);
    setFormData((prev) => ({ ...prev, panNumber: digitsOnly }));
    setErrors((prev) => {
      const copy = { ...prev };
      const err = validatePan(digitsOnly);
      if (err) copy.panNumber = err;
      else delete copy.panNumber;
      return copy;
    });
  }

  function handleContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = String(e.target.value || "");
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, contactNumber: digitsOnly }));
    setErrors((prev) => {
      const copy = { ...prev };
      if (!/^\d{10}$/.test(digitsOnly)) copy.contactNumber = "Please enter a valid 10-digit contact number";
      else delete copy.contactNumber;
      return copy;
    });
  }

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!formData.organizationName.trim()) newErrors.organizationName = "Organization name is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters long";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.contactNumber.trim()) newErrors.contactNumber = "Contact number is required";
    else if (!/^\d{10}$/.test(formData.contactNumber)) newErrors.contactNumber = "Please enter a valid 10-digit contact number";
    const panErr = validatePan(formData.panNumber);
    if (panErr) newErrors.panNumber = panErr;
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions";

    return newErrors;
  };

  const autoLogin = async (email: string, password: string) => {
    try {
      const loginRes = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) throw new Error("Auto-login failed");

      const loginData = await loginRes.json();
      
      if (loginData.token) localStorage.setItem("authToken", loginData.token);
      if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));

      return true;
    } catch (err) {
      console.error("Auto-login error:", err);
      return false;
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    setTopMessage(null);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData, panNumber: formData.panNumber };

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = (data && data.message) || "Registration failed";
        setTopMessage(message);
        if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("email")) {
          setErrors({ email: message });
        }
        throw new Error(message);
      }

      setTopMessage("Registration successful! Logging you in...");
      
      const loginSuccess = await autoLogin(formData.email, formData.password);
      
      if (loginSuccess) {
        router.push("/dashboard");
      } else {
        setTopMessage("Registration successful! Please log in.");
        setTimeout(() => {
          router.push("/Login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("register error", err);
      if (!topMessage) setTopMessage(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Your Account</h1>
          <p className="text-slate-600 dark:text-slate-400">Register your organization to get started</p>

          {topMessage && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${
              topMessage.includes("successful") || topMessage.includes("Logging you in")
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400"
            }`}>
              {topMessage}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          <div className="space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Building className="inline w-4 h-4 mr-2" />
                Organization Name *
              </label>
              <input
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="Enter organization name"
              />
              {errors.organizationName && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.organizationName}</p>}
            </div>

            {/* Email & Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Username *
                </label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Choose username"
                />
                {errors.username && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password *</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Contact & PAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Contact Number *
                </label>
                <input
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleContactChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="10-digit number"
                  maxLength={10}
                />
                {errors.contactNumber && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.contactNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-2" />
                  PAN Number *
                </label>
                <input
                  name="panNumber"
                  type="text"
                  value={formData.panNumber}
                  onChange={handlePanChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="8-9 digits"
                  maxLength={9}
                />
                {errors.panNumber && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.panNumber}</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-2" />
                Location *
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="City, State"
              />
              {errors.location && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                name="acceptTerms"
                id="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 mt-0.5"
              />
              <label htmlFor="acceptTerms" className="text-sm text-slate-700 dark:text-slate-300">
                I agree to the{" "}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-red-500 dark:text-red-400 text-sm">{errors.acceptTerms}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <a href="/Login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;