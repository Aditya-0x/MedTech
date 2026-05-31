import React, { useState, useEffect, useRef } from 'react';

export default function GenericFinder({ theme }) {
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [brandSearch, setBrandSearch] = useState('');
  
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('checking'); // 'checking' | 'active' | 'denied'
  const [gpsAddress, setGpsAddress] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const fetchCoordinates = () => {
    setGpsStatus('checking');
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsStatus('active');
        setGpsAddress(`GPS Locked (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        console.warn('GPS Denied:', err);
        setGpsStatus('denied');
        setLatitude(12.9716);
        setLongitude(77.5946);
        setGpsAddress('GPS Access Denied. Using demonstration coordinates (Bengaluru, IN).');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        setError('Unsupported format. Please upload a valid image file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file) => {
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !brandSearch.trim()) {
      setError('Please upload a prescription image or enter a brand medicine name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (imageFile) {
      formData.append('image', imageFile);
    } else {
      formData.append('brandSearch', brandSearch);
    }
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);

    try {
      const response = await fetch('/api/generic/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error during drug analysis.');
      setResult(data);
      setTimeout(() => {
        const resSec = document.getElementById('trumeds-results');
        if (resSec) resSec.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while communicating with the TruMeds engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setBrandSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <header className="text-center mb-16 animate-fade-in-up">
        <div className="inline-block bg-secondary-container/40 text-on-secondary-container px-4 py-1.5 rounded-full font-body text-sm font-bold tracking-wider uppercase mb-6 border border-secondary/20">
          💊 TruMeds Generic Finder
        </div>
        <h1 className="font-headline text-5xl md:text-6xl text-on-surface mb-6 leading-tight">Prescription Analyzer & Shop Locator</h1>
        <p className="font-body text-xl text-on-surface-variant max-w-3xl mx-auto">
          Upload doctor prescriptions or medicine strips to find generic chemical formulations 
          and locate local Indian pharmacies or Jan Aushadhi Kendras sorted by real-time distance.
        </p>
      </header>

      {!result && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Uploader Column */}
          <div className="bg-surface-container-low hand-drawn-border p-8 shadow-soft relative overflow-hidden hover:-translate-y-2 hover:shadow-float transition-all duration-300">
            <h2 className="font-headline text-2xl text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
              Option A: Upload Prescription
            </h2>
            <form 
              className={`w-full h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-primary bg-primary/5' : 'border-outline-variant/80 hover:border-primary/50 hover:bg-surface-container-highest'}`}
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" capture="environment" />
              {!imagePreview ? (
                <>
                  <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4 text-primary">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <p className="font-body text-lg text-on-surface font-semibold mb-2">Drag & drop or click to browse</p>
                  <p className="font-body text-sm text-on-surface-variant">Supports JPEG, PNG, WEBP. Tap on mobile to snap photo.</p>
                </>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <img src={imagePreview} alt="Preview" className="max-h-full rounded-xl object-contain shadow-soft" />
                  <button type="button" className="absolute top-2 right-2 bg-error text-on-error w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-error/90 transition" onClick={removeSelectedImage} title="Remove image">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Search Column */}
          <div className="bg-surface-container-lowest hand-drawn-border p-8 shadow-soft flex flex-col hover:-translate-y-2 hover:shadow-float transition-all duration-300">
            <h2 className="font-headline text-2xl text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary text-3xl">keyboard</span>
              Option B: Search Manually
            </h2>
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <label className="font-body text-sm font-bold text-on-surface mb-2 block">Brand Name Medicine</label>
                <div className="relative mb-6">
                  <span className="material-symbols-outlined absolute left-4 top-3.5 text-secondary">search</span>
                  <input 
                    type="text" 
                    placeholder="e.g., Lipitor, Tylenol, Humira..." 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-12 pr-4 py-3.5 font-body text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition disabled:opacity-50"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    disabled={!!imageFile}
                  />
                </div>
                {imageFile && (
                  <p className="font-body text-xs text-primary bg-primary/10 px-3 py-2 rounded-md border border-primary/20">
                    💡 Image prescription is selected. Clear image to search manually by name.
                  </p>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between bg-surface-container p-4 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      {gpsStatus === 'checking' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${gpsStatus === 'active' ? 'bg-tertiary' : gpsStatus === 'checking' ? 'bg-primary' : 'bg-error'}`}></span>
                    </div>
                    <div>
                      <p className="font-body text-xs font-bold text-on-surface uppercase tracking-wider mb-0.5">GPS Location</p>
                      <p className="font-body text-sm text-on-surface-variant line-clamp-1">{gpsAddress || 'Retrieving...'}</p>
                    </div>
                  </div>
                  {gpsStatus === 'denied' && (
                    <button type="button" className="text-primary hover:bg-primary/10 p-2 rounded-full transition" onClick={fetchCoordinates} title="Retry GPS">
                      <span className="material-symbols-outlined">sync</span>
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-body text-sm flex items-start gap-2 border border-error/20">
                    <span className="material-symbols-outlined text-error">error</span> <span>{error}</span>
                  </div>
                )}

                <button 
                  type="button" 
                  className={`w-full bg-primary text-on-primary py-4 rounded-xl font-body font-bold text-lg hover:bg-on-primary-fixed-variant transition-colors shadow-soft flex items-center justify-center gap-2 ${isLoading ? 'opacity-50' : ''}`}
                  onClick={handleSearchSubmit}
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined">rocket_launch</span>
                  Search Generics & Nearby Shops
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 min-h-[50vh] text-center animate-fade-in-up">
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
             <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <span className="text-4xl">🩺</span>
          </div>
          <h2 className="font-headline text-3xl text-on-surface mb-3">TruMeds Engine Processing...</h2>
          <p className="font-body text-on-surface-variant max-w-lg mx-auto">
            {imageFile 
              ? 'Analyzing visual prescription via Gemini OCR & mapping clinical compounds...'
              : 'Mapping brand pharmacology and scanning Overpass pharmacy coordinates...'}
          </p>
        </div>
      )}

      {result && !isLoading && (
        <div id="trumeds-results" className="animate-fade-in-up pt-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Left Result Column: Chemical Synthesis Report */}
            <div className="xl:col-span-3 flex flex-col gap-6">
              <div className="bg-surface-container-lowest hand-drawn-border p-8 lg:p-10 shadow-soft hover:-translate-y-2 hover:shadow-float transition-all duration-300">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-headline text-3xl text-on-surface mb-2">{result.report.brandName} Equivalent</h3>
                    <p className="font-body text-primary font-bold tracking-widest uppercase text-sm">🧬 {result.report.therapeuticClass}</p>
                  </div>
                  <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-body text-xs font-semibold flex items-center gap-1 border border-secondary/20">
                    <span className="material-symbols-outlined text-[14px]">smart_toy</span> {result.report.modelUsed.replace('google/', '')}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-surface-container-low p-6 rounded-2xl mb-8 border border-outline-variant/40">
                  <div className="flex-1 bg-surface py-3 px-4 rounded-xl text-center border border-outline-variant/40 shadow-sm font-headline text-xl text-on-surface truncate">{result.report.brandName}</div>
                  <span className="material-symbols-outlined text-primary text-3xl">arrow_forward</span>
                  <div className="flex-1 bg-primary text-on-primary py-3 px-4 rounded-xl text-center shadow-md font-headline text-xl truncate">{result.report.genericName}</div>
                </div>

                <div className="mb-8">
                  <h4 className="font-body text-sm font-bold text-on-surface uppercase tracking-widest mb-3 border-b border-outline-variant/40 pb-2">Clinical Description</h4>
                  <p className="font-body text-on-surface-variant leading-relaxed">{result.report.clinicalUsage}</p>
                </div>

                <div className="mb-8">
                  <h4 className="font-body text-sm font-bold text-on-surface uppercase tracking-widest mb-3 border-b border-outline-variant/40 pb-2">Dosage & Formulation</h4>
                  <p className="font-body text-on-surface-variant bg-surface-variant/30 inline-block px-4 py-2 rounded-lg">💊 {result.report.dosageFormulation}</p>
                </div>

                {/* Savings Visualizer Bar Chart */}
                {result.report.avgPriceBrand > 0 && result.report.avgPriceGeneric > 0 ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-end mb-6 relative z-10">
                      <h4 className="font-headline text-2xl text-on-surface">Cost Savings Analysis</h4>
                      <span className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full font-body font-bold text-sm shadow-sm">✨ Save {result.report.savingsPercentage}%</span>
                    </div>
                    
                    <div className="space-y-4 relative z-10 font-body">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-on-surface-variant">Brand Name Cost (Avg):</span>
                          <span className="font-bold text-error">₹{result.report.avgPriceBrand.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-error-container h-3 rounded-full overflow-hidden">
                          <div className="bg-error h-full w-full"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-on-surface-variant">TruMeds Generic Cost:</span>
                          <span className="font-bold text-tertiary">₹{result.report.avgPriceGeneric.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-tertiary-container h-3 rounded-full overflow-hidden">
                          <div className="bg-tertiary h-full transition-all duration-1000" style={{ width: `${(result.report.avgPriceGeneric / result.report.avgPriceBrand) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-secondary mt-4 font-body opacity-80">* Estimated average relative savings per 30-day course supply (in INR).</p>
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 mb-8">
                    <h4 className="font-headline text-xl text-on-surface mb-2">🇮🇳 Indian Market Pricing Analysis</h4>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      Detailed retail MRP data is currently unavailable for this specific medicine in our database. 
                      Please consult your local Pradhan Mantri Bhartiya Janaushadhi Kendra or registered pharmacist for verified price lists.
                    </p>
                  </div>
                )}

                <div className="mb-8">
                  <h4 className="font-body text-sm font-bold text-error uppercase tracking-widest mb-3 border-b border-error/20 pb-2">Contraindications & Safety</h4>
                  <ul className="space-y-2">
                    {result.report.safetyPrecautions.map((prec, idx) => (
                      <li key={idx} className="flex gap-3 font-body text-on-surface-variant text-sm">
                        <span className="text-error">⚠️</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button type="button" className="w-full bg-surface-container hover:bg-surface-variant text-on-surface py-3 rounded-xl font-body font-bold transition-colors border border-outline-variant/40" onClick={handleReset}>
                  🔍 Look Up Another Prescription
                </button>
              </div>
            </div>

            {/* Right Result Column: Pharmacy Locator list */}
            <div className="xl:col-span-2">
              <div className="bg-surface-container-lowest hand-drawn-border p-6 lg:p-8 shadow-soft h-full flex flex-col hover:-translate-y-2 hover:shadow-float transition-all duration-300">
                <div className="mb-6">
                  <h3 className="font-headline text-2xl text-on-surface mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">storefront</span> Nearby Pharmacies
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant">Sorted by ascending distance from your location</p>
                </div>

                <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                  {result.pharmacies && result.pharmacies.length > 0 ? (
                    result.pharmacies.map((shop) => (
                      <div key={shop.id} className={`p-5 rounded-2xl border transition-all ${shop.isPartner ? 'bg-primary/5 border-primary/30 shadow-[0_4px_12px_rgba(194,101,42,0.08)]' : 'bg-surface border-outline-variant/40 hover:border-outline-variant'}`}>
                        {shop.isPartner && (
                          <div className="inline-block bg-primary text-on-primary font-body text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded mb-3">
                            ✨ Med-Verify Savings Partner
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-headline text-lg text-on-surface leading-tight">{shop.name}</h4>
                          <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-xs font-body whitespace-nowrap border border-outline-variant/30">
                            {shop.distanceKm} km
                          </span>
                        </div>

                        <p className="font-body text-sm text-on-surface-variant mb-4 flex items-start gap-1">
                          <span className="material-symbols-outlined text-[16px] mt-0.5 text-secondary">location_on</span> 
                          {shop.address}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-5">
                          <span className={`font-body text-xs font-bold px-2 py-1 rounded border ${shop.isOpen ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' : 'bg-surface-variant text-on-surface-variant border-outline-variant/40'}`}>
                            {shop.statusText}
                          </span>
                          
                          {shop.isPartner && shop.partnerBenefit && (
                            <span className="font-body text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                              🎁 {shop.partnerBenefit}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <a 
                            href={`tel:${shop.phone.replace(/[^\d+]/g, '')}`} 
                            className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg font-body text-sm font-semibold transition-colors ${shop.phone === 'Call not listed' ? 'bg-surface-container text-outline cursor-not-allowed border border-outline-variant/30' : 'bg-secondary-container text-on-secondary-container hover:bg-secondary/20 border border-secondary/20'}`}
                            title={shop.phone}
                            onClick={e => shop.phone === 'Call not listed' && e.preventDefault()}
                          >
                            <span className="material-symbols-outlined text-[18px]">call</span> Call
                          </a>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex-1 flex justify-center items-center gap-1.5 bg-surface text-primary border border-primary/30 hover:bg-primary/5 py-2 rounded-lg font-body text-sm font-semibold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">directions</span> Directions
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center text-on-surface-variant font-body">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">wrong_location</span>
                      <p>No pharmacies matching coordinates inside current search radius.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
