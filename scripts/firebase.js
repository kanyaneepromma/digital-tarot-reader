import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-remote-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf-1z_Vt3JMOaqSRxsJVI7dy7AUFlYfuU",
  authDomain: "digital-tarot-reader.firebaseapp.com",
  projectId: "digital-tarot-reader",
  storageBucket: "digital-tarot-reader.firebasestorage.app",
  messagingSenderId: "877580666601",
  appId: "1:877580666601:web:fbc8cab0c15c17a3fed278",
  measurementId: "G-QYNTGQJJL4",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const remoteConfig = getRemoteConfig(app);

// Cache limit: check for new config every hour
remoteConfig.settings.minimumFetchIntervalMillis = 3600;

remoteConfig.defaultConfig = {
  gemini_api_key: "",
};

// Expose to the global window object so the main script can use it for AI Studio calls
window.geminiApiKey = "";

fetchAndActivate(remoteConfig)
  .then(() => {
    window.geminiApiKey = getValue(remoteConfig, "gemini_api_key").asString();
    console.log("Firebase Remote Config Loaded successfully.");
  })
  .catch((err) => {
    console.error("Firebase Remote Config Error:", err);
  });
