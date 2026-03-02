import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  Home,
  DollarSign,
  Clock,
  Shield,
  CheckCircle2,
  Star,
  Users,
  Award,
  Zap,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  Check,
  Heart,
  Plus
} from 'lucide-react';

const ADDRESS_DATABASE = [
  '512 N 41st St, Phoenix, AZ 85008',
  '5142 N 36th Pl, Phoenix, AZ 85018',
  '510 E Camelback Rd, Phoenix, AZ 85012',
  '5200 N Central Ave, Phoenix, AZ 85012',
  '4802 E Ray Rd, Phoenix, AZ 85044',
  '3420 E Shea Blvd, Phoenix, AZ 85028',
  '7120 E Kierland Blvd, Scottsdale, AZ 85254',
  '8700 E Pinnacle Peak Rd, Scottsdale, AZ 85255',
  '15215 S 48th St, Phoenix, AZ 85048',
  '1234 W Camelback Rd, Phoenix, AZ 85015',
  '2901 N 70th St, Scottsdale, AZ 85251',
  '6001 N 16th St, Phoenix, AZ 85016',
  '9802 N 37th Ave, Phoenix, AZ 85051',
  '4420 E Indian School Rd, Phoenix, AZ 85018',
  '11225 N 28th Dr, Phoenix, AZ 85029',
];

const TESTIMONIALS = [
  {
    name: "Sarah & Mike T.",
    location: "Scottsdale, AZ",
    quote: "We increased our home's value by $340K for only $180K spent. The process was so smooth.",
    image: "ST",
    stars: 5
  },
  {
    name: "James R.",
    location: "Phoenix, AZ",
    quote: "Kept our 2.9% rate and got the kitchen of our dreams. Why would anyone move?",
    image: "JR",
    stars: 5
  },
  {
    name: "The Chen Family",
    location: "Tempe, AZ",
    quote: "From analysis to completion in 5 months. Our home is now worth $1.2M more.",
    image: "CF",
    stars: 5
  }
];

const TRUST_LOGOS = [
  "Licensed & Insured",
  "BBB A+ Rated",
  "NARI Member",
  "EPA Certified"
];

const STATS = [
  { value: "$2.4B", label: "Equity Created", icon: TrendingUp },
  { value: "15,000+", label: "Homes Renovated", icon: Home },
  { value: "4.9/5", label: "Average Rating", icon: Star },
  { value: "6 Months", label: "Avg. Timeline", icon: Calendar },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeValue, setHomeValue] = useState(750000);

  // Address autocomplete
  useEffect(() => {
    if (address.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const query = address.toLowerCase();
    const filtered = ADDRESS_DATABASE.filter(addr =>
      addr.toLowerCase().includes(query)
    ).slice(0, 5);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [address]);

  const handleGetStarted = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate('/onboarding');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(val);
  };

  // Calculate projected values
  const renovationCost = homeValue * 0.25;
  const valueIncrease = renovationCost * 1.6;
  const newValue = homeValue + valueIncrease;
  const equityCreated = valueIncrease - renovationCost;

  return (
    <div className="min-h-screen w-full bg-[#0a0612] text-white overflow-x-hidden">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center py-2 px-4 text-sm">
        <span className="font-medium">🎉 New: Get pre-qualified for renovation financing in 60 seconds</span>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0612]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">ExpandEase</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              Licensed & Insured
            </span>
            <span className="flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              15,000+ Happy Homeowners
            </span>
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
            alt="Modern home"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612]/50 via-[#0a0612]/80 to-[#0a0612]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6"
              >
                <Zap size={16} />
                Average homeowner creates $240K in equity
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
                Don't Move.
                <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Improve.
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-4 max-w-lg">
                Keep your low mortgage rate. Keep your neighborhood. Transform your home into your dream space.
              </p>

              <p className="text-gray-400 mb-8 max-w-lg">
                Moving costs $60K+ in fees and you'd trade your 3% rate for 7%. See how much wealth you can build by renovating instead.
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-2">
                  {['ST', 'JR', 'CF', 'MC'].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-2 border-[#0a0612] flex items-center justify-center text-xs font-bold text-gray-800"
                      style={{ zIndex: 4 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">Trusted by 15,000+ homeowners</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md">
                {STATS.slice(0, 3).map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon size={14} className="text-pink-400" />
                        <span className="text-xl font-bold text-white">{stat.value}</span>
                      </div>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Calculator Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl shadow-purple-900/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">See Your Potential</h3>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    LIVE CALCULATOR
                  </span>
                </div>

                {/* Address Input */}
                <div className="mb-6 relative">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your home address..."
                      className="w-full bg-gray-900/50 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-900/95 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setAddress(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-pink-500/10 transition-colors flex items-center gap-2"
                        >
                          <MapPin size={12} className="text-pink-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Home Value Slider */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Current Home Value</span>
                    <span className="text-white font-bold">{formatCurrency(homeValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="300000"
                    max="2000000"
                    step="50000"
                    value={homeValue}
                    onChange={(e) => setHomeValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$300K</span>
                    <span>$2M+</span>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Renovation Cost</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(renovationCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">New Value</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(newValue)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Equity Created</span>
                      <span className="text-xl font-bold text-emerald-400">+{formatCurrency(equityCreated)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleGetStarted}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Analyzing...</span>
                  ) : (
                    <>
                      Get Your Free Analysis
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-gray-500 text-xs mt-3">
                  No credit card required • Instant results
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Math Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Math Doesn't Lie</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              See why smart homeowners are choosing to renovate instead of relocating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Moving Card */}
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20 relative">
              <div className="absolute -top-3 left-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                THE COST OF MOVING
              </div>
              <h3 className="text-xl font-bold text-white mb-6 mt-2">Selling & Buying New</h3>
              
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Agent Commissions (6%)', value: '-$45,000', color: 'text-red-400' },
                  { label: 'Closing Costs', value: '-$12,000', color: 'text-red-400' },
                  { label: 'Moving Expenses', value: '-$5,000', color: 'text-red-400' },
                  { label: 'New Mortgage Rate', value: '~7.0%', color: 'text-red-400' },
                  { label: 'Lost 3% Rate Forever', value: 'PRICELESS', color: 'text-red-500' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-300 flex items-center gap-2">
                      <X size={14} className="text-red-500" />
                      {item.label}
                    </span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-red-500/10 rounded-xl p-4 text-center">
                <p className="text-red-400 text-xs uppercase mb-1">Total Dead Money</p>
                <p className="text-2xl font-black text-red-400">$60,000+</p>
              </div>
            </div>

            {/* Renovating Card */}
            <div className="bg-gradient-to-b from-purple-900/50 to-pink-900/30 rounded-2xl p-8 border border-pink-500/30 relative">
              <div className="absolute -top-3 left-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                THE EXPANDEASE WAY
              </div>
              <div className="absolute top-4 right-4">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 mt-2">Renovating Your Home</h3>
              
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Agent Commissions', value: '$0', color: 'text-emerald-400' },
                  { label: 'Closing Costs', value: '$0', color: 'text-emerald-400' },
                  { label: 'Keep Your Low Rate', value: 'LOCKED IN', color: 'text-emerald-400' },
                  { label: 'Customize Everything', value: '100%', color: 'text-emerald-400' },
                  { label: 'Average Equity Gain', value: '+$240K', color: 'text-emerald-400' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-200 flex items-center gap-2">
                      <Check size={14} className="text-emerald-400" />
                      {item.label}
                    </span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                <p className="text-emerald-400 text-xs uppercase mb-1">Wealth Building</p>
                <p className="text-2xl font-black text-emerald-400">+$180K+ Equity</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">From dream to done in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Vision',
                desc: 'Share your address, income, and renovation goals. Takes 60 seconds.',
                icon: Building2,
                color: 'from-pink-500 to-pink-600'
              },
              {
                step: '02',
                title: 'Get Your Analysis',
                desc: 'See real-time cost estimates, equity projections, and financing options.',
                icon: TrendingUp,
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '03',
                title: 'Start Building Wealth',
                desc: 'Connect with vetted contractors and secure "as-completed" financing.',
                icon: DollarSign,
                color: 'from-blue-500 to-blue-600'
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="text-6xl font-black text-white/5 absolute top-0 right-0 -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Real Homeowners, Real Results</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={testimonial.name} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-sm font-bold text-gray-800">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {TRUST_LOGOS.map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-gray-400">
                <Shield size={18} className="text-emerald-400" />
                <span className="font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Unlock Your Home's Potential?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 15,000+ homeowners who discovered the smarter way to get their dream home.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xl hover:from-pink-700 hover:to-purple-700 transition-all flex items-center gap-3 mx-auto group"
          >
            Get Your Free Analysis
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-gray-500 mt-4">Takes 60 seconds • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Home className="text-pink-500" size={24} />
            <span className="text-xl font-bold text-white">ExpandEase</span>
          </div>

          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">How It Works</a>
            <a href="#" className="hover:text-white transition-colors">Financing</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="text-xs text-gray-600">
            <p>© 2024 ExpandEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
