// Data loading utilities for Finitude app
import defaultActivities from '../data/activities/default-activities.json';
import defaultProfile from '../data/users/default-profile.json';
import defaultSettings from '../data/users/default-settings.json';

/**
 * Loads the default activities from JSON
 * @returns {Array} Array of activity objects
 */
export const loadDefaultActivities = () => {
  return defaultActivities.activities || [];
};

/**
 * Loads the default user profile
 * @returns {Object} User profile object
 */
export const loadDefaultProfile = () => {
  return { ...defaultProfile };
};

/**
 * Loads the default app settings
 * @returns {Object} App settings object
 */
export const loadDefaultSettings = () => {
  return { ...defaultSettings };
};

/**
 * Converts new frequency format to yearly frequency for backwards compatibility
 * @param {Object} frequency - Frequency object with times and period
 * @returns {number} Yearly frequency number
 */
export const convertToYearlyFrequency = (frequency) => {
  const multipliers = {
    day: 365,
    week: 52,
    month: 12,
    year: 1
  };
  
  return frequency.times * (multipliers[frequency.period] || 1);
};

/**
 * Converts activities from new format to legacy format for current component
 * @param {Array} activities - Activities in new format
 * @returns {Array} Activities in legacy format
 */
export const convertActivitiesToLegacyFormat = (activities) => {
  return activities.map((activity, index) => ({
    id: index + 1, // Legacy format uses sequential numbers
    name: activity.name,
    icon: activity.display.icon,
    frequency: convertToYearlyFrequency(activity.frequency),
    description: activity.description
  }));
};

/**
 * Gets current user age from profile
 * @param {Object} profile - User profile object
 * @returns {number} Current age
 */
export const getCurrentAge = (profile) => {
  const currentYear = new Date().getFullYear();
  return currentYear - profile.demographics.birth_year;
};

/**
 * Gets years remaining from profile
 * @param {Object} profile - User profile object
 * @returns {number} Years remaining
 */
export const getYearsRemaining = (profile) => {
  const currentAge = getCurrentAge(profile);
  return profile.life_expectancy.years - currentAge;
};