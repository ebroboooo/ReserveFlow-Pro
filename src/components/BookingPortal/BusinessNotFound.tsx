import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Smile } from 'lucide-react';
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../../types';

interface BusinessNotFoundProps {
  slug?: string;
}

export const BusinessNotFound: React.FC<BusinessNotFoundProps> = ({ slug }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      <div className="panel w-full max-w-md p-8 shadow-elevated text-center space-y-6">
        <div className="bg-brand-600 p-2.5 rounded-2xl w-fit mx-auto text-white shadow-lg">
          <Smile className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-xl font-display font-bold text-slate-900">Clinic Not Found</h2>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            {slug
              ? `We couldn't find a booking page for "${slug}". The link may be outdated or the clinic is no longer available.`
              : "We couldn't find the booking page you requested."}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link to={`/book/${DEFAULT_PUBLIC_BOOKING_SLUG}`} className="btn-primary w-full py-3">
            Book an Appointment
          </Link>
          <Link to="/" className="btn-secondary w-full py-3 flex items-center justify-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to SmileCare Pro
          </Link>
        </div>
      </div>
    </div>
  );
};
