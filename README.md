# SG TrafficPulse 🚗💨

SG TrafficPulse is a high-performance, cross-platform mobile application built using **React Native and Expo**. Designed as a dedicated motorist's co-pilot in Singapore, it integrates real-time Land Transport Authority (LTA) DataMall datasets and OneMap routing service into an interactive, multi-tab driver dashboard.

---

## 🌟 Key Features & Improvements

* **Interactive Map Canvas (`HomeScreen`):**
  * Displays live traffic incident markers (Accidents 💥, Roadworks 🚧, Vehicle Breakdowns 🚗) pulled from LTA DataMall with regex coordinate extraction for full reliability.
  * Tapping any pin opens a contextual bottom modal detailing the exact LTA incident advisory.
  * Native Google Maps integration with custom dark mode styling JSON support.

* **Global Map Theme Management (`MapContext`):**
  * Global state provider allowing instant switching across Standard, Satellite, and Dark map themes across all map components.

* **Route & Commute Planner (`CommuteScreen`):**
  * Integrates OneMap routing APIs to calculate real-time travel times, road segment details, and nearby carpark lot availability using custom `RouteCard` components.

* **Settings & Preferences (`SettingsScreen`):**
  * **Dynamic Local Cache Clearance:** Measures actual storage footprint using `@react-native-async-storage/async-storage` and allows instant manual cache clearing.
  * **Push & Local Notifications:** Configured via `expo-notifications` for real-time incident reports and congestion alerts, including interactive live test alerts.
  * **Legal & Compliance Viewer:** Embedded `LegalModal` component providing native modal access to Terms of Service and Privacy Policy documentation.

* **iOS & Android Stability:**
  * Uses `@react-native-safe-area-context` across all root containers to guarantee notch and home-bar compatibility (eliminating deprecated native views).
  * Robust HTTP response handling preventing `JSON Parse error: Unexpected end of input` when handling LTA API network responses.

---

## 🛠️ Tech Stack & Key Libraries

* **Framework:** Expo (React Native Core)
* **Navigation:** React Navigation (`@react-navigation/bottom-tabs`, `@react-navigation/native-stack`)
* **Map Engine:** `react-native-maps` (Google Maps Provider)
* **Safe Area Management:** `react-native-safe-area-context`
* **Local Persistence:** `@react-native-async-storage/async-storage`
* **Notifications Engine:** `expo-notifications`
* **External APIs:**
  * [LTA DataMall API](https://datamall.lta.gov.sg/) (Traffic Incidents, Carpark Availability)
  * [OneMap API](https://www.onemap.gov.sg/apidocs/) (Route Planning & Geocoding)

---

## 📂 Component Directory Blueprint

The project follows a modular, feature-based file architecture layout:

```text
📦 sg-trafficpulse
 ┣ 📂 components        # Reusable custom interface cards and bottom sheets
 ┃ ┣ 📜 RouteCard.js    # Card template displaying live congestion & carpark data
 ┃ ┗ 📜 LegalModal.js   # Contextual modal container for ToS & Privacy Policy
 ┣ 📂 context           # Global state providers and static legal data
 ┃ ┣ 📜 MapContext.js   # Global map theme state provider (Standard / Satellite / Dark)
 ┃ ┗ 📜 legalText.js    # Terms of Service & Privacy Policy boilerplate text
 ┣ 📂 screens           # Primary screen views
 ┃ ┣ 📜 HomeScreen.js   # Absolute layout mapping backdrop with LTA incident pins
 ┃ ┣ 📜 CommuteScreen.js# Saved route planner dashboard and carpark feed
 ┃ ┗ 📜 SettingsScreen.js# Map preferences, notifications, cache cleaner, and legal links
 ┣ 📂 services          # Core business services & utilities
 ┃ ┣ 📜 cameraMapping.js       # Maps traffic camera IDs to road coordinates & expressways
 ┃ ┣ 📜 locationUtils.js       # Distance calculations & coordinate parsing helpers
 ┃ ┣ 📜 ltaApi.js              # Fetches LTA DataMall incidents, cameras, and carpark data
 ┃ ┣ 📜 notificationService.js # Expo Notification channels, permissions, & local alerts
 ┃ ┣ 📜 oneMapApiKey.js        # Authentication credentials & token management for OneMap API
 ┃ ┣ 📜 routeService.js        # Routing calculation & polyline decoding service
 ┃ ┗ 📜 tripPlannerService.js  # Multi-modal route assembly & trip optimization logic
 ┣ 📜 App.js            # Main application entry point initializing global state & tabs
 ┗ 📜 package.json      # System dependencies and npm scripts
 ```
