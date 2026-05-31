import React, { useState, useRef, useCallback } from 'react';

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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(f.type)) {
      setError('Unsupported file format. Please upload a JPG, JPEG, PNG, WEBP, or GIF screenshot.');
      return;
    }

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
    <div className="w-full h-full flex flex-col p-4" onPaste={handlePaste}>
      {!preview ? (
        <>
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 transform group hover:scale-[1.01] hover:shadow-float ${dragOver ? 'border-primary bg-primary/10 animate-sexy-pulse' : 'border-outline-variant/60 hover:border-primary/80 bg-surface-container-low/50'}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <span className="material-symbols-outlined text-5xl text-primary mb-4 group-hover:animate-float-sexy group-hover:text-tertiary transition-colors">image</span>
            <div className="font-headline text-3xl text-on-surface mb-2 group-hover:text-primary transition-colors">
              {dragOver ? 'Drop it like it\'s hot' : 'Upload Social Media Screenshot'}
            </div>
            <div className="font-body text-on-surface-variant text-sm mb-4">
              Drag & drop, click to browse, or <span className="font-bold text-primary">Ctrl+V</span> to paste
            </div>
            <div className="font-body text-xs text-secondary bg-surface-variant/50 px-4 py-2 rounded-full shadow-sm group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
              Supports: PNG, JPG, WEBP, GIF · Max 10MB
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-error-container text-on-error-container rounded-lg font-body text-sm flex gap-2 items-center">
              <span className="material-symbols-outlined text-error">error</span>
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="font-body text-primary font-medium flex gap-2 items-center">
              <span className="material-symbols-outlined">check_circle</span> Screenshot loaded
            </div>
            <button className="text-error hover:underline text-sm font-body" onClick={clearFile} disabled={isLoading}>
              ✕ Remove
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-outline-variant max-h-48 flex justify-center bg-surface-container-lowest">
            <img src={preview} alt="Uploaded screenshot" className="object-contain h-full"/>
            <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-body shadow-sm">
              🔍 OCR will extract text
            </div>
          </div>

          <div>
             <input
               type="text"
               className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
               value={extraClaim}
               onChange={(e) => setExtraClaim(e.target.value)}
               placeholder="Add context or highlight a specific claim... (optional)"
               disabled={isLoading}
             />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <div className="text-xs text-secondary font-body">
              📎 {file?.name} · {(file?.size / 1024).toFixed(0)} KB
            </div>
            <button
              className={`bg-gradient-to-r from-primary to-tertiary text-on-primary px-8 py-3 rounded-lg font-body font-medium hover:from-primary-container hover:to-tertiary-container hover:text-on-primary-container hover:scale-105 hover:shadow-float transition-all duration-300 shadow-soft flex items-center gap-2 group ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:animate-sexy-pulse'}`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  Extracting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">analytics</span>
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
