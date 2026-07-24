import { Link } from 'react-router-dom';
import { PenTool, Printer, Scissors, Settings, CheckCircle2, ChevronRight } from 'lucide-react';
import { serviceAssets } from '../data/assets';

const SERVICES = [
  {
    id: 'co2-laser',
    title: 'CO2 LASER MACHINE',
    description: 'Precision cutting and engraving for organic materials like wood, acrylic, and leather. Perfect for intricate giftware and architectural models.',
    image: serviceAssets.co2Laser,
    icon: Scissors,
    badge: 'PREMIUM',
    badgeColor: 'bg-green-700',
    link: '/services/machine-services/co2-laser',
  },
  {
    id: 'laser-marking',
    title: 'Laser Marking Machine',
    description: 'Permanent, high-speed marking for industrial parts, tools, and metal gifts. Ideal for serial numbers, barcodes, and metal engraving.',
    image: serviceAssets.laserMarking,
    icon: Settings,
    link: '/services/machine-services/laser-marking',
  },
  {
    id: 'cnc-router',
    title: 'CNC ROUTER MACHINE',
    description: 'Large-scale 3D carving and profile cutting for signage, furniture, and heavy-duty materials with unmatched structural integrity.',
    image: serviceAssets.cncRouter,
    icon: PenTool,
    link: '/services/machine-services/cnc-router',
  },


  {
    id: 'custom-printing',
    title: 'Custom Printing',
    description: 'Personalized merchandise including Laser Printed Pens, stickers, and corporate stationery with high-fidelity finishes.',
    image: serviceAssets.customPrinting,
    icon: Printer,
    badge: 'NEW',
    badgeColor: 'bg-teal-700',
    link: '/services/custom-printing/pen'
  }
];

export default function Services() {
  return (
    <div className="min-h-screen bg-cream-100 luxury-grain pb-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-32 pb-8">
          <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-brand-primary">Professional Services</span>
          </div>
        </div>

        {/* Header */}
        <div className="max-w-4xl mx-auto text-center pt-8 pb-16 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-primary mb-6 leading-tight">
            Professional <br />
            <span className="text-brand-secondary">Services</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-0.5 w-12 bg-brand-secondary" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Industrial-grade machinery & personalized printing</p>
            <div className="h-0.5 w-12 bg-brand-secondary" />
          </div>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
            Precision craftsmanship meets creative vision. Discover our range of industrial-grade machinery and personalized printing solutions tailored for your unique needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="card group overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-cream-200">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {service.badge && (
                      <span className={`absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md tracking-wider ${service.badgeColor === 'bg-green-700' ? 'bg-brand-secondary' : 'bg-brand-primary'}`}>
                        {service.badge}
                      </span>
                    )}


                  </div>
                  
                  <div className="p-6 flex flex-col grow">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="text-brand-primary shrink-0 mt-0.5">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-brand-primary text-sm leading-tight uppercase tracking-wide">{service.title}</h3>
                    </div>
                    <p className="text-gray-600 text-xs mb-8 grow leading-relaxed">
                      {service.description}
                    </p>

                    <Link 
                      to={service.link}
                      className="w-full block text-center bg-brand-primary hover:bg-brand-deep text-white font-bold py-3 rounded-pill transition-all text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-brand-primary/20"
                    >
                      Learn More <ChevronRight className="w-4 h-4 inline ml-2" />
                    </Link>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-card border border-cream-200 overflow-hidden flex flex-col lg:flex-row relative shadow-sm">
            {/* Background pattern */}
            <div className="absolute -bottom-24 -right-12 text-cream-200 opacity-30 w-96 h-96 pointer-events-none">
              <Settings className="w-full h-full" strokeWidth={0.5} />
            </div>

            <div className="p-12 lg:w-1/2 flex flex-col justify-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6 leading-tight">
                Industrial Quality for Creative Projects
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed text-base font-medium">
                Our workshop bridges the gap between massive industrial production and boutique artisan design. We use high-end machinery to ensure your gifts and branding materials stand out with microscopic detail.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Precision up to 0.01mm for complex designs',
                  'Material versatility: Metal, Wood, Acrylic, Leather',
                  'Fast turnaround for bulk corporate orders'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-secondary shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/2 p-4 lg:p-8 grid grid-cols-2 gap-4">
              {/* 2x2 Grayscale Images Grid */}
              <img src={serviceAssets.industrial} alt="Industrial" className="w-full h-48 md:h-64 object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-500" />
              <img src={serviceAssets.drawing} alt="Drawing" className="w-full h-48 md:h-64 object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-500" />
              <img src={serviceAssets.machine} alt="Machine" className="w-full h-48 md:h-64 object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-500" />
              <img src={serviceAssets.material} alt="Material" className="w-full h-48 md:h-64 object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
