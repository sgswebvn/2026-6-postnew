import React, { useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  const { settings, showToast } = useBlog();
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'editorial', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setSubmitted(true);
    showToast('Your message has been dispatched to our newsroom desk!');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-12">
      <div className="text-center space-y-3">
        <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold uppercase tracking-wider">
          Direct Communications
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight">
          Contact The Newsroom
        </h1>
        <p className="text-base text-neutral-500 max-w-xl mx-auto">
          Have an investigative lead, editorial tip, correction request, or advertising inquiry? Connect directly with our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Cols: Contact Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Newsroom Bureaus
            </h3>

            <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 dark:text-neutral-200 block text-sm">Headquarters</strong>
                  <p>{settings?.businessAddress || '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 dark:text-neutral-200 block text-sm">Editorial & Pitches</strong>
                  <p className="font-mono text-blue-600 dark:text-blue-400">{settings?.contactEmail || 'editor@thehorizonpost.com'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 dark:text-neutral-200 block text-sm">Direct Phone</strong>
                  <p className="font-mono">{settings?.phone || '+1 (512) 890-4421'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">
                Departmental Contacts
              </span>
              <div className="text-xs space-y-1 font-mono text-neutral-500">
                <p>Corrections: <span className="text-neutral-300">corrections@thehorizonpost.com</span></p>
                <p>Advertising & AdSense: <span className="text-neutral-300">ads@thehorizonpost.com</span></p>
                <p>Syndication: <span className="text-neutral-300">press@thehorizonpost.com</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Interactive Contact Form */}
        <div className="lg:col-span-7">
          {submitted ? (
            <div className="p-12 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center space-y-4 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-serif text-2xl font-bold">Message Dispatched Successfully</h3>
              <p className="text-sm text-neutral-500">
                Thank you for reaching out. An editor will review your inquiry within 24 business hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: 'editorial', message: '' }); }}
                className="px-6 py-2 bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Transmit a Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warren Buffett"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="editorial">Editorial Pitch / Story Tip</option>
                  <option value="correction">Factual Correction Request</option>
                  <option value="advertising">Programmatic & AdSense Inquiries</option>
                  <option value="general">General Media Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Message Body *
                </label>
                <textarea
                  rows="5"
                  placeholder="Provide comprehensive details or primary documentation links..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <span>Dispatch to Editorial Bureau</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
