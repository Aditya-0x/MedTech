const axios = require('axios');

/**
 * Calculates the Haversine distance between two sets of coordinates in kilometers.
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Validates if a place name represents an actual pharmacy/chemist shop and filters out clinics/hospitals.
 */
function isValidPharmacy(name) {
  if (!name) return false;
  const nameLower = name.toLowerCase();

  // Match standard pharmacy/medical store keywords
  const isPharmacyOrMedical = nameLower.includes('medical') || 
                              nameLower.includes('medicine') || 
                              nameLower.includes('chemist') || 
                              nameLower.includes('druggist') || 
                              nameLower.includes('pharmacy') || 
                              nameLower.includes('pharma') || 
                              nameLower.includes('jan aushadhi') || 
                              nameLower.includes('dava') || 
                              nameLower.includes('generic') || 
                              nameLower.includes('kendra') || 
                              nameLower.includes('apothecary');

  if (!isPharmacyOrMedical) return false;

  // Exclude clinics, hospitals, diagnostics, eye doctors, homoeopaths, and vets
  const hasExclusionKeyword = nameLower.includes('veterinary') || 
                              nameLower.includes('animal') || 
                              nameLower.includes('pet') || 
                              nameLower.includes('eye') ||
                              nameLower.includes('scanning') ||
                              nameLower.includes('diagnostics') ||
                              nameLower.includes('surgeon') ||
                              nameLower.includes('gastroenterology') ||
                              nameLower.includes('hospital') ||
                              nameLower.includes('clinic') ||
                              nameLower.includes('nursing') ||
                              nameLower.includes('doctor') ||
                              nameLower.includes('dental') ||
                              nameLower.includes('dentist') ||
                              nameLower.includes('homeo') ||
                              nameLower.includes('homoeo') ||
                              nameLower.includes('optician') ||
                              nameLower.includes('optometrist') ||
                              nameLower.includes('physio') ||
                              nameLower.includes('skin') ||
                              nameLower.includes('ent') ||
                              nameLower.includes('lab');

  // Strong pharmacy keywords that override standard clinic/hospital exclusions (e.g. "City Hospital Pharmacy" is valid)
  const hasStrongOverride = nameLower.includes('pharmacy') || 
                            nameLower.includes('chemist') || 
                            nameLower.includes('druggist') || 
                            nameLower.includes('medical store') || 
                            nameLower.includes('jan aushadhi') ||
                            nameLower.includes('pmbjk');

  if (hasExclusionKeyword && !hasStrongOverride) {
    return false; // Discard pure clinic/hospital/homeo/optician listings
  }

  return true;
}

/**
 * Checks if a place name indicates a generic medicine store (Jan Aushadhi, Davadost, etc.)
 */
function isGenericPharmacy(name) {
  if (!name) return false;
  const nameLower = name.toLowerCase();
  return nameLower.includes('generic') || 
         nameLower.includes('jan aushadhi') || 
         nameLower.includes('dava') || 
         nameLower.includes('discount') ||
         nameLower.includes('pmbjk') ||
         nameLower.includes('cooperative') ||
         nameLower.includes('government');
}

/**
 * Fallback OSM Method if Ola Maps fails
 */
async function locatePharmaciesOSM(userLat, userLng, radius) {
  let osmPharmacies = [];
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
      way["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
    );
    out center;
  `;

  // Array of public Overpass API servers for resilience against 504 timeouts and rate limits
  const overpassInstances = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter'
  ];

  let response = null;
  let success = false;

  for (const url of overpassInstances) {
    try {
      console.log(`🌐 Querying OSM Overpass API at: ${url}...`);
      response = await axios.post(url, overpassQuery, {
        headers: { 'Content-Type': 'text/plain', 'User-Agent': 'MedVerifyApp/1.0' },
        timeout: 15000 // 15 seconds timeout per instance to fail fast and retry other instances
      });
      success = true;
      console.log(`✅ OSM Overpass query succeeded on: ${url}`);
      break; 
    } catch (err) {
      console.error(`⚠️ OSM query failed on instance ${url}: ${err.message}`);
    }
  }

  if (!success || !response) {
    console.error('❌ All OSM Overpass API instances failed.');
    return [];
  }

  try {
    const elements = response.data?.elements || [];
    
    // Filter out locations that don't have a name to avoid "fake" looking generic results
    const namedElements = elements.filter(el => el.tags && el.tags.name);
    
    osmPharmacies = namedElements
      .map(el => {
        const tags = el.tags || {};
        const shopLat = el.lat || el.center?.lat;
        const shopLng = el.lon || el.center?.lon;
        const name = tags.name || 'Local Pharmacy';

        if (!isValidPharmacy(name)) {
          return null;
        }

        const distanceKm = getHaversineDistance(userLat, userLng, shopLat, shopLng);

        const addressParts = [
          tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'],
          tags['addr:city'], tags['addr:postcode']
        ].filter(Boolean);
        
        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Registered pharmacy location';
        const isGeneric = isGenericPharmacy(name);

        return {
          id: `osm-${el.id}`,
          name: name,
          address: fullAddress,
          phone: tags.phone || tags['contact:phone'] || 'Call not listed',
          website: `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`,
          latitude: shopLat,
          longitude: shopLng,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          isOpen: true,
          statusText: tags.opening_hours ? `Hours: ${tags.opening_hours}` : 'Hours unknown',
          isPartner: isGeneric 
        };
      })
      .filter(Boolean);

    // If we have generic OSM pharmacies, return only them. Otherwise return all valid standard ones.
    const genericOsm = osmPharmacies.filter(p => p.isPartner);
    if (genericOsm.length > 0) {
      genericOsm.sort((a, b) => a.distanceKm - b.distanceKm);
      return genericOsm.slice(0, 15);
    }

    osmPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

  } catch (err) {
    console.error('⚠️ OSM Fallback parsing failed:', err.message);
  }

  return osmPharmacies.slice(0, 15);
}

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Helper to dynamically fetch/renew the Ola Maps access token via Client Credentials OAuth flow
 */
async function getOlaMapsToken() {
  const clientId = process.env.OLAMAPS_CLIENT_ID;
  const clientSecret = process.env.OLAMAPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('⚠️ OLAMAPS_CLIENT_ID or OLAMAPS_CLIENT_SECRET not configured. Using static API Key.');
    return process.env.OLAMAPS_API_KEY;
  }

  if (cachedToken && tokenExpiry > Date.now() + 60000) {
    return cachedToken;
  }

  console.log('🔑 Requesting new Ola Maps OAuth token...');
  try {
    const response = await axios.post(
      'https://api.olamaps.io/auth/v1/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      const expiresInMs = (response.data.expires_in || 86400) * 1000;
      tokenExpiry = Date.now() + expiresInMs;
      console.log('✅ Ola Maps token renewed successfully.');
      return cachedToken;
    } else {
      throw new Error('No access_token present in response body.');
    }
  } catch (err) {
    console.error('❌ Ola Maps OAuth flow failed:', err.response?.data || err.message);
    return process.env.OLAMAPS_API_KEY;
  }
}

/**
 * Fetch generic stores from Ola Maps Places Nearby Search API
 */
async function locatePharmaciesOla(userLat, userLng, radius) {
  console.log(`🌐 Searching Ola Maps API around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);

  try {
    const token = await getOlaMapsToken();
    const url = 'https://api.olamaps.io/places/v1/textsearch';

    // Query Ola Maps Text Search specifically using generic-related terms
    const searchQueries = ['generic pharmacy', 'Jan Aushadhi', 'generic medical store'];
    const allPredictions = [];
    const seenPlaceIds = new Set();

    for (const query of searchQueries) {
      try {
        const response = await axios.get(url, {
          params: {
            input: query,
            location: `${userLat},${userLng}`,
            radius: radius
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Request-Id': `medverify-${Date.now()}-${Math.random()}`
          },
          timeout: 10000
        });

        const predictions = response.data?.predictions || [];
        for (const place of predictions) {
          const id = place.place_id;
          if (id && !seenPlaceIds.has(id)) {
            seenPlaceIds.add(id);
            allPredictions.push(place);
          }
        }
      } catch (err) {
        console.error(`⚠️ Ola Maps Text Search failed for "${query}":`, err.message);
      }
    }

    let olaPharmacies = [];

    if (allPredictions.length > 0) {
      console.log(`✅ Ola Maps Text Search returned ${allPredictions.length} unique locations`);
      olaPharmacies = allPredictions
        .map(place => {
          const name = place.name || place.structured_formatting?.main_text || 'Pharmacy';
          const address = place.formatted_address || place.structured_formatting?.secondary_text || 'Address not listed';

          if (!isValidPharmacy(name)) {
            return null;
          }

          const shopLat = place.geometry?.location?.lat;
          const shopLng = place.geometry?.location?.lng;
          
          let distanceKm = 0;
          if (shopLat && shopLng) {
            distanceKm = getHaversineDistance(userLat, userLng, shopLat, shopLng);
          }

          const googleMapsUrl = shopLat && shopLng
            ? `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

          const isGeneric = isGenericPharmacy(name);
          if (!isGeneric) {
            return null; // For the generic text search phase, keep ONLY generic matches
          }

          return {
            id: `ola-${place.place_id || Date.now() + Math.random()}`,
            name: name,
            address: address,
            phone: 'Call not listed',
            website: googleMapsUrl,
            latitude: shopLat || null,
            longitude: shopLng || null,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            isOpen: true,
            statusText: 'Ola Maps Verified Generic Location',
            isPartner: true
          };
        })
        .filter(Boolean);
    }

    // If generic pharmacies were found, sort by distance and return them
    if (olaPharmacies.length > 0) {
      olaPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);
      return olaPharmacies.slice(0, 15);
    }

    // FALLBACK: If 0 generic pharmacies are found in Ola database, search and return standard pharmacies
    console.log('⚠️ No generic pharmacies found in Ola database. Querying nearby standard pharmacies...');
    
    const fallbackResponse = await axios.get('https://api.olamaps.io/places/v1/nearbysearch', {
      params: {
        layers: 'venue',
        types: 'pharmacy',
        location: `${userLat},${userLng}`,
        radius: radius,
        withCentroid: true
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Request-Id': `medverify-fallback-${Date.now()}`
      },
      timeout: 10000
    });

    const results = fallbackResponse.data?.predictions || [];
    if (results.length > 0) {
      console.log(`✅ Ola Maps Fallback returned ${results.length} standard pharmacies`);
      let standardPharmacies = results
        .map(place => {
          const name = place.structured_formatting?.main_text || place.description || 'Pharmacy';
          
          if (!isValidPharmacy(name)) {
            return null;
          }

          const address = place.structured_formatting?.secondary_text || place.description || 'Address not listed';
          const shopLat = place.geometry?.location?.lat;
          const shopLng = place.geometry?.location?.lng;
          
          let distanceKm = 0;
          if (shopLat && shopLng) {
            distanceKm = getHaversineDistance(userLat, userLng, shopLat, shopLng);
          } else if (place.distance_meters) {
            distanceKm = place.distance_meters / 1000;
          }

          const googleMapsUrl = shopLat && shopLng
            ? `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

          return {
            id: `ola-${place.place_id || Date.now() + Math.random()}`,
            name: name,
            address: address,
            phone: 'Call not listed',
            website: googleMapsUrl,
            latitude: shopLat || null,
            longitude: shopLng || null,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            isOpen: true,
            statusText: 'Ola Maps Verified Location',
            isPartner: false
          };
        })
        .filter(Boolean);

      standardPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);
      return standardPharmacies.slice(0, 15);
    }

    return [];
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('⚠️ Ola Maps request failed:', msg);
    return [];
  }
}

/**
 * Primary location API: Uses Ola Maps (falls back to OpenStreetMap if unavailable)
 */
async function locatePharmacies(lat, lng, radius = 20000) {
  const userLat = parseFloat(lat) || 12.9716;
  const userLng = parseFloat(lng) || 77.5946;
  
  console.log(`🌐 Searching pharmacies around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);
  
  // Try Ola Maps first
  const olaPharmacies = await locatePharmaciesOla(userLat, userLng, radius);
  if (olaPharmacies && olaPharmacies.length > 0) {
    return olaPharmacies;
  }
  
  // Fall back to OSM
  console.log(`⚠️ Ola Maps failed or returned 0 results. Falling back to OpenStreetMap...`);
  return await locatePharmaciesOSM(userLat, userLng, radius);
}

module.exports = { locatePharmacies };
