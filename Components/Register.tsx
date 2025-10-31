"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Building, User, Mail, Phone, MapPin, CreditCard } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://70.153.25.251:3001:3001";

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

  // Verification UI state
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
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

    if (!formData.panNumber.trim()) newErrors.panNumber = "PAN number is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase()))
      newErrors.panNumber = "Please enter a valid PAN number (e.g., ABCDE1234F)";

    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions";

    return newErrors;
  };

  const sendVerification = useCallback(async (email: string) => {
    try {
      const resp = await fetch(`${API_BASE}/api/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // intentionally treat 200/204/400... generically so we don't leak existence
      if (!resp.ok) {
        // show a friendly message but still mark as "sent" to avoid enumeration
        setTopMessage("If this email exists, a verification message was sent. Check your inbox (or spam).");
      } else {
        setTopMessage("Verification email sent — check your inbox (and spam).");
      }
      setVerificationSent(true);
      // disable resend for 60s to reduce accidental retries
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 60_000);
    } catch (err) {
      console.error("sendVerification error", err);
      setTopMessage("Failed to send verification email. Try again later.");
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});
    setTopMessage(null);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData, panNumber: formData.panNumber.toUpperCase() };

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // show validation or conflict message returned by server
        const message = (data && data.message) || "Registration failed";
        setTopMessage(message);
        // if email conflict show under email field
        if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("email")) {
          setErrors({ email: message });
        }
        throw new Error(message);
      }

      // Registration succeeded. Send verification email now.
      await sendVerification(payload.email);

      // keep user on this page and show verification message (they will check email)
      // Optionally you could redirect to /login after sending
      // router.push("/login"); // <-- if you want immediate redirect to login
    } catch (err: any) {
      console.error("register error", err);
      if (!topMessage) setTopMessage(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!formData.email) {
      setTopMessage("Enter your email above and press Resend.");
      return;
    }
    if (resendDisabled) return;
    await sendVerification(formData.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-4xl animate-fade-in">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <Building className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Register Your Organization
            </h1>
          </div>
          <p className="text-gray-600 text-sm">Create your multi-tenant account</p>

          {topMessage && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-900 p-3 rounded-md text-sm">
              {topMessage}
            </div>
          )}

          {verificationSent && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-900 p-3 rounded-md text-sm flex items-center justify-between gap-3">
              <div>
                Verification email sent to <strong>{formData.email}</strong>. Click the link in the email to confirm your account.
                If you don't see it, check spam.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled}
                  className={`px-3 py-1 rounded-md text-sm font-semibold ${resendDisabled ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  {resendDisabled ? "Resend (wait)" : "Resend"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/Login")}
                  className="px-3 py-1 rounded-md text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50"
                >
                  Go to Sign in
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Organization Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building className="inline w-4 h-4 mr-2" />
                Organization Name *
              </label>
              <input name="organizationName" value={formData.organizationName} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Enter your organization name" />
              {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address *
              </label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Enter your email address" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Username *
              </label>
              <input name="username" value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Choose a username" />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Create a password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters with letters and numbers</p>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Confirm your password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Contact Number *
              </label>
              <input name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Enter 10-digit mobile number" maxLength={10} />
              {errors.contactNumber && <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="inline w-4 h-4 mr-2" />
                PAN Number *
              </label>
              <input name="panNumber" type="text" value={formData.panNumber} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300 uppercase" placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: "uppercase" }} />
              {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-2" />
              Location *
            </label>
            <input name="location" type="text" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300" placeholder="Enter your city, state" />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input name="acceptTerms" id="acceptTerms" type="checkbox" checked={formData.acceptTerms} onChange={handleInputChange} className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5" />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                Privacy Policy
              </a>{" "}
              of this website *
            </label>
          </div>
          {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:ring-4 focus:ring-blue-500/25">
            {loading ? "Creating..." : "Create Organization Account"}
          </button>

          <div className="text-center pt-4">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a href="/Login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Register;
