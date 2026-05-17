import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { createElement, useEffect } from 'react';
import { useAdminStore } from '../App';
import { useUIStore } from '../store/uiStore';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  RotateCcw, BarChart3, MessageSquare, LogOut, Menu, X, ClipboardList,
  Settings, Printer, ExternalLink, User
} from 'lucide-react';
import logo from '../assets/logo.png';
import { NotificationBell } from './NotificationBell';
import { useAdminSSE } from '../hooks/useAdminSSE';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useState } from 'react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products' },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders' },
  { to: '/machine-orders', icon: Settings,   label: 'Machine Services' },
  { to: '/print-orders',   icon: Printer,    label: 'Print Orders' },
  { to: '/customers', icon: Users,           label: 'Customers' },
  { to: '/returns',   icon: RotateCcw,       label: 'Returns' },
  { to: '/inventory', icon: BarChart3,       label: 'Inventory' },
  { to: '/support',   icon: MessageSquare,   label: 'Support' },
];

function SessionExpiredModal({ show }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-brand-deep/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-2xl font-display font-black text-brand-primary mb-2 tracking-tight">Session Ended</h2>
        <p className="text-gray-500 font-medium mb-8">Your session has ended for security. Please sign in again.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="w-full btn-primary py-3"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout, sessionExpired } = useAdminStore();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const storeUrl = import.meta.env.VITE_STORE_URL || 'http://localhost:5173';

  useAdminSSE();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-color-bg-main font-sans selection:bg-brand-secondary selection:text-white">
      <SessionExpiredModal show={sessionExpired} />
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] glass-sidebar overflow-hidden
          ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full sm:translate-x-0 w-0 sm:w-20'}
        `}
      >
        <div className="flex h-full flex-col luxury-grain">
          {/* Brand Header */}
          <div className={`flex h-24 items-center gap-4 px-6 border-b border-white/5 overflow-hidden transition-all duration-500 ${!sidebarOpen ? 'justify-center px-0' : ''}`}>
             <div className="p-2 rounded-xl bg-white/10 border border-white/10 shrink-0 shadow-inner">
               <img src={logo} alt="Logo" className="h-8 w-8 object-contain brightness-0 invert opacity-90" />
             </div>
             <div className={`flex flex-col transition-all duration-500 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 invisible sm:hidden'}`}>
                <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase leading-none mb-1.5">Photowala</span>
                <span className="text-sm font-display font-black tracking-widest text-white leading-none">CONSOLE</span>
             </div>
             {/* Mobile Close */}
             <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-white/40 hover:text-white sm:hidden transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 py-8 overflow-y-auto no-scrollbar">
            {NAV.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`sidebar-link ${isActive ? 'active' : ''} group relative ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-brand-secondary' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span className={`transition-all duration-500 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 invisible sm:hidden'}`}>
                    {label}
                  </span>
                  
                  {/* Tablet/Collapsed Tooltip */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-brand-deep text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden sm:block lg:hidden shadow-2xl border border-white/5 uppercase tracking-widest">
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
            <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 mb-4 group transition-colors hover:bg-white/10 ${!sidebarOpen ? 'justify-center px-0' : ''}`}>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-secondary to-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10">
                {user?.name?.[0]?.toUpperCase() || <User size={18} />}
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-500 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 invisible sm:hidden'}`}>
                <p className="text-sm font-bold text-white truncate group-hover:text-brand-secondary transition-colors">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{user?.role || 'Administrator'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[10px] font-black tracking-[0.2em] text-white/60 uppercase transition-all duration-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 shadow-sm group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-deep/60 backdrop-blur-md sm:hidden transition-all duration-500" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className={`flex min-w-0 flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? 'ml-0 sm:ml-72' : 'ml-0 sm:ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 sm:px-10">
          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-brand-primary hover:bg-brand-soft hover:border-brand-primary/20 transition-all duration-200 shadow-sm"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0 ml-2">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-brand-primary/40 uppercase">
              Management Console
            </h2>
            <h1 className="text-base font-bold text-brand-primary truncate">
              {NAV.find(n => n.to === location.pathname)?.label || 'Photowala Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={storeUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="hidden md:flex items-center gap-2 rounded-xl bg-brand-primary/5 hover:bg-brand-primary px-4 py-2 text-[10px] font-black tracking-widest text-brand-primary hover:text-white transition-all duration-300 border border-brand-primary/10 shadow-sm group"
            >
              <ExternalLink size={14} className="transition-transform group-hover:scale-110" />
              <span>LIVE STORE</span>
            </a>

            <div className="w-px h-6 bg-gray-200 hidden sm:block" />

            <NotificationBell />
            
            <button className="h-10 w-10 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-100 overflow-hidden shrink-0 hover:ring-brand-secondary/50 transition-all duration-300">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-brand-soft text-brand-primary font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'S'}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="animate-fade-in flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10 animate-slide-up">
            <Outlet />
          </div>
          
          <footer className="mt-20 py-8 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
              Photowala Gift © 2026 • Crafted for Excellence
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
