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
 * Fallback OSM Method if Mappls fails
 */
async function locatePharmaciesOSM(userLat, userLng, radius) {
  let osmPharmacies = [];
  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
        way["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
      );
      out center;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await axios.post(url, overpassQuery, {
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'MedVerifyApp/1.0' },
      timeout: 20000
    });

    const elements = response.data?.elements || [];
    
    // Filter out locations that don't have a name to avoid "fake" looking generic results
    const namedElements = elements.filter(el => el.tags && el.tags.name);
    
    osmPharmacies = namedElements.map(el => {
      const tags = el.tags || {};
      const shopLat = el.lat || el.center?.lat;
      const shopLng = el.lon || el.center?.lon;
      const distanceKm = getHaversineDistance(userLat, userLng, shopLat, shopLng);

      const addressParts = [
        tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'],
        tags['addr:city'], tags['addr:postcode']
      ].filter(Boolean);
      
      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Registered pharmacy location';
      const name = tags.name || 'Local Pharmacy';
      const isGeneric = name.toLowerCase().includes('generic') || name.toLowerCase().includes('jan aushadhi') || name.toLowerCase().includes('discount');

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
    });

  } catch (err) {
    console.error('⚠️ OSM Fallback failed:', err.message);
  }

  osmPharmacies.sort((a, b) => {
    if (a.isPartner && !b.isPartner) return -1;
    if (!a.isPartner && b.isPartner) return 1;
    return a.distanceKm - b.distanceKm;
  });

  return osmPharmacies.slice(0, 15);
}

/**
 * Primary location API: Attempts Ola Maps, falls back to OSM
 */
async function locatePharmacies(lat, lng, radius = 20000) {
  const userLat = parseFloat(lat) || 12.9716;
  const userLng = parseFloat(lng) || 77.5946;
  
  const olaMapsKey = process.env.OLA_MAPS_API_KEY || 'iTZHFzXV3uzDZnj3zALr';

  console.log(`🌐 Searching Ola Krutrim Maps API around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);

  try {
    const url = 'https://api.olamaps.io/places/v1/nearbysearch';
    const response = await axios.get(url, {
      params: {
        location: `${userLat},${userLng}`,
        types: 'pharmacy',
        radius: radius,
        api_key: olaMapsKey
      },
      headers: {
        'X-Request-Id': Date.now().toString()
      },
      timeout: 10000
    });

    // Ola Maps typically returns a 'predictions' or 'results' array
    const results = response.data?.predictions || response.data?.results || [];
    
    if (results.length > 0) {
      console.log(`✅ Ola Krutrim Maps returned ${results.length} locations`);
      let olaPharmacies = results.map(place => {
        const location = place.geometry?.location || place.location || {};
        const shopLat = location.lat;
        const shopLng = location.lng;
        // Calculate distance if not provided by API
        const distanceKm = place.distance ? place.distance / 1000 : getHaversineDistance(userLat, userLng, shopLat, shopLng);
        
        const name = place.name || place.description || 'Local Pharmacy';
        const isGeneric = name.toLowerCase().includes('generic') || name.toLowerCase().includes('jan aushadhi') || name.toLowerCase().includes('davaindia');
        const formattedAddress = place.formatted_address || place.vicinity || 'Address not listed';

        return {
          id: `ola-${place.place_id || place.id || Date.now()}`,
          name: name,
          address: formattedAddress,
          phone: place.formatted_phone_number || place.phone || 'Call not listed', 
          website: `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`,
          latitude: shopLat,
          longitude: shopLng,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          isOpen: place.opening_hours ? (place.opening_hours.open_now !== false) : true,
          statusText: 'Ola Maps Verified Location',
          isPartner: isGeneric
        };
      });

      olaPharmacies.sort((a, b) => {
        if (a.isPartner && !b.isPartner) return -1;
        if (!a.isPartner && b.isPartner) return 1;
        return a.distanceKm - b.distanceKm;
      });

      return olaPharmacies.slice(0, 15);
    } else {
      console.log('⚠️ Ola Maps returned 0 results. Falling back to OSM...');
    }

  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    console.error(`⚠️ Ola Maps API failed (Status: ${status}):`, msg);
    console.log('🔄 Initiating OpenStreetMap Fallback...');
  }

  // If Ola Maps fails (e.g. 401 Unauthorized, invalid key) or returns 0 results, fall back to OpenStreetMap
  return await locatePharmaciesOSM(userLat, userLng, radius);
}

module.exports = { locatePharmacies };
