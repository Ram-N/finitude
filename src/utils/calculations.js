/**
 * Calculation utilities for activity counts, financial calculations, and age-based estimations
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

/**
 * Calculates the total financial cost for a financial activity over the remaining lifetime
 * @param {Object} activity - Financial activity with amount, unit, and currency
 * @param {Object} profile - User profile with age and life expectancy
 * @returns {number} Total financial cost for the remaining lifetime
 */
export const calculateFinancialTotal = (activity, profile) => {
  if (!activity.financial || !activity.financial.amount) {
    return 0;
  }
  
  const occurrences = calculateRemainingOccurrences(activity, profile);
  const amount = activity.financial.amount;
  
  return occurrences * amount;
};

/**
 * Formats a currency value with appropriate symbol and decimal places
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (e.g., USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  const currencyFormatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }),
    CAD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }),
    AUD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AUD' }),
    JPY: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JPY' }),
  };
  
  const formatter = currencyFormatters[currency] || currencyFormatters.USD;
  return formatter.format(amount);
};

/**
 * Generates a detailed breakdown for financial activity calculations
 * @param {Object} activity - Financial activity object
 * @param {Object} profile - User profile
 * @returns {Object} Detailed breakdown for display
 */
export const generateFinancialBreakdown = (activity, profile) => {
  const occurrences = calculateRemainingOccurrences(activity, profile);
  const { amount, unit, currency } = activity.financial;
  const total = occurrences * amount;
  
  return {
    occurrences,
    amountPerUnit: formatCurrency(amount, currency),
    unit,
    total: formatCurrency(total, currency),
    calculation: `${occurrences} × ${formatCurrency(amount, currency)}`,
  };
};