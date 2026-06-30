import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 text-slate-800 px-6 text-center">
      <Logo size={48} />
      <p className="mt-6 text-6xl font-extrabold tracking-tight text-neon-cyan">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500 max-w-md">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">Back home</Link>
        <Link to="/dashboard" className="btn-secondary">Go to dashboard</Link>
      </div>
    </div>
  );
}
