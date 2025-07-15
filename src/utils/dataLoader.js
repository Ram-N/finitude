// Data loading utilities for Finitude app
import defaultActivities from '../data/activities/default-activities.json';
import defaultProfile from '../data/users/default-profile.json';
import defaultSettings from '../data/users/default-settings.json';
import finitudeQuotes from '../data/quotes/finitude-quotes.json';

/**
 * Loads the default activities from JSON, filtering out inactive ones
 * @returns {Array} Array of active activity objects
 */
export const loadDefaultActivities = () => {
  const allActivities = defaultActivities.activities || [];
  // Filter out activities where is_active is false
  return allActivities.filter(activity => activity.metadata.is_active !== false);
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

/**
 * Loads the finitude quotes from JSON
 * @returns {Array} Array of quote objects
 */
export const loadFinitudeQuotes = () => {
  return finitudeQuotes || [];
};

/**
 * Gets a random quote from the quotes array
 * @returns {Object} Random quote object with id, quote, and author
 */
export const getRandomQuote = () => {
  const quotes = loadFinitudeQuotes();
  if (quotes.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

/**
 * Formats frequency for human-readable display
 * @param {Object} frequency - Frequency object with times and period
 * @returns {string} Human-readable frequency string
 */
export const formatFrequency = (frequency) => {
  const { times, period } = frequency;
  
  // Handle special cases for cleaner display
  if (period === 'day') {
    if (times === 1) return 'Daily';
    return `${times} times per day`;
  }
  
  if (period === 'week') {
    if (times === 1) return 'Weekly';
    if (times === 7) return 'Daily';
    return `${times} times per week`;
  }
  
  if (period === 'month') {
    if (times === 1) return 'Monthly';
    return `${times} times per month`;
  }
  
  if (period === 'year') {
    if (times === 1) return 'Annually';
    if (times === 12) return 'Monthly';
    if (times === 52) return 'Weekly';
    if (times === 365) return 'Daily';
    return `${times} times per year`;
  }
  
  return `${times} times per ${period}`;
};

/**
 * Calculates time remaining in the most appropriate unit
 * @param {number} yearsRemaining - Years remaining in life
 * @param {Object} frequency - Activity frequency object
 * @returns {Object} Object with amount, unit, and display string
 */
export const calculateTimeRemaining = (yearsRemaining, frequency) => {
  const { period } = frequency;
  
  switch (period) {
    case 'day':
      const daysRemaining = Math.floor(yearsRemaining * 365);
      return {
        amount: daysRemaining,
        unit: 'days',
        display: `${daysRemaining.toLocaleString()} days remaining`
      };
    
    case 'week':
      const weeksRemaining = Math.floor(yearsRemaining * 52);
      return {
        amount: weeksRemaining,
        unit: 'weeks', 
        display: `${weeksRemaining.toLocaleString()} weeks remaining`
      };
    
    case 'month':
      const monthsRemaining = Math.floor(yearsRemaining * 12);
      return {
        amount: monthsRemaining,
        unit: 'months',
        display: `${monthsRemaining.toLocaleString()} months remaining`
      };
    
    case 'year':
    default:
      return {
        amount: Math.floor(yearsRemaining),
        unit: 'years',
        display: `${Math.floor(yearsRemaining)} years remaining`
      };
  }
};

/**
 * Generates calculation breakdown for activity card back side
 * @param {Object} activity - Activity object with frequency
 * @param {number} yearsRemaining - Years remaining in life
 * @returns {Object} Calculation breakdown object
 */
export const generateCalculationBreakdown = (activity, yearsRemaining) => {
  const frequency = activity.frequency;
  const timeRemaining = calculateTimeRemaining(yearsRemaining, frequency);
  const totalCount = Math.floor(convertToYearlyFrequency(frequency) * yearsRemaining);
  
  return {
    frequency: formatFrequency(frequency),
    timeRemaining: timeRemaining.display,
    calculation: `${frequency.times} × ${timeRemaining.amount.toLocaleString()} = ${totalCount.toLocaleString()}`,
    result: `${totalCount.toLocaleString()} opportunities left`
  };
};