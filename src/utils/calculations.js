/**
 * Calculation utilities for activity counts and age-based estimations
 */

/**
 * Calculates remaining occurrences for an activity based on user profile
 * @param {Object} activity - Activity object with frequency and age_range
 * @param {Object} profile - User profile with age and life expectancy
 * @returns {number} Number of remaining occurrences
 */
export const calculateRemainingOccurrences = (activity, profile) => {
  const currentAge = getCurrentAge(profile);
  const lifeExpectancy = profile.life_expectancy.years;
  
  // Determine effective end age for this activity
  const activityEndAge = activity.age_range.flexible_end 
    ? lifeExpectancy 
    : activity.age_range.end || lifeExpectancy;
  
  const activityStartAge = Math.max(activity.age_range.start || 0, currentAge);
  
  // If we're past the activity end age, return 0
  if (currentAge >= activityEndAge) {
    return 0;
  }
  
  const yearsRemaining = activityEndAge - activityStartAge;
  const yearlyFrequency = convertFrequencyToYearly(activity.frequency);
  
  return Math.floor(yearsRemaining * yearlyFrequency);
};

/**
 * Converts frequency object to yearly frequency
 * @param {Object} frequency - Frequency object with times and period
 * @returns {number} Yearly frequency
 */
export const convertFrequencyToYearly = (frequency) => {
  const multipliers = {
    day: 365,
    week: 52,
    month: 12,
    year: 1
  };
  
  return frequency.times * (multipliers[frequency.period] || 1);
};

/**
 * Gets current age from profile
 * @param {Object} profile - User profile object
 * @returns {number} Current age
 */
export const getCurrentAge = (profile) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 0-indexed
  
  let age = currentYear - profile.demographics.birth_year;
  
  // Adjust for birthday not yet passed this year
  if (currentMonth < profile.demographics.birth_month) {
    age--;
  }
  
  return age;
};

/**
 * Gets years remaining from profile
 * @param {Object} profile - User profile object
 * @returns {number} Years remaining (can be fractional)
 */
export const getYearsRemaining = (profile) => {
  const currentAge = getCurrentAge(profile);
  return Math.max(0, profile.life_expectancy.years - currentAge);
};

/**
 * Calculates total lifetime occurrences for an activity
 * @param {Object} activity - Activity object
 * @param {Object} profile - User profile
 * @returns {number} Total lifetime occurrences
 */
export const calculateTotalOccurrences = (activity, profile) => {
  const lifeExpectancy = profile.life_expectancy.years;
  const activityEndAge = activity.age_range.flexible_end 
    ? lifeExpectancy 
    : activity.age_range.end || lifeExpectancy;
  
  const activityStartAge = activity.age_range.start || 0;
  const totalYears = Math.max(0, activityEndAge - activityStartAge);
  const yearlyFrequency = convertFrequencyToYearly(activity.frequency);
  
  return Math.floor(totalYears * yearlyFrequency);
};

/**
 * Calculates what percentage of an activity has been completed
 * @param {Object} activity - Activity object
 * @param {Object} profile - User profile
 * @returns {number} Percentage completed (0-100)
 */
export const calculateCompletionPercentage = (activity, profile) => {
  const total = calculateTotalOccurrences(activity, profile);
  const remaining = calculateRemainingOccurrences(activity, profile);
  
  if (total === 0) return 100;
  
  const completed = total - remaining;
  return Math.round((completed / total) * 100);
};

/**
 * Updates profile age based on current date
 * @param {Object} profile - User profile object
 * @returns {Object} Updated profile with current age
 */
export const updateProfileAge = (profile) => {
  return {
    ...profile,
    demographics: {
      ...profile.demographics,
      age: getCurrentAge(profile)
    }
  };
};