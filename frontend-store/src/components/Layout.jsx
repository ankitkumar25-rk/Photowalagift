import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <Navbar />
      <main className="flex-1 page-enter">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
