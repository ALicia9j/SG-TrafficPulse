# SG TrafficPulse 

SG TrafficPulse is a high-performance, cross-platform mobile application built using **React Native and Expo**. It acts as a dedicated motorist's co-pilot in Singapore, overlaying real-time Land Transport Authority (LTA) DataMall datasets—including traffic speeds, live camera feeds, road incidents, and regional carpark availability—onto a single, interactive, edge-to-edge geospatial canvas.

---

##  Architecture & Core Features

* **Layered Overlay Interface:** Uses an edge-to-edge backdrop map canvas with absolute-positioned floating UI controllers to maximize map visibility for active drivers.
* **Concurrent Data Ingestion (`Promise.all`):** Eliminates network bottlenecks by fetching live streams (Traffic Images, Incidents, Speed Bands) concurrently in parallel promises rather than sequentially.
* **Demand-Driven Caching Throttle:** Evaluates a strict 5-minute client-side time-to-live (TTL) cache window before initiating outbound API pings, saving user data and lowering battery consumption.
* **Contextual Data Filtering:** Lazily initializes resource-heavy datasets (like live carpark lot availability) within specialized bottom-sheet modals or saved route dashboards rather than overcrowding the master map view.

---
## Tech Stack & Key Libraries
* **Framework:** Expo (React Native Core)
* **Navigation:** React Navigation (@react-navigation/bottom-tabs, @react-navigation/native-stack)
* **Maps Engine:** react-native-maps (Geospatial rendering canvas)
* **Persistent Preferences Store:** @react-native-async-storage/async-storage (Preserves notifications and map configurations)

---
##  Component Directory Blueprint

The project follows a modular, feature-based file architecture layout:

```text
📦 sg-trafficpulse
 ┣ 📂 assets            # Custom icons, vector speedometer graphics, and splash frames
 ┣ 📂 components        # Reusable custom interface cards and bottom sheets
 ┃ ┣ 📜 RouteCard.js    # Card template displaying live congestion & carpark data
 ┃ ┗ 📜 BottomSheet.js  # Lazy-loaded contextual camera snapshot overlay
 ┣ 📂 screens           # Root View screen containers
 ┃ ┣ 📜 HomeScreen.js   # Absolute layout mapping backdrop canvas
 ┃ ┣ 📜 CommuteScreen.js# FlatList recycler feed for bookmarked saved routes
 ┃ ┣ 📜 SettingsScreen.js# Global configuration switches and theme states
 ┃ ┗ 📜 AuthScreen.js   # Session gatekeeper overlay (Login & Registration forms)
 ┣ 📂 services          # Core business services
 ┃ ┣ 📜 ltaApi.js       # Consolidates asynchronous parallel promises to LTA REST endpoints
 ┃ ┗ 📜 authService.js  # Manages local storage user sessions & validation loops
 ┣ 📜 App.js            # Main application entry point initializing global state and routing
 ┗ 📜 package.json      # System dependencies and configuration packages
 ```
---
## Getting Started
Follow these steps to set up the repository locally on your development environment
### Prerequisites
Make sure you have Node.js installed, along with the Expo Go mobile app on your iOS or Android device for live wireless testing.

### 1. Clone the Repository
``` bash 
git clone [https://github.com/your-username/sg-trafficpulse.git](https://github.com/your-username/sg-trafficpulse.git)
cd sg-trafficpulse
```

### 2. Install Project Dependencies
``` bash
npm install
```

### 3. Initialize the Expo Dev Server
``` bash 
npx expo start
```

### 4. Scan and Run the Prototype
* **Physical Device:** Open your phone camera (iOS) or Expo Go App (Android) and scan the QR code displayed in your terminal window.

* **Simulators:** Press a for Android Emulator or i for iOS Simulator directly within your terminal window if you have local development environments configured.