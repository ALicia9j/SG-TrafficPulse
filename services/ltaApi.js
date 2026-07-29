import { enrichCameras } from './cameraMapping';

export const LTA_API_KEY = 'jwCfMjG4SLmH+/gfrbzSuA==';
const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

async function fetchWithRetry(url, headers, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, headers, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function fetchCarparkAvail(carParkID) {
  try {
    const headers = { AccountKey: LTA_API_KEY, accept: 'application/json' };
    const data = await fetchWithRetry(`${LTA_BASE_URL}/CarParkAvailabilityv2`, headers);
    const allCarparks = data.value || [];
    return carParkID ? allCarparks.filter((cp) => cp.CarParkID === carParkID) : allCarparks;
  } catch (error) {
    console.error('Error in fetchCarparkAvail:', error);
    return [];
  }
}

export async function fetchTrafficImg(camID) {
  try {
    const headers = { AccountKey: LTA_API_KEY, accept: 'application/json' };
    const data = await fetchWithRetry(`${LTA_BASE_URL}/Traffic-Imagesv2`, headers);
    const raw = data.value || [];
    const mapped = raw.map((cam, idx) => ({
      id: cam.CameraID || String(idx),
      latitude: parseFloat(cam.Latitude),
      longitude: parseFloat(cam.Longitude),
      imageUrl: cam.ImageLink,
    }));
    const enriched = enrichCameras(mapped);
    return camID ? enriched.filter((ti) => ti.id === camID) : enriched;
  } catch (error) {
    console.error('Error in fetchTrafficImg:', error);
    return [];
  }
}

export async function fetchTrafficIncidents() {
  try {
    const response = await fetch(
      'https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents',
      {
        method: 'GET',
        headers: {
          AccountKey: LTA_API_KEY,
          accept: 'application/json',
        },
      }
    );

    // 1. Check if the HTTP request succeeded
    if (!response.ok) {
      console.warn(`LTA API returned HTTP status ${response.status}`);
      return [];
    }

    // 2. Read text first to ensure body isn't empty before parsing JSON
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn('LTA API returned empty response body');
      return [];
    }

    const data = JSON.parse(text);
    const rawIncidents = data.value || [];

    // 3. Map and sanitize incidents
    return rawIncidents
      .map((inc, index) => {
        let lat = parseFloat(inc.Latitude);
        let lng = parseFloat(inc.Longitude);

        // Extract coordinates from message string if separate fields are missing
        if ((isNaN(lat) || isNaN(lng)) && inc.Message) {
          const match = inc.Message.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
          }
        }

        let type = 'Incident';
        const msg = (inc.Message || '').toLowerCase();
        if (msg.includes('accident')) type = 'Accident';
        else if (msg.includes('roadworks') || msg.includes('work')) type = 'Roadworks';
        else if (msg.includes('breakdown') || msg.includes('vehicle')) type = 'Vehicle Breakdown';

        return {
          id: inc.IncidentID || `inc-${index}`,
          Latitude: lat,
          Longitude: lng,
          Type: type,
          Message: inc.Message || 'Traffic incident reported',
        };
      })
      .filter((inc) => !isNaN(inc.Latitude) && !isNaN(inc.Longitude));
  } catch (error) {
    console.error('Error fetching traffic incidents:', error);
    return [];
  }
}