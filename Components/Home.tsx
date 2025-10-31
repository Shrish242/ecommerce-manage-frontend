"use client";
import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3, 
  Palette, 
  Package, 
  Globe,
  ArrowRight,
  Check,
  Star,
  Users,
  TrendingUp,
  Target,
  Rocket,
  Award,
  Mail,
  Phone,
  MapPin,
  Send,
  Menu,
  X,
  Linkedin,
  Twitter,
  Github
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Contact', href: '#contact' },
  ];

  const features = [
    {
      icon: Palette,
      title: "AI-Powered Design",
      description: "Intelligent design systems that adapt to your brand identity and create pixel-perfect experiences.",
      gradient: "from-violet-500 to-purple-600"
    },
    {
      icon: Package,
      title: "Enterprise Infrastructure",
      description: "Scalable architecture built for high-volume operations with zero downtime deployments.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: Zap,
      title: "Global Performance",
      description: "Edge-optimized delivery network ensuring sub-second load times across 150+ countries.",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "SOC 2 Type II certified with end-to-end encryption and advanced threat protection.",
      gradient: "from-emerald-500 to-green-600"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time business intelligence with predictive modeling and conversion optimization.",
      gradient: "from-indigo-500 to-violet-600"
    },
    {
      icon: Globe,
      title: "International Commerce",
      description: "Multi-currency processing, localized checkout, and automated compliance management.",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  const stats = [
    { value: "500+", label: "Active Users" },
    { value: "150+", label: "Projects Launched" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  const solutions = [
    {
      icon: Rocket,
      title: "Startups & SMBs",
      description: "Launch and scale your business with enterprise-grade tools at startup-friendly pricing.",
      features: ["Rapid deployment", "Growth analytics", "24/7 support"]
    },
    {
      icon: TrendingUp,
      title: "Enterprise Solutions",
      description: "Custom infrastructure, dedicated support, and advanced integrations for large organizations.",
      features: ["Custom SLAs", "White-label options", "API access"]
    },
    {
      icon: Target,
      title: "Digital Agencies",
      description: "Multi-client management platform with collaboration tools and white-label capabilities.",
      features: ["Client portals", "Team collaboration", "Reseller programs"]
    }
  ];

  const team = [
    { role: "Founded", count: "2023", detail: "Building the Future" },
    { role: "Team Size", count: "12+", detail: "Passionate Experts" },
    { role: "Active Users", count: "500+", detail: "Growing Daily" },
    { role: "Projects", count: "150+", detail: "Successfully Launched" }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center bg-white px-5 py-2.5 rounded-full shadow-md border border-slate-200">
              <Award className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-sm font-semibold text-slate-700">
                Trusted by 500+ Growing Businesses
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block text-slate-900 mb-2">
                Enterprise Commerce
              </span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Built for Scale
              </span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed">
              The intelligent ecommerce platform powering the world's fastest-growing brands. 
              Enterprise reliability meets startup agility.
            </p>
            
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-indigo-200 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Built for Performance
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Enterprise-grade capabilities engineered to deliver exceptional experiences at any scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-transparent hover:-translate-y-2"
                style={{
                  transform: 'perspective(1000px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                <div 
                  className={`inline-flex p-3.5 rounded-xl bg-gradient-to-r ${feature.gradient} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{
                    transform: 'translateZ(20px)'
                  }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Solutions for Every Stage
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tailored solutions designed to meet your unique business requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <div
                key={solution.title}
                className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:rotate-1"
                style={{
                  transform: 'perspective(1000px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className="inline-flex p-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 mb-5 hover:scale-110 transition-transform duration-300"
                  style={{
                    transform: 'translateZ(30px)'
                  }}
                >
                  <solution.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{solution.title}</h3>
                <p className="text-slate-600 mb-6">{solution.description}</p>
                <ul className="space-y-3">
                  {solution.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-700">
                      <Check className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  About StoreForge
                </span>
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Founded in 2023, StoreForge started as a passion project to revolutionize how 
                  businesses build their online presence. What began as a small team of developers 
                  has grown into a thriving platform serving hundreds of users worldwide.
                </p>
                <p>
                  Our mission is to make powerful ecommerce tools accessible to everyone - from solo 
                  entrepreneurs to growing businesses. We believe great technology should empower, 
                  not complicate.
                </p>
                <p>
                  We're constantly innovating, listening to our community, and building features that 
                  actually matter. Join us on this journey to reshape online commerce.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {team.map((item, index) => (
                <div
                  key={item.role}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
                  style={{
                    transform: 'perspective(1000px) rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(5deg) translateZ(10px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) translateZ(0px)';
                  }}
                >
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {item.count}
                  </p>
                  <p className="text-sm text-slate-500 mb-1">{item.role}</p>
                  <p className="text-sm font-semibold text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Get in Touch
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Ready to transform your commerce experience? Let's start the conversation.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            <div className="flex items-start space-x-4 hover:-translate-y-1 hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Email Us</h3>
                <p className="text-slate-600">storeforge100@gmail.com</p>
                <p className="text-slate-600">storeforge100@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 hover:-translate-y-1 hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Call Us</h3>
                <p className="text-slate-600">977 980001000</p>
                <p className="text-slate-500 text-sm">Mon-Fri 9am-6pm NST</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 hover:-translate-y-1 hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Visit Us</h3>
                <p className="text-slate-600">Kathmandu</p>
                <p className="text-slate-600">Nepal</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-lg font-semibold mb-6">Follow Us</h3>
            <div className="flex justify-center space-x-4">
              <a href=" https://x.com/ShrishDhakal" className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <Twitter className="w-6 h-6" />
               
              </a>
              <a href="  https://www.linkedin.com/in/shrishdhakal/" className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <Linkedin className="w-6 h-6" />
              
              </a>
              <a href=" https://github.com/Shrish242" className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <Github className="w-6 h-6" />
               
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">StoreForge</span>
            </div>
            
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} StoreForge Inc. All rights reserved.
            </p>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}