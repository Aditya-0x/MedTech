import React, { useState } from 'react';
import styles from './Contact.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    <div className={`${styles.contactContainer} animate-fade-up`}>
      {/* Refraction edge highlight */}
      <div className={styles.refractionEdge} />

      <div className={styles.grid}>
        {/* Left Side: Contact Information Cards */}
        <section className={styles.infoSection}>
          <span className={styles.metaBadge}>✉️ SECURE CHANNELS</span>
          <h1 className={styles.title}>
            Get in Touch with <br />
            <span className={styles.gradientText}>Aditya Verma</span>
          </h1>
          <p className={styles.desc}>
            Have questions about Med-Verify Pro's technology stack, health database integrations, or HIPAA privacy implementations? Submit a message below or contact us directly.
          </p>

          <div className={styles.contactDetails}>
            <div className={styles.detailCard}>
              <div className={styles.cardIcon}>📬</div>
              <div>
                <h3 className={styles.cardTitle}>Email Address</h3>
                <a href="mailto:adive00001@gmail.com" className={styles.cardLink}>adive00001@gmail.com</a>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.cardIcon}>💻</div>
              <div>
                <h3 className={styles.cardTitle}>GitHub Profile</h3>
                <a href="https://github.com/Aditya-0x" target="_blank" rel="noopener noreferrer" className={styles.cardLink}>github.com/Aditya-0x</a>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.cardIcon}>💼</div>
              <div>
                <h3 className={styles.cardTitle}>LinkedIn Profile</h3>
                <a href="https://www.linkedin.com/in/adivee" target="_blank" rel="noopener noreferrer" className={styles.cardLink}>linkedin.com/in/adivee</a>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.cardIcon}>📍</div>
              <div>
                <h3 className={styles.cardTitle}>Location</h3>
                <p className={styles.cardLink}>New Delhi, India</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Interactive Form Card */}
        <section className={styles.formCard}>
          <div className={styles.formEdge} />
          <h2 className={styles.formHeader}>Secure Contact Portal</h2>

          {success && (
            <div className={styles.alertSuccess}>
              ✉️ Message dispatched successfully! Aditya Verma will reply to your inbox shortly.
            </div>
          )}

          {error && (
            <div className={styles.alertError}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Your Name</label>
                <input 
                  type="text" 
                  placeholder="Dr. Rajesh Kumar" 
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="rajesh@clinical.org" 
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Subject</label>
              <input 
                type="text" 
                placeholder="FHIR Bundling Interoperability query" 
                className={styles.input}
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Message Body</label>
              <textarea 
                placeholder="Write your diagnostic or engineering message here..." 
                className={styles.textarea}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div className={styles.loadingRow}>
                  <div className={styles.spinner} />
                  <span>Dispatching Message...</span>
                </div>
              ) : 'Send Secure Message ➔'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
