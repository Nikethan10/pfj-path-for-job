import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Logo from './Logo';
import Footer from './Footer';

interface PublicPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared shell for public marketing / legal / info pages (header + content + footer). */
export default function PublicPage({ title, subtitle, children }: PublicPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-800">
      <header className="border-b border-dark-700 bg-dark-800/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} withWordmark />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link to="/about" className="hidden sm:inline hover:text-neon-cyan">About</Link>
            <Link to="/contact" className="hidden sm:inline hover:text-neon-cyan">Contact</Link>
            <Link to="/login" className="btn-primary !py-2 !px-4">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-slate-500 text-lg">{subtitle}</p>}
          <div className="mt-8 space-y-5 text-slate-700 leading-relaxed">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
