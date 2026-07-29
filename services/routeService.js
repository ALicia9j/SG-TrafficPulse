import { getOneMapToken } from './oneMapApiKey'

export const getRouteInfo = async (start, end, routeType = 'drive') => {
  try {
    //  Retrieve valid token (refreshes automatically if expired)
    const token = await getOneMapToken();

    if (!token) {
      throw new Error('Authentication token could not be obtained.');
    }

    // Query OneMap Routing API
    const url = `https://www.onemap.gov.sg/api/public/routing/route?start=${start.lat},${start.lng}&end=${end.lat},${end.lng}&routeType=${routeType}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();

    if (data.route_summary) {
      // Total travel time in minutes
      const timeInMinutes = Math.round(data.route_summary.total_time / 60);

      // Total distance in kilometers
      const distanceKm = (data.route_summary.total_distance / 1000).toFixed(1);

      // Extract unique road/expressway names passed through (e.g., PIE, CTE, Orchard Rd)
      const roadsPassed = [
        ...new Set(
          data.route_instructions
            .map((step) => step[1]) // Index 1 contains road/street names in instruction steps
            .filter((roadName) => roadName && roadName.trim() !== '')
        ),
      ];

      return {
        estimatedTimeMins: timeInMinutes,
        distanceKm: distanceKm,
        // Array of road names (e.g., ["Pan Island Expressway", "Central Expressway"])
        roadsPassedThrough: roadsPassed, 
        summaryText: data.route_summary.start_point + ' to ' + data.route_summary.end_point,
        // Used if drawing lines on a map later
        rawGeometry: data.route_geometry, 
      };
    } else {
      throw new Error('No route found between these locations.');
    }
  } catch (error) {
    console.error('Error fetching route info:', error);
    return null;
  }
};