import { Link } from 'react-router-dom';
import { Share2, MessageCircle, Send, Mail, Phone, MapPin, Shield, Heart } from 'lucide-react';
import { brandAssets } from '../data/assets';
const Instagram = Share2, Facebook = MessageCircle, Twitter = Send;

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(180deg,#5a3f2f,#3b291f)] text-white border-t border-[#d8a45f]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            {/* Elegant Luxury Branded Badge */}
            <div className="inline-flex items-center justify-center bg-[#fffdfb] rounded-2xl px-5 py-2.5 border border-brand-secondary/35 shadow-[0_8px_32px_rgba(91,63,47,0.15)] transition-all hover:border-brand-secondary">
              <img
                src={brandAssets.logo}
                alt="Photowala"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-[#d7c4b0] text-sm leading-relaxed">
              Personalized photogifts, premium mementos, and celebration-ready keepsakes for every milestone.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#d4b49e] mb-4">Shop</h4>
            <ul className="space-y-2">
              {[
                ['All Products', '/products'],
                ['Trophies', '/categories/trophies'],
                ['3D Models', '/categories/3d-models'],
                ['Momentos', '/categories/momentos'],
                ['Corporate Gifts', '/categories/corporate-gifts'],
                ['Pen Holders', '/categories/pen-holders'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-[#d7c4b0] text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#d4b49e] mb-4">Help</h4>
            <ul className="space-y-2">
              {[
                ['My Orders', '/orders'],
                ['Track Order', '/track-order'],
                ['Return Policy', '/returns'],
                ['FAQ', '/faq'],
                ['Privacy Policy', '/privacy'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-[#d7c4b0] text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#d4b49e] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[#d7c4b0] text-sm">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:photowalagiftphotowalagift@gmail.com" className="hover:text-white transition-colors">
                  photowalagiftphotowalagift@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#d7c4b0] text-sm">
                <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+918104937078" className="hover:text-white transition-colors">
                    +91 81049 37078 (Call)
                  </a>
                  <a href="https://wa.me/919602560933" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    +91 96025 60933 (WhatsApp)
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2 text-[#d7c4b0] text-sm">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <b>DADAJI KI FACTORY</b><br />
                  WARD NO. 04, KUMAWAT COLONY,<br />
                  SITHAL ROAD, TEHSIL - GUDHA GORJI,<br />
                  Chhaosari, Jhunjhunu, Rajasthan - 333012
                </span>
              </li>
            </ul>
            {/* Certifications */}
            <div className="mt-6">
              <p className="text-[#d4b49e] text-xs font-semibold uppercase tracking-wider mb-2">Certifications</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/8 rounded text-xs text-[#d7c4b0] border border-[#d8a45f]/40 flex items-center gap-1">
                  <img src={brandAssets.logo} alt="Logo" className="w-3 h-3 object-contain" />
                  Crafted Premium
                </span>
                <span className="px-2 py-1 bg-white/8 rounded text-xs text-[#d7c4b0] border border-[#d8a45f]/40 flex items-center gap-1"><Shield className="w-3 h-3 text-[#d8a45f]" /> Trusted India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#d8a45f]/20 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#d4b49e] text-xs">
          <p>© {new Date().getFullYear()} Photowala. All rights reserved.</p>
          <p className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> in India</p>
        </div>
      </div>
    </footer>
  );
}
