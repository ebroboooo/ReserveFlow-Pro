import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  Smile, Calendar, Shield, Star, ChevronDown, Phone, Mail, MapPin,
  Clock, ArrowRight, Menu, X, CheckCircle, Users, Award, Heart
} from 'lucide-react';

const SERVICES = [
  { name: 'Dental Cleaning & Exam', desc: 'Professional cleaning and comprehensive oral health assessment.', price: '$120', duration: '45 min', icon: '🦷' },
  { name: 'Teeth Whitening', desc: 'Advanced in-office whitening for a brighter, confident smile.', price: '$350', duration: '60 min', icon: '✨' },
  { name: 'Root Canal Treatment', desc: 'Expert endodontic care to save damaged teeth painlessly.', price: '$850', duration: '90 min', icon: '🔬' },
  { name: 'Orthodontics', desc: 'Braces and aligners for a perfectly aligned smile.', price: 'From $100', duration: '45 min', icon: '😁' },
  { name: 'Dental Implants', desc: 'Permanent tooth replacement with natural-looking results.', price: 'Consultation $75', duration: '30 min', icon: '💎' },
  { name: 'Pediatric Dentistry', desc: 'Gentle, child-friendly dental care for young patients.', price: '$100', duration: '45 min', icon: '👶' },
];

const DOCTORS = [
  { name: 'Dr. Amanda Ross', role: 'General Dentist', exp: '15+ years', image: 'AR', specialty: 'Preventive & Restorative' },
  { name: 'Dr. Khalid Mansoor', role: 'Orthodontist', exp: '12+ years', image: 'KM', specialty: 'Braces & Aligners' },
  { name: 'Dr. Sarah Chen', role: 'Pediatric Dentist', exp: '10+ years', image: 'SC', specialty: 'Children\'s Dentistry' },
];

const TESTIMONIALS = [
  { name: 'Sarah Jenkins', text: 'The team at SmileCare made my dental anxiety disappear. Best cleaning I\'ve ever had!', rating: 5 },
  { name: 'Michael Thorne', text: 'Dr. Ross handled my root canal with such care. Painless and professional throughout.', rating: 5 },
  { name: 'Farah Al-Amiri', text: 'My orthodontic treatment has been amazing. The staff is friendly and the results speak for themselves.', rating: 5 },
];

const FAQS = [
  { q: 'How do I book an appointment?', a: 'You can book online through our patient portal, call us directly, or visit either of our clinic locations during business hours.' },
  { q: 'Do you accept insurance?', a: 'Yes, we accept most major dental insurance plans. Contact us to verify your coverage before your visit.' },
  { q: 'What should I bring to my first visit?', a: 'Please bring a valid ID, your insurance card, a list of current medications, and any previous dental records if available.' },
  { q: 'Do you offer emergency dental care?', a: 'Yes, we provide same-day emergency appointments for urgent dental issues. Call our emergency line for immediate assistance.' },
  { q: 'Are your clinics kid-friendly?', a: 'Absolutely! Dr. Sarah Chen specializes in pediatric dentistry, and our clinics are designed to make children feel comfortable.' },
];

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { success } = useToast();

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Doctors', href: '#doctors' },
    { label: 'Reviews', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Smile className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-slate-900">SmileCare</span>
                <span className="text-brand-600 font-display font-bold text-lg"> Pro</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="btn-ghost text-sm">Staff Login</Link>
              <Link to={`/book/${DEFAULT_PUBLIC_BOOKING_SLUG}`} className="btn-primary text-sm py-2 px-5">
                Book Appointment
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 animate-slide-down">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2">
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link to="/login" className="btn-secondary text-sm w-full">Staff Login</Link>
              <Link to={`/book/${DEFAULT_PUBLIC_BOOKING_SLUG}`} className="btn-primary text-sm w-full">Book Appointment</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-brand-50 via-white to-dental-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium border border-brand-100">
                <Award className="h-4 w-4" />
                Award-Winning Dental Care Since 2010
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-tight">
                Your Smile, <span className="text-brand-600">Our Priority</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Experience world-class dental care with modern technology, compassionate doctors, and a commitment to your oral health.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={`/book/${DEFAULT_PUBLIC_BOOKING_SLUG}`} className="btn-primary text-base py-3 px-8">
                  <Calendar className="h-5 w-5" />
                  Book Your Appointment
                </Link>
                <a href="#services" className="btn-secondary text-base py-3 px-8">
                  Explore Services
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['AR', 'KM', 'SC'].map((initials) => (
                      <div key={initials} className="h-8 w-8 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-xs font-bold text-brand-700">
                        {initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">3 Expert Doctors</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm text-slate-600 ml-1">4.9/5 Rating</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-8 text-white shadow-elevated">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-brand-200" />
                    <div>
                      <p className="font-semibold text-lg">Trusted by 5,000+ Patients</p>
                      <p className="text-brand-200 text-sm">Across 2 clinic locations</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Years Experience', value: '15+' },
                      { label: 'Happy Patients', value: '5K+' },
                      { label: 'Dental Services', value: '20+' },
                      { label: 'Success Rate', value: '99%' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-brand-200 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">About Our Clinic</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2 mb-4">
                Modern Dentistry with a Personal Touch
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                At SmileCare Dental Clinic, we combine cutting-edge dental technology with compassionate care. Our team of experienced doctors is dedicated to providing personalized treatment plans that prioritize your comfort and long-term oral health.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: 'Advanced Technology', desc: 'Digital X-rays, 3D imaging, and laser dentistry' },
                  { icon: Heart, title: 'Patient-Centered Care', desc: 'Comfort-focused approach for every visit' },
                  { icon: Users, title: 'Expert Team', desc: 'Board-certified specialists in every field' },
                  { icon: Clock, title: 'Flexible Scheduling', desc: 'Online booking with same-day availability' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 p-4 rounded-xl bg-slate-50">
                    <item.icon className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl p-8 md:p-12">
              <div className="space-y-6">
                <h3 className="text-xl font-display font-bold text-slate-900">Why Choose SmileCare?</h3>
                {[
                  'State-of-the-art equipment and sterilization protocols',
                  'Transparent pricing with no hidden fees',
                  'Evening and weekend appointment availability',
                  'Multilingual staff (English & Arabic)',
                  'Child-friendly environment with pediatric specialists',
                  'Emergency dental care available',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2">Comprehensive Dental Care</h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">From routine cleanings to advanced procedures, we offer a full range of dental services for the whole family.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(svc => (
              <div key={svc.name} className="card card-hover p-6 group">
                <div className="text-3xl mb-4">{svc.icon}</div>
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-2">{svc.name}</h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="font-semibold text-brand-600">{svc.price}</span>
                  <span className="text-xs text-slate-400">{svc.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2">Meet Our Doctors</h2>
            <p className="text-slate-600 mt-3">Experienced professionals dedicated to your smile.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {DOCTORS.map(doc => (
              <div key={doc.name} className="card card-hover p-6 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {doc.image}
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900">{doc.name}</h3>
                <p className="text-brand-600 text-sm font-medium">{doc.role}</p>
                <p className="text-xs text-slate-400 mt-1">{doc.exp} experience</p>
                <div className="mt-3 inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium">
                  {doc.specialty}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2">What Our Patients Say</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{t.text}"</p>
                <p className="font-semibold text-sm text-slate-900">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Ready for a Healthier Smile?</h2>
          <p className="text-brand-100 mb-8 text-lg">Book your appointment today and take the first step toward optimal dental health.</p>
          <Link to={`/book/${DEFAULT_PUBLIC_BOOKING_SLUG}`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all shadow-elevated text-base">
            <Calendar className="h-5 w-5" />
            Schedule Your Visit
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm text-slate-900 pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 animate-slide-down">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Contact Us</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2 mb-4">Get in Touch</h2>
              <p className="text-slate-600 mb-8">Have questions? We'd love to hear from you. Reach out through any of the channels below.</p>
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: 'Downtown Clinic', value: '123 Medical Center Blvd, Suite 200' },
                  { icon: MapPin, label: 'North Side Clinic', value: '78 Wellness Plaza, Floor 3' },
                  { icon: Phone, label: 'Phone', value: '+1 (555) 880-9900' },
                  { icon: Mail, label: 'Email', value: 'hello@smilecare.com' },
                  { icon: Clock, label: 'Hours', value: 'Mon–Fri: 9AM–5PM | Sat: 9AM–1PM' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-8">
              <h3 className="font-display font-semibold text-lg text-slate-900 mb-6">Send Us a Message</h3>
              <form onSubmit={(e) => { e.preventDefault(); success('Thank you! Our team will respond within one business day.'); }} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                    <input type="text" className="input-field" placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
                    <input type="tel" className="input-field" placeholder="+1 (555) 000-0000" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                  <input type="email" className="input-field" placeholder="john@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Message</label>
                  <textarea className="input-field min-h-[100px] resize-y" placeholder="How can we help you?" required />
                </div>
                <button type="submit" className="btn-primary w-full">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <Smile className="h-4 w-4 text-white" />
                </div>
                <span className="font-display font-bold text-slate-900">SmileCare Pro</span>
              </div>
              <p className="text-sm leading-relaxed">Professional dental clinic management and patient care platform.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} className="block text-sm hover:text-slate-900 transition-colors">{link.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Services</h4>
              <div className="space-y-2">
                {['Dental Cleaning', 'Teeth Whitening', 'Root Canal', 'Orthodontics', 'Dental Implants'].map(s => (
                  <p key={s} className="text-sm">{s}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">For Clinics</h4>
              <p className="text-sm mb-3">Manage your dental practice with our SaaS platform.</p>
              <Link to="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Staff Dashboard →</Link>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs">&copy; {new Date().getFullYear()} SmileCare Pro. All rights reserved.</p>
            <p className="text-xs">Built with modern technology for dental professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
