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
 * Parses OSM `opening_hours` format (e.g., "Mo-Su 09:00-21:00", "24/7", "Mo-Sa 09:00-18:00")
 * returns { isOpen: boolean, statusText: string }
 */
function parseOpeningHours(openingHoursStr, userLocalTime = new Date()) {
  if (!openingHoursStr) {
    // If opening hours are missing, we default to standard pharmacy hours (09:00 - 21:00)
    return evaluateStandardHours("Mo-Su 09:00-21:00", userLocalTime);
  }

  const cleanHours = openingHoursStr.trim().toLowerCase();

  if (cleanHours === '24/7' || cleanHours.includes('24 hours') || cleanHours === 'mo-su 00:00-24:00') {
    return { isOpen: true, statusText: 'Open 24/7' };
  }

  try {
    return evaluateStandardHours(openingHoursStr, userLocalTime);
  } catch (e) {
    // Fallback in case parsing errors out
    return { isOpen: true, statusText: 'Open • Call to confirm hours' };
  }
}

/**
 * Helper to parse and evaluate standard daily hour structures
 */
function evaluateStandardHours(hoursStr, now) {
  const currentDayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
  const daysShort = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  const currentDay = daysShort[currentDayIndex];
  
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeVal = currentHour * 60 + currentMin; // minutes since midnight

  // Split schedules by semicolon (e.g. "Mo-Sa 09:00-18:00; Su 10:00-16:00")
  const parts = hoursStr.split(';');

  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (!trimmed) continue;

    // Check if this part applies to the current day
    let dayMatch = false;

    if (trimmed.includes('mo-su') || trimmed.includes('daily') || trimmed.includes('mo-sa') || trimmed.includes('we-su')) {
      // General ranges
      if (trimmed.includes('mo-su') || trimmed.includes('daily')) {
        dayMatch = true;
      } else if (trimmed.includes('mo-sa') && currentDay !== 'su') {
        dayMatch = true;
      } else if (trimmed.includes('we-su') && (currentDayIndex >= 3 || currentDayIndex === 0)) {
        dayMatch = true;
      }
    } else {
      // Check for specific days (e.g., "mo,we,fr" or single days like "su")
      const dayTokens = trimmed.split(/\s+/)[0]; // get day section (e.g., "mo,we,fr")
      if (dayTokens.includes(currentDay)) {
        dayMatch = true;
      }
    }

    if (dayMatch) {
      // Extract time range (e.g. "09:00-18:00")
      const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const startHour = parseInt(timeMatch[1], 10);
        const startMin = parseInt(timeMatch[2], 10);
        const endHour = parseInt(timeMatch[3], 10);
        const endMin = parseInt(timeMatch[4], 10);

        const startTimeVal = startHour * 60 + startMin;
        const endTimeVal = endHour * 60 + endMin;

        if (currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal) {
          const formattedEnd = `${endHour > 12 ? endHour - 12 : endHour}:${endMin < 10 ? '0' + endMin : endMin} ${endHour >= 12 ? 'PM' : 'AM'}`;
          return { isOpen: true, statusText: `Open Now • Closes at ${formattedEnd}` };
        } else {
          const formattedStart = `${startHour > 12 ? startHour - 12 : startHour}:${startMin < 10 ? '0' + startMin : startMin} ${startHour >= 12 ? 'PM' : 'AM'}`;
          return { isOpen: false, statusText: `Closed • Opens at ${formattedStart}` };
        }
      }
    }
  }

  // If no day matches, default fallback
  return { isOpen: true, statusText: 'Open Now • Closes at 9:00 PM' };
}

/**
 * Queries OpenStreetMap Overpass API for pharmacies near a latitude and longitude,
 * calculates Haversine distance, and sorts in ascending order.
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [radius=8000] - Radius in meters
 * @returns {Promise<Array>} List of sorted pharmacies
 */
async function locatePharmacies(lat, lng, radius = 10000) {
  // If coordinates are invalid, default to a sensible fallback (e.g. Kanakapura, Bangalore coordinates)
  const userLat = parseFloat(lat) || 12.9716;
  const userLng = parseFloat(lng) || 77.5946;

  console.log(`🌐 Searching pharmacies around lat: ${userLat}, lng: ${userLng} within ${radius}m...`);

  let osmPharmacies = [];

  try {
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
        way["amenity"="pharmacy"](around:${radius}, ${userLat}, ${userLng});
      );
      out center;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await axios.post(url, overpassQuery, {
      headers: { 
        'Content-Type': 'text/plain',
        'User-Agent': 'MedVerify/1.0.0 (https://medverify-pro.vercel.app; contact@medverify-pro.org)'
      },
      timeout: 12000
    });

    const elements = response.data?.elements || [];

    osmPharmacies = elements.map(el => {
      const tags = el.tags || {};
      const shopLat = el.lat || el.center?.lat;
      const shopLng = el.lon || el.center?.lon;

      // Calculate exact distance
      const distanceKm = getHaversineDistance(userLat, userLng, shopLat, shopLng);

      // Parse opening hours status
      const hoursStatus = parseOpeningHours(tags.opening_hours);

      // Synthesize address
      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'],
        tags['addr:city'],
        tags['addr:postcode']
      ].filter(Boolean);
      
      const fullAddress = addressParts.length > 0
        ? addressParts.join(', ')
        : 'Registered pharmacy location';

      return {
        id: `osm-${el.id}`,
        name: tags.name || 'Local Pharmacy',
        address: fullAddress,
        phone: tags.phone || tags['contact:phone'] || 'Call not listed',
        website: tags.website || 'Website not listed',
        latitude: shopLat,
        longitude: shopLng,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        isOpen: hoursStatus.isOpen,
        statusText: hoursStatus.statusText,
        isPartner: false
      };
    });

  } catch (err) {
    console.error('⚠️ OpenStreetMap Overpass query failed:', err.message);
    // Continue so that simulated generic shops can still load even if Overpass API is down / timed out!
  }

  // Sort them strictly by ascending distance
  osmPharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

  // Return the top 15 closest shops
  return osmPharmacies.slice(0, 15);
}

module.exports = { locatePharmacies };
