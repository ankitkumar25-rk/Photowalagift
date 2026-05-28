import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
  const phoneNumber = '919602560933';
  const message = encodeURIComponent("Hi! I want to order the custom photo piggy bank gift.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center justify-center group animate-in fade-in zoom-in duration-500"
      aria-label="Order on WhatsApp"
    >
      {/* Pulse effect */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping -z-10" />
      
      <FaWhatsapp className="w-8 h-8" />
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-[#2e211c] text-[#fffdfb] text-xs font-bold py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg border border-[#efd3c1] uppercase tracking-wider">
        Order on WhatsApp 💬
      </span>
    </a>
  );
}
