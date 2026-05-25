import { Phone, MessageCircle, Mail, MapPin, Package, Percent, Clock, CheckCircle2, Truck, Building2, Heart, Trophy, Rocket } from 'lucide-react';
import { brandAssets } from '../data/assets';

export default function BulkOrders() {
  const whatsappNumber = "+919602560933"; // Replace with actual number
  const phoneNumber = "+918104937078";    // Replace with actual number
  const email = "photowalagiftphotowalagift@gmail.com";

  return (
    <div className="min-h-screen bg-[#faf8f5] page-enter flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-[#3b1d16] text-white py-16 md:py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-secondary rounded-full -translate-x-1/2 -translate-y-1/2 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-primary rounded-full translate-x-1/2 translate-y-1/2 blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 font-display leading-tight">
            Bulk Orders & Corporate Deals
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-brand-soft/80 max-w-2xl mx-auto leading-relaxed">
            Planning a big event or looking for corporate gifting solutions? Get exclusive discounts and personalized service for your bulk requirements.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

          {/* Left: Contact Options (Sticky on desktop) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(59,29,22,0.08)] border border-brand-primary/5">
              <h2 className="text-2xl font-bold text-brand-primary mb-6">Get in Touch</h2>

              <div className="space-y-4">
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-brand-primary text-white hover:bg-[#4a2b1f] transition-all shadow-lg active:scale-[0.98] group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">Call Us Now</p>
                    <p className="text-base sm:text-lg font-bold truncate">{phoneNumber}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#25D366] text-white hover:opacity-95 transition-all shadow-lg active:scale-[0.98] group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">WhatsApp Message</p>
                    <p className="text-base sm:text-lg font-bold truncate">Chat with Expert</p>
                  </div>
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-brand-soft/50 space-y-5">
                <div className="flex items-center gap-4 text-brand-primary">
                  <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-secondary" />
                  </div>
                  <span className="text-sm font-semibold truncate">{email}</span>
                </div>
                <div className="flex items-start gap-4 text-brand-primary">
                  <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-brand-secondary" />
                  </div>
                  <span className="text-sm font-semibold leading-relaxed">DADAJI KI FACTORY, Jhunjhunu, Rajasthan</span>
                </div>
              </div>
            </div>

            <div className="bg-[#fff9f4] rounded-2xl p-6 border border-brand-secondary/15">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-brand-secondary" />
                <h3 className="font-bold text-brand-primary">Response Time</h3>
              </div>
              <p className="text-xs sm:text-sm text-brand-primary/70 leading-relaxed font-medium">
                Our bulk order experts typically respond within **2-4 business hours** for all inquiries.
              </p>
            </div>
          </div>

          {/* Right: Benefits & Why Choose Us */}
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: <Percent />, title: "Tiered Discounts", desc: "Save more as you order more. Custom pricing for quantities above 50 units." },
                { icon: <Package />, title: "Custom Branding", desc: "Complete personalization options including logo engraving and custom packaging." },
                { icon: <CheckCircle2 />, title: "Quality Check", desc: "Rigorous quality control for every single piece in your bulk shipment." },
                { icon: <Truck className="w-6 h-6" />, title: "Insured Shipping", desc: "Safe and insured doorstep delivery across India with real-time tracking." },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-brand-primary/5 hover:border-brand-secondary/30 transition-all hover:shadow-xl group">
                  <div className="w-14 h-14 bg-brand-surface text-brand-secondary rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-brand-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-brand-primary/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold text-brand-primary">Perfect For All <span className="text-brand-secondary">Occasions</span></h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-0.5 w-8 bg-brand-secondary/30" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tailored Solutions</p>
                  <div className="h-0.5 w-8 bg-brand-secondary/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
                {[
                  { label: 'Corporate Events', icon: <Building2 className="w-8 h-8" /> },
                  { label: 'Weddings', icon: <Heart className="w-8 h-8" /> },
                  { label: 'School Awards', icon: <Trophy className="w-8 h-8" /> },
                  { label: 'Brand Launches', icon: <Rocket className="w-8 h-8" /> }
                ].map((item) => (
                  <div key={item.label} className="text-center group">
                    <div className="w-20 h-20 mx-auto bg-brand-surface rounded-3xl flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:shadow-xl group-hover:shadow-brand-primary/20 transition-all duration-500 border border-brand-primary/5 group-hover:-translate-y-2">
                      <div className="text-brand-primary group-hover:text-white transition-colors duration-500">
                        {item.icon}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-brand-primary leading-tight px-2 group-hover:text-brand-secondary transition-colors uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden bg-brand-primary rounded-[2rem] p-8 md:p-12 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10 max-w-2xl">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 font-display italic">Have a specific requirement?</h3>
                <p className="text-brand-soft/80 mb-8 leading-relaxed text-sm sm:text-base">
                  Tell us about your event, the product you're interested in, and the quantity you need. We'll get back to you with the best possible quote and a digital mock-up.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => window.location.href = `mailto:${email}`}
                    className="bg-brand-secondary text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#d49e35] transition-colors shadow-lg active:scale-95"
                  >
                    Request a Quote
                  </button>
                  <button
                    onClick={() => window.location.href = `tel:${phoneNumber}`}
                    className="bg-white/10 backdrop-blur-md text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs border border-white/20 hover:bg-white/20 transition-colors active:scale-95"
                  >
                    Discuss on Call
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
