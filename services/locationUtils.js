import { getOneMapToken } from './oneMapApiKey';

/**
 * Searches OneMap API for location coordinates.
 */
export async function searchLocation(query) {
  if (!query || !query.trim()) return null;

  try {
    const token = await getOneMapToken();
    const response = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
        query
      )}&returnGeom=Y&getAddrDetails=Y`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const topResult = data.results[0];
      return {
        name: topResult.BUILDING !== 'NIL' ? topResult.BUILDING : topResult.ROAD_NAME,
        lat: parseFloat(topResult.LATITUDE),
        lng: parseFloat(topResult.LONGITUDE),
      };
    }
    return null;
  } catch (error) {
    console.error('Error in searchLocation:', error);
    return null;
  }
}

/**
 * Fetches dynamic search suggestions as the user types.
 */
export async function fetchLocationSuggestions(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const token = await getOneMapToken();
    const response = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
        query
      )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 5).map((item) => ({
        id: item.BUILDING || item.ROAD_NAME || item.POSTAL,
        title: item.BUILDING !== 'NIL' ? item.BUILDING : item.ROAD_NAME,
        address: item.ADDRESS,
        lat: parseFloat(item.LATITUDE),
        lng: parseFloat(item.LONGITUDE),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

/**
 * Calculates straight-line distance in kilometers.
 */
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};