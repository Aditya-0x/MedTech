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
 * Fetch generic stores from Mappls using Static Key
 */
async function locatePharmaciesMappls(userLat, userLng, radius) {
  const mapplsKey = process.env.MAPPLS_API_KEY || 'imkcskuaspxbmulyqyixixerybnflwqnuxxe';
  console.log(`🌐 Searching Mappls API around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);

  try {
    const url = `https://search.mappls.com/search/places/nearby/json`;
    const response = await axios.get(url, {
      params: {
        keywords: 'generic pharmacy;jan aushadhi',
        refLocation: `${userLat},${userLng}`,
        radius: radius,
        access_token: mapplsKey
      },
      timeout: 10000
    });

    const results = response.data?.suggestedLocations || [];
    if (results.length > 0) {
      console.log(`✅ Mappls returned ${results.length} locations`);
      let mapplsPharmacies = results.map(place => {
        const shopLat = place.latitude;
        const shopLng = place.longitude;
        const distanceKm = place.distance ? place.distance / 1000 : getHaversineDistance(userLat, userLng, shopLat, shopLng);
        
        const name = place.placeName || place.placeAddress || 'Generic Pharmacy';
        const address = place.placeAddress || 'Address not listed';
        
        let googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`;
        if (!shopLat || !shopLng) {
          googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;
        }

        return {
          id: `mappls-${place.eLoc || Date.now()}`,
          name: name,
          address: address,
          phone: place.orderUrl || place.website || 'Call not listed',
          website: googleMapsUrl,
          latitude: shopLat,
          longitude: shopLng,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          isOpen: true,
          statusText: 'Mappls Verified Location',
          isPartner: true // Explicitly searched for generic
        };
      });
      
      mapplsPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);
      return mapplsPharmacies.slice(0, 15);
    } else {
      console.log('⚠️ Mappls returned 0 results.');
      return [];
    }
  } catch (err) {
    const msg = err.response?.data?.error_description || err.response?.data?.error || err.message;
    console.error('⚠️ Mappls request failed:', msg);
    return []; 
  }
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
 * Primary location API: Uses OpenStreetMap (100% Free, No API Keys Required)
 */
async function locatePharmacies(lat, lng, radius = 20000) {
  const userLat = parseFloat(lat) || 12.9716;
  const userLng = parseFloat(lng) || 77.5946;
  
  console.log(`🌐 Searching OpenStreetMap for pharmacies around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);
  return await locatePharmaciesOSM(userLat, userLng, radius);
}

module.exports = { locatePharmacies };
