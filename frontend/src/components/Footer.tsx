import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-dark-700 bg-dark-800">
      <div className="max-w-5xl mx-auto px-6 py-10 grid gap-8 grid-cols-2 md:grid-cols-4 text-sm">
        <div className="space-y-3 col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={28} withWordmark />
          </Link>
          <p className="text-slate-500 max-w-xs">
            AI-driven career intelligence that helps students become placement-ready.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-slate-800">Product</h4>
          <ul className="space-y-2 text-slate-500">
            <li><Link to="/dashboard" className="hover:text-neon-cyan">Dashboard</Link></li>
            <li><Link to="/about" className="hover:text-neon-cyan">How it works</Link></li>
            <li><Link to="/signup" className="hover:text-neon-cyan">Get started</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-slate-800">Company</h4>
          <ul className="space-y-2 text-slate-500">
            <li><Link to="/about" className="hover:text-neon-cyan">About</Link></li>
            <li><Link to="/contact" className="hover:text-neon-cyan">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-slate-800">Legal</h4>
          <ul className="space-y-2 text-slate-500">
            <li><Link to="/terms" className="hover:text-neon-cyan">Terms of Use</Link></li>
            <li><Link to="/privacy" className="hover:text-neon-cyan">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-dark-700 py-4 text-center text-xs text-slate-500">
        © {year} PFJ — Path For Job. All rights reserved.
      </div>
    </footer>
  );
}
