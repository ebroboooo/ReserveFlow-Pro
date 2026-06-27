import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface BusinessNotFoundProps {
  slug?: string;
}

export const BusinessNotFound: React.FC<BusinessNotFoundProps> = ({ slug }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border-slate-800 shadow-2xl relative text-center space-y-6">
        <div className="bg-gradient-to-tr from-brand-500 to-violet-500 p-2.5 rounded-2xl w-fit mx-auto text-white shadow-xl">
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Business Not Found</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {slug
              ? `We couldn't find a booking page for "${slug}". The link may be outdated or the business is no longer available.`
              : 'We couldn\'t find the booking page you requested.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/book/apex-preset"
            className="glass-btn-primary w-full py-3 text-xs flex items-center justify-center gap-1.5"
          >
            Try Demo Booking Portal
          </Link>
          <Link
            to="/login"
            className="glass-btn-secondary w-full py-3 text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ReserveFlow Pro
          </Link>
        </div>
      </div>
    </div>
  );
};
