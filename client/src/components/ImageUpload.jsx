import React, { useState, useRef, useCallback } from 'react';
import styles from './ImageUpload.module.css';

export default function ImageUpload({ onVerify, isLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [extraClaim, setExtraClaim] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setError(null);

    // Validate mime-type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(f.type)) {
      setError('Unsupported file format. Please upload a JPG, JPEG, PNG, WEBP, or GIF screenshot.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (f.size > maxSize) {
      setError('Screenshot exceeds size limit. Please upload an image smaller than 10MB.');
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };


  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFile(item.getAsFile());
        break;
      }
    }
  }, []);

  const handleSubmit = () => {
    if (!file || isLoading) return;
    const formData = new FormData();
    formData.append('image', file);
    if (extraClaim.trim()) formData.append('claim', extraClaim.trim());
    onVerify(formData);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={styles.container} onPaste={handlePaste}>
      {!preview ? (
        <>
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            id="image-upload-zone"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div className={styles.dropIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className={styles.dropTitle}>
              {dragOver ? 'Drop your screenshot here' : 'Upload Social Media Screenshot'}
            </div>
            <div className={styles.dropDesc}>
              Drag & drop, click to browse, or <span className={styles.highlight}>Ctrl+V</span> to paste
            </div>
            <div className={styles.dropFormats}>
              Supports: PNG, JPG, WEBP, GIF · Max 10MB
            </div>

            <div className={styles.dropExamples}>
              <span className={styles.examplesLabel}>Works great with:</span>
              <div className={styles.examplesPills}>
                <span className={styles.exPill}>Instagram posts</span>
                <span className={styles.exPill}>Twitter/X threads</span>
                <span className={styles.exPill}>Facebook screenshots</span>
                <span className={styles.exPill}>TikTok captions</span>
                <span className={styles.exPill}>WhatsApp forwards</span>
              </div>
            </div>
          </div>
          {error && (
            <div className={styles.errorBox} role="alert">
              <div className={styles.errorTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5e7d" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Upload Validation Error
              </div>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}
        </>
      ) : (
        <div className={styles.previewArea}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Screenshot loaded
            </div>
            <button className={styles.clearBtn} onClick={clearFile} disabled={isLoading}>
              ✕ Remove
            </button>
          </div>

          <div className={styles.imageWrapper}>
            <img src={preview} alt="Uploaded screenshot for analysis" className={styles.previewImg}/>
            <div className={styles.imageBadge}>
              <span>🔍 OCR will extract text</span>
            </div>
          </div>

          <div className={styles.extraClaimSection}>
            <label className={styles.extraLabel} htmlFor="extra-context">
              Additional context <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="extra-context"
              type="text"
              className={styles.extraInput}
              value={extraClaim}
              onChange={(e) => setExtraClaim(e.target.value)}
              placeholder="Add context or highlight a specific claim to verify..."
              disabled={isLoading}
            />
          </div>

          <div className={styles.submitRow}>
            <div className={styles.fileInfo}>
              📎 {file?.name} · {(file?.size / 1024).toFixed(0)} KB
            </div>
            <button
              id="analyze-image-btn"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinnerSmall}/>
                  Extracting & Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Analyze Screenshot
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
