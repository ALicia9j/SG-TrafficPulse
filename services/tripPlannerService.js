import { searchLocation, getDistanceKm } from './locationUtils';
import { getOneMapToken } from './oneMapApiKey';
import { fetchCarparkAvail, fetchTrafficIncidents } from './ltaApi';

export async function planTrip(start, destination, routeType = 'drive') {
  try {
    // 1. Resolve coordinates
    let startCoords = typeof start === 'string' ? await searchLocation(start) : start;
    let destCoords = typeof destination === 'string' ? await searchLocation(destination) : destination;

    if (!startCoords || !destCoords) {
      throw new Error('Unable to find location. Please check location names.');
    }

    // 2. Fetch fresh token & query OneMap Routing API
    const token = await getOneMapToken();
    if (!token) {
      throw new Error('Failed to retrieve OneMap API token.');
    }

    const startStr = `${startCoords.lat},${startCoords.lng}`;
    const endStr = `${destCoords.lat},${destCoords.lng}`;
    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${startStr}&end=${endStr}&routeType=${routeType}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.route_summary) {
      console.error('OneMap Routing Error payload:', data);
      throw new Error(data.error || 'Failed to fetch route from OneMap');
    }

    // 3. Calculate time in minutes
    const totalMins = Math.round(data.route_summary.total_time / 60);

    // Extract road names passed along the trip
    const roadsPassed = [
      ...new Set(
        (data.route_instructions || [])
          .map((step) => step[1])
          .filter((road) => road && road.trim() !== '')
      ),
    ];

    // 4. Fetch live LTA carpark availability & traffic incidents in parallel
    const [carparks, incidents] = await Promise.all([
      fetchCarparkAvail(),
      fetchTrafficIncidents(),
    ]);

    // Find nearest carpark lots near destination (within 1.5 km)
    let availableLots = 'N/A';
    let nearestDist = Infinity;

    if (Array.isArray(carparks)) {
      carparks.forEach((cp) => {
        if (cp.Location) {
          const [cpLat, cpLng] = cp.Location.split(' ').map(Number);
          if (!isNaN(cpLat) && !isNaN(cpLng)) {
            const dist = getDistanceKm(destCoords.lat, destCoords.lng, cpLat, cpLng);
            if (dist < nearestDist && dist <= 1.5) {
              nearestDist = dist;
              availableLots = cp.AvailableLots ?? 0;
            }
          }
        }
      });
    }

    // Match relevant road incidents
    const relevantIncidents = (incidents || [])
      .filter((inc) =>
        roadsPassed.some((road) =>
          inc.message?.toLowerCase().includes(road.toLowerCase())
        )
      )
      .map((inc) => inc.message);

    // Format segment statuses for RouteCard
    const routeStatuses = roadsPassed.slice(0, 3).map((road, idx) => ({
      from: road,
      to: roadsPassed[idx + 1] ? ` → ${roadsPassed[idx + 1]}` : '',
      label: relevantIncidents.length > 0 ? 'Heavy Traffic' : 'Smooth',
      type: relevantIncidents.length > 0 ? 'heavy' : 'smooth',
    }));

    // 5. Construct object matching RouteCard.js props
    return {
      title: `${startCoords.name} → ${destCoords.name}`,
      estimatedTime: `${totalMins} mins`,
      status: relevantIncidents.length > 0 ? 'Moderate Traffic' : 'Smooth Traffic',
      availableLots: availableLots,
      routeStatuses: routeStatuses.length > 0 ? routeStatuses : [
        { from: startCoords.name, to: ` → ${destCoords.name}`, label: 'Smooth', type: 'smooth' }
      ],
      incidents: relevantIncidents.length > 0 ? relevantIncidents : ['No major road incidents reported.'],
    };
  } catch (error) {
    console.error('Error in planTrip:', error);
    throw error;
  }
}