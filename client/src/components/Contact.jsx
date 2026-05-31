import React, { useState, useEffect } from 'react';

export default function Contact({ user }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit message');

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Server error while sending feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
        
        {/* Left Side: Contact Information Cards */}
        <section className="lg:col-span-2 flex flex-col justify-center">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-full font-body text-xs font-bold tracking-widest uppercase mb-6 self-start border border-primary/20">
            ✉️ SECURE CHANNELS
          </div>
          
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface mb-6 leading-tight">
            Get in Touch with <br />
            <span className="text-primary italic">Aditya Verma</span>
          </h1>
          
          <p className="font-body text-lg text-on-surface-variant mb-12 leading-relaxed">
            Have questions about Med-Verify Pro's technology stack, health database integrations, or HIPAA privacy implementations? Submit a message below or contact us directly.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-on-primary transition-colors">📬</div>
              <div>
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Email Address</h3>
                <a href="mailto:adive00001@gmail.com" className="font-headline text-xl text-on-surface hover:text-primary transition-colors">adive00001@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-on-primary transition-colors">💻</div>
              <div>
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">GitHub Profile</h3>
                <a href="https://github.com/Aditya-0x" target="_blank" rel="noopener noreferrer" className="font-headline text-xl text-on-surface hover:text-primary transition-colors">github.com/Aditya-0x</a>
              </div>
            </div>

            <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-on-primary transition-colors">💼</div>
              <div>
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">LinkedIn Profile</h3>
                <a href="https://www.linkedin.com/in/adivee" target="_blank" rel="noopener noreferrer" className="font-headline text-xl text-on-surface hover:text-primary transition-colors">linkedin.com/in/adivee</a>
              </div>
            </div>

            <div className="flex items-center gap-5 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-on-primary transition-colors">📍</div>
              <div>
                <h3 className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Location</h3>
                <p className="font-headline text-xl text-on-surface">New Delhi, India</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Interactive Form Card */}
        <section className="lg:col-span-3">
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-8 lg:p-12 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <h2 className="font-headline text-3xl text-on-surface mb-8">Secure Contact Portal</h2>

            {success && (
              <div className="bg-tertiary-container text-on-tertiary-container p-5 rounded-xl mb-8 flex items-start gap-3 border border-tertiary/20">
                <span className="material-symbols-outlined mt-0.5">mark_email_read</span>
                <p className="font-body text-sm font-semibold">Message dispatched successfully! Aditya Verma will reply to your inbox shortly.</p>
              </div>
            )}

            {error && (
              <div className="bg-error-container text-on-error-container p-5 rounded-xl mb-8 flex items-start gap-3 border border-error/20">
                <span className="material-symbols-outlined mt-0.5">error</span>
                <p className="font-body text-sm font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm font-bold text-on-surface">Your Name</label>
                  <input 
                    type="text" 
                    placeholder="Dr. Rajesh Kumar" 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3.5 font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition disabled:opacity-50 read-only:bg-surface-variant/50 read-only:text-on-surface-variant read-only:cursor-not-allowed read-only:focus:ring-0 read-only:focus:border-outline-variant"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    disabled={loading}
                    readOnly={!!user}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm font-bold text-on-surface">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="rajesh@clinical.org" 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3.5 font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition disabled:opacity-50 read-only:bg-surface-variant/50 read-only:text-on-surface-variant read-only:cursor-not-allowed read-only:focus:ring-0 read-only:focus:border-outline-variant"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={loading}
                    readOnly={!!user}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body text-sm font-bold text-on-surface">Subject</label>
                <input 
                  type="text" 
                  placeholder="FHIR Bundling Interoperability query" 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3.5 font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition disabled:opacity-50"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body text-sm font-bold text-on-surface">Message Body</label>
                <textarea 
                  placeholder="Write your diagnostic or engineering message here..." 
                  className="w-full h-40 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3.5 font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none disabled:opacity-50"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-body font-bold text-lg hover:bg-on-primary-fixed-variant transition-colors shadow-soft mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Dispatching Message...
                  </>
                ) : (
                  <>
                    Send Secure Message <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
