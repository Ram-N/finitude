/**
 * User profile and settings management utilities
 */
import { loadDefaultProfile, loadDefaultSettings } from './dataLoader';
import { updateProfileAge } from './calculations';

// Local storage keys
const PROFILE_STORAGE_KEY = 'finitude_user_profile';
const SETTINGS_STORAGE_KEY = 'finitude_user_settings';
const ACTIVITIES_STORAGE_KEY = 'finitude_user_activities';

/**
 * Loads user profile from localStorage or returns default
 * @returns {Object} User profile object
 */
export const loadUserProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      // Update age based on current date
      return updateProfileAge(profile);
    }
  } catch (error) {
    console.warn('Error loading user profile from localStorage:', error);
  }
  
  return loadDefaultProfile();
};

/**
 * Saves user profile to localStorage
 * @param {Object} profile - User profile object
 */
export const saveUserProfile = (profile) => {
  try {
    const updatedProfile = {
      ...profile,
      timestamps: {
        ...profile.timestamps,
        updated_at: new Date().toISOString()
      }
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    return updatedProfile;
  } catch (error) {
    console.error('Error saving user profile to localStorage:', error);
    return profile;
  }
};

/**
 * Loads user settings from localStorage or returns default
 * @returns {Object} User settings object
 */
export const loadUserSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error loading user settings from localStorage:', error);
  }
  
  return loadDefaultSettings();
};

/**
 * Saves user settings to localStorage
 * @param {Object} settings - User settings object
 */
export const saveUserSettings = (settings) => {
  try {
    const updatedSettings = {
      ...settings,
      metadata: {
        ...settings.metadata,
        updated_at: new Date().toISOString()
      }
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error saving user settings to localStorage:', error);
    return settings;
  }
};

/**
 * Loads user customized activities from localStorage
 * @returns {Array|null} User activities array or null if none stored
 */
export const loadUserActivities = () => {
  try {
    const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error loading user activities from localStorage:', error);
  }
  
  return null;
};

/**
 * Saves user activities to localStorage
 * @param {Array} activities - User activities array
 */
export const saveUserActivities = (activities) => {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
    return activities;
  } catch (error) {
    console.error('Error saving user activities to localStorage:', error);
    return activities;
  }
};

/**
 * Updates user profile with new data
 * @param {Object} currentProfile - Current profile
 * @param {Object} updates - Profile updates
 * @returns {Object} Updated profile
 */
export const updateUserProfile = (currentProfile, updates) => {
  const updatedProfile = {
    ...currentProfile,
    ...updates,
    demographics: {
      ...currentProfile.demographics,
      ...(updates.demographics || {})
    },
    life_expectancy: {
      ...currentProfile.life_expectancy,
      ...(updates.life_expectancy || {}),
      last_updated: new Date().toISOString()
    }
  };
  
  return saveUserProfile(updatedProfile);
};

/**
 * Updates user settings with new data
 * @param {Object} currentSettings - Current settings
 * @param {Object} updates - Settings updates
 * @returns {Object} Updated settings
 */
export const updateUserSettings = (currentSettings, updates) => {
  const updatedSettings = {
    ...currentSettings,
    display: {
      ...currentSettings.display,
      ...(updates.display || {})
    },
    audio: {
      ...currentSettings.audio,
      ...(updates.audio || {})
    },
    notifications: {
      ...currentSettings.notifications,
      ...(updates.notifications || {})
    },
    accessibility: {
      ...currentSettings.accessibility,
      ...(updates.accessibility || {})
    }
  };
  
  return saveUserSettings(updatedSettings);
};

/**
 * Resets user data to defaults
 * @param {boolean} includeProfile - Whether to reset profile
 * @param {boolean} includeSettings - Whether to reset settings
 * @param {boolean} includeActivities - Whether to reset activities
 */
export const resetUserData = (includeProfile = false, includeSettings = false, includeActivities = false) => {
  try {
    if (includeProfile) {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
    if (includeSettings) {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
    if (includeActivities) {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error resetting user data:', error);
  }
};

/**
 * Exports user data for backup
 * @returns {Object} Complete user data object
 */
export const exportUserData = () => {
  return {
    profile: loadUserProfile(),
    settings: loadUserSettings(),
    activities: loadUserActivities(),
    exported_at: new Date().toISOString()
  };
};

/**
 * Imports user data from backup
 * @param {Object} userData - Complete user data object
 * @returns {boolean} Success status
 */
export const importUserData = (userData) => {
  try {
    if (userData.profile) {
      saveUserProfile(userData.profile);
    }
    if (userData.settings) {
      saveUserSettings(userData.settings);
    }
    if (userData.activities) {
      saveUserActivities(userData.activities);
    }
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false;
  }
};