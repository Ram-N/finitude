import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  loadDefaultActivities, 
  convertActivitiesToLegacyFormat,
  getRandomQuote,
  generateCalculationBreakdown,
  generateFinancialBreakdown
} from './utils/dataLoader';
import { 
  loadUserProfile, 
  saveUserProfile, 
  loadUserSettings,
  loadUserActivities,
  saveUserActivities 
} from './utils/userManager';
import {
  formatCurrency,
  calculateFinancialTotal,
  generateFinancialBreakdown as calculateFinancialBreakdown
} from './utils/calculations';

const Finitude = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'settings', 'lifespan', 'activities'
  const [userProfile, setUserProfile] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [currentCardType, setCurrentCardType] = useState('activity'); // 'activity' or 'quote'
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipTimer, setFlipTimer] = useState(null);
  const [wasAutoPlayingBeforeFlip, setWasAutoPlayingBeforeFlip] = useState(false);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  // Derived values from profile for backwards compatibility
  const lifeExpectancy = userProfile?.life_expectancy?.years || 78.5;
  const currentAge = userProfile?.demographics?.age || 57;
  const firstName = userProfile?.name || '';
  const tickInterval = userSettings?.display?.tick_interval_seconds || 5;
  const quoteProbability = userSettings?.display?.quote_probability || 0.2;

  const yearsRemaining = lifeExpectancy - currentAge;

  // Initialize data on component mount
  useEffect(() => {
    // Load user profile
    const profile = loadUserProfile();
    setUserProfile(profile);

    // Load user settings
    const settings = loadUserSettings();
    setUserSettings(settings);

    // Load activities (user customizations or defaults)
    const userActivities = loadUserActivities();
    let activitiesToSet;
    if (userActivities && userActivities.length > 0) {
      activitiesToSet = userActivities;
    } else {
      // Convert new format activities to legacy format for compatibility
      const defaultActivitiesData = loadDefaultActivities();
      activitiesToSet = convertActivitiesToLegacyFormat(defaultActivitiesData);
    }
    
    // Shuffle the activities array for random display order
    const shuffledActivities = [...activitiesToSet].sort(() => Math.random() - 0.5);
    setActivities(shuffledActivities);
  }, []);

  const cardsWithCounts = activities.map(activity => {
    // Standard activity with count
    const baseActivity = {
      ...activity,
      count: Math.floor(activity.frequency * yearsRemaining)
    };
    
    // Add financial data for financial activities
    if (activity.type === 'financial' && activity.financial) {
      const occurrences = Math.floor(activity.frequency * yearsRemaining);
      const totalAmount = activity.financial.amount * occurrences;
      
      return {
        ...baseActivity,
        occurrences: occurrences,
        totalAmount: totalAmount
      };
    }
    
    return baseActivity;
  });

  const navigateToNextCard = useCallback(() => {
    if (cardsWithCounts.length > 0) {
      // Determine if next card should be a quote or activity
      const shouldShowQuote = Math.random() < quoteProbability;
      
      if (shouldShowQuote) {
        setCurrentCardType('quote');
        setCurrentQuote(getRandomQuote());
      } else {
        setCurrentCardType('activity');
        setCurrentCard(prev => (prev + 1) % cardsWithCounts.length);
      }
      setProgress(0);
    }
  }, [cardsWithCounts.length, quoteProbability]);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    
    setProgress(0);
    
    // Progress animation
    const progressInterval = (tickInterval * 1000) / 100; // Calculate interval for smooth progress
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 1;
      });
    }, progressInterval);

    // Card rotation
    intervalRef.current = setInterval(() => {
      navigateToNextCard();
    }, tickInterval * 1000);
  }, [tickInterval, navigateToNextCard]);

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
  };

  useEffect(() => {
    if (isAutoPlaying && cardsWithCounts.length > 0 && !isFlipped) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }

    return () => {
      stopAutoPlay();
      if (flipTimer) {
        clearTimeout(flipTimer);
      }
    };
  }, [isAutoPlaying, currentCard, cardsWithCounts.length, startAutoPlay, isFlipped, flipTimer, wasAutoPlayingBeforeFlip]);

  const nextCard = () => {
    // Reset flip state when navigating
    if (isFlipped) {
      clearTimeout(flipTimer);
      setIsFlipped(false);
      setFlipTimer(null);
      // Resume auto-play if it was playing before flip
      if (wasAutoPlayingBeforeFlip) {
        setIsAutoPlaying(true);
        setWasAutoPlayingBeforeFlip(false);
      }
    }
    navigateToNextCard();
  };

  const prevCard = useCallback(() => {
    // Reset flip state when navigating
    if (isFlipped) {
      clearTimeout(flipTimer);
      setIsFlipped(false);
      setFlipTimer(null);
      // Resume auto-play if it was playing before flip
      if (wasAutoPlayingBeforeFlip) {
        setIsAutoPlaying(true);
        setWasAutoPlayingBeforeFlip(false);
      }
    }
    
    if (cardsWithCounts.length > 0) {
      // Determine if previous card should be a quote or activity
      const shouldShowQuote = Math.random() < quoteProbability;
      
      if (shouldShowQuote) {
        setCurrentCardType('quote');
        setCurrentQuote(getRandomQuote());
      } else {
        setCurrentCardType('activity');
        setCurrentCard(prev => (prev - 1 + cardsWithCounts.length) % cardsWithCounts.length);
      }
      setProgress(0);
    }
  }, [cardsWithCounts.length, quoteProbability, isFlipped, flipTimer, wasAutoPlayingBeforeFlip]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextCard();
    } else if (isRightSwipe) {
      prevCard();
    }
  };

  const handleCardClick = () => {
    if (isFlipped) {
      // If already flipped, flip back immediately
      clearTimeout(flipTimer);
      setIsFlipped(false);
      setFlipTimer(null);
      // Resume auto-play if it was playing before flip
      if (wasAutoPlayingBeforeFlip) {
        setIsAutoPlaying(true);
      }
      // Always reset the state after manual flip back
      setWasAutoPlayingBeforeFlip(false);
    } else {
      // Remember current auto-play state before flipping
      setWasAutoPlayingBeforeFlip(isAutoPlaying);
      
      // Pause auto-play when flipping
      if (isAutoPlaying) {
        setIsAutoPlaying(false);
      }
      
      // Flip to back side
      setIsFlipped(true);
      
      // Set timer to auto-flip back after 5 seconds
      const timer = setTimeout(() => {
        setIsFlipped(false);
        setFlipTimer(null);
        // Resume auto-play if it was playing before flip
        if (wasAutoPlayingBeforeFlip) {
          setIsAutoPlaying(true);
        }
        // Always reset the state after auto flip back
        setWasAutoPlayingBeforeFlip(false);
      }, 5000);
      
      setFlipTimer(timer);
    }
  };

  const handlePlayPauseClick = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleSettingsClick = () => {
    setCurrentView('settings');
    setIsAutoPlaying(false);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setIsAutoPlaying(true);
  };

  const handleLifespanChange = (value) => {
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        life_expectancy: {
          ...userProfile.life_expectancy,
          years: value,
          last_updated: new Date().toISOString()
        }
      };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
    }
  };

  const handleAgeChange = (value) => {
    if (userProfile) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - value;
      const updatedProfile = {
        ...userProfile,
        demographics: {
          ...userProfile.demographics,
          age: value,
          birth_year: birthYear
        }
      };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
    }
  };

  const handleNameChange = (value) => {
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        name: value
      };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
    }
  };

  const handleActivityEdit = (activity) => {
    setEditingActivity(activity);
  };

  const handleActivitySave = (updatedActivity) => {
    const updatedActivities = activities.map(act => 
      act.id === updatedActivity.id ? updatedActivity : act
    );
    setActivities(updatedActivities);
    saveUserActivities(updatedActivities);
    setEditingActivity(null);
  };

  const handleActivityDelete = (activityId) => {
    const updatedActivities = activities.filter(act => act.id !== activityId);
    setActivities(updatedActivities);
    saveUserActivities(updatedActivities);
  };

  const handleAddActivity = () => {
    const newActivity = {
      id: Date.now(),
      name: "New Activity",
      icon: "⭐",
      frequency: 1,
      description: "A new meaningful moment"
    };
    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);
    saveUserActivities(updatedActivities);
    setEditingActivity(newActivity);
  };

  // Settings Screen Component
  const SettingsScreen = () => (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="flex items-center p-6 border-b border-stone-200">
          <button
            onClick={handleBackToMain}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors mr-4"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-light text-slate-700">Settings</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <button
            onClick={() => setCurrentView('lifespan')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <span className="text-slate-700">Personal Settings</span>
            <div className="flex items-center text-slate-500">
              <span className="mr-2">
                {firstName ? `${firstName}, ` : ''}{currentAge} → {lifeExpectancy}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('activities')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <span className="text-slate-700">Manage Activities</span>
            <div className="flex items-center text-slate-500">
              <span className="mr-2">{activities.length} activities</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Lifespan Settings Component
  const LifespanScreen = () => (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="flex items-center p-6 border-b border-stone-200">
          <button
            onClick={() => setCurrentView('settings')}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors mr-4"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-light text-slate-700">Personal Settings</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Name Input */}
          <div className="text-center">
            <h3 className="text-lg font-light text-slate-700 mb-4">Your Name</h3>
            <input
              type="text"
              value={firstName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your first name"
              className="w-full p-3 text-center border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700"
            />
          </div>

          {/* Current Age */}
          <div className="text-center">
            <h3 className="text-lg font-light text-slate-700 mb-2">Current Age</h3>
            <div className="text-3xl font-light text-slate-800 mb-6">
              {currentAge} years old
            </div>
            
            <div className="px-4">
              <input
                type="range"
                min="18"
                max="90"
                step="1"
                value={currentAge}
                onChange={(e) => handleAgeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((currentAge - 18) / 72) * 100}%, #e7e5e4 ${((currentAge - 18) / 72) * 100}%, #e7e5e4 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>18</span>
                <span>90</span>
              </div>
            </div>
          </div>
          
          {/* Life Expectancy */}
          <div className="text-center">
            <h3 className="text-lg font-light text-slate-700 mb-2">Expected Lifespan</h3>
            <div className="text-3xl font-light text-slate-800 mb-6">
              {lifeExpectancy} years
            </div>
            
            <div className="px-4">
              <input
                type="range"
                min="60"
                max="100"
                step="0.5"
                value={lifeExpectancy}
                onChange={(e) => handleLifespanChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((lifeExpectancy - 60) / 40) * 100}%, #e7e5e4 ${((lifeExpectancy - 60) / 40) * 100}%, #e7e5e4 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>60</span>
                <span>100</span>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="p-4 bg-stone-50 rounded-xl text-center">
            <p className="text-sm text-slate-600">
              {firstName && <span className="font-medium">{firstName}</span>}
              {firstName && yearsRemaining > 0 && ' has '}
              {!firstName && yearsRemaining > 0 && 'You have '}
              {yearsRemaining > 0 ? (
                <>approximately <span className="font-medium">{yearsRemaining.toFixed(1)} years</span> remaining.</>
              ) : (
                <span className="text-amber-600">Please adjust your life expectancy to be greater than your current age.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Activities Management Component
  const ActivitiesScreen = () => (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center p-6 border-b border-stone-200">
          <button
            onClick={() => setCurrentView('settings')}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors mr-4"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-light text-slate-700 flex-1">Manage Activities</h2>
          <button
            onClick={handleAddActivity}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{activity.icon}</span>
                <div>
                  <div className="text-sm font-medium text-slate-700">{activity.name}</div>
                  <div className="text-xs text-slate-500">{activity.frequency}/year</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleActivityEdit(activity)}
                  className="p-1 rounded hover:bg-stone-200 transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleActivityDelete(activity.id)}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Activity Edit Modal Component
  const ActivityEditModal = ({ activity, onSave, onCancel }) => {
    const [name, setName] = useState(activity.name);
    const [icon, setIcon] = useState(activity.icon);
    const [frequency, setFrequency] = useState(activity.frequency);
    const [description, setDescription] = useState(activity.description);
    const [type, setType] = useState(activity.type || 'experiential');
    
    // Financial activity properties
    const [amount, setAmount] = useState(activity.financial?.amount || 0);
    const [unit, setUnit] = useState(activity.financial?.unit || 'month');
    const [currency, setCurrency] = useState(activity.financial?.currency || 'USD');

    const handleSave = () => {
      const updatedActivity = {
        ...activity,
        name,
        icon,
        frequency: parseFloat(frequency),
        description,
        type
      };
      
      // Add financial data if type is financial
      if (type === 'financial') {
        updatedActivity.financial = {
          amount: parseFloat(amount),
          unit,
          currency
        };
        
        // Set the display format to currency for financial activities
        updatedActivity.display = {
          ...updatedActivity.display,
          format: 'currency'
        };
      }
      
      onSave(updatedActivity);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-stone-200">
            <h3 className="text-xl font-light text-slate-700">Edit Activity</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="🌅"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Frequency (per year)</label>
              <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 h-20 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Activity Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="experiential">Experiential</option>
                <option value="financial">Financial</option>
                <option value="quote">Quote</option>
              </select>
            </div>
            
            {type === 'financial' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-xl">
                <h4 className="font-medium text-green-800">Financial Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="week">Week</option>
                    <option value="visit">Visit</option>
                    <option value="meal">Meal</option>
                    <option value="ride">Ride</option>
                    <option value="night">Night</option>
                    <option value="roundtrip">Roundtrip</option>
                    <option value="tank">Tank</option>
                    <option value="cut">Cut</option>
                    <option value="service">Service</option>
                    <option value="quarter">Quarter</option>
                    <option value="event">Event</option>
                    <option value="hour">Hour</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-stone-200 flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-xl border border-stone-200 text-slate-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-xl bg-amber-400 text-white hover:bg-amber-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Activity Back Side Component for Experiential Activities
  const ExperientialActivityBackSide = ({ activity, yearsRemaining }) => {
    if (!activity) return null;
    
    // Handle legacy format (yearly frequency number) vs new format (times/period object)
    if (typeof activity.frequency === 'number') {
      // Legacy format - show simple calculation
      const yearlyFrequency = activity.frequency;
      const totalCount = Math.floor(yearlyFrequency * yearsRemaining);
      
      return (
        <div className="p-6 pt-8 flex flex-col justify-center items-center h-full text-center">
          <h2 className="text-lg font-light text-slate-700 mb-4">
            {activity.name}
          </h2>
          
          <div className="space-y-3 text-left max-w-sm mx-auto">
            {/* Frequency */}
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Frequency:</span>
              <span className="text-sm font-medium text-slate-800">{yearlyFrequency} per year</span>
            </div>
            
            {/* Time Remaining */}
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Time left:</span>
              <span className="text-sm font-medium text-slate-800">{Math.floor(yearsRemaining)} years remaining</span>
            </div>
            
            {/* Calculation */}
            <div className="py-2 text-center">
              <div className="text-xs text-slate-500 mb-1">Calculation</div>
              <div className="text-lg font-light text-slate-800 font-mono">
                {yearlyFrequency} × {Math.floor(yearsRemaining)} = {totalCount.toLocaleString()}
              </div>
            </div>
            
            {/* Result */}
            <div className="text-center py-2 bg-slate-100 rounded-lg">
              <div className="text-sm font-medium text-slate-700">
                {totalCount.toLocaleString()} opportunities left
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // New format - use the advanced breakdown
    const breakdown = generateCalculationBreakdown(activity, yearsRemaining);
    
    return (
      <div className="p-6 pt-8 flex flex-col justify-center items-center h-full text-center">
        <h2 className="text-lg font-light text-slate-700 mb-4">
          {activity.name}
        </h2>
        
        <div className="space-y-3 text-left max-w-sm mx-auto">
          {/* Frequency */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Frequency:</span>
            <span className="text-sm font-medium text-slate-800">{breakdown.frequency}</span>
          </div>
          
          {/* Time Remaining */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Time left:</span>
            <span className="text-sm font-medium text-slate-800">{breakdown.timeRemaining}</span>
          </div>
          
          {/* Calculation */}
          <div className="py-2 text-center">
            <div className="text-xs text-slate-500 mb-1">Calculation</div>
            <div className="text-lg font-light text-slate-800 font-mono">
              {breakdown.calculation}
            </div>
          </div>
          
          {/* Result */}
          <div className="text-center py-2 bg-slate-100 rounded-lg">
            <div className="text-sm font-medium text-slate-700">
              {breakdown.result}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Financial Activity Back Side Component
  const FinancialActivityBackSide = ({ activity, yearsRemaining }) => {
    if (!activity?.financial) return null;
    
    // Get financial breakdown
    const breakdown = generateFinancialBreakdown(activity, yearsRemaining);
    
    return (
      <div className="p-3 pt-5 flex flex-col justify-center items-center h-full text-center financial-card-back">
        <h2 className="text-base font-light text-slate-700 mb-2">
          {activity.name}
        </h2>
        
        <div className="space-y-2 text-left mx-auto">
          {/* Cost Per Unit */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Cost:</span>
            <span className="text-sm font-medium text-slate-800">
              {breakdown.amount} per {activity.financial.unit}
            </span>
          </div>
          
          {/* Frequency */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Frequency:</span>
            <span className="text-sm font-medium text-slate-800">{breakdown.frequency}</span>
          </div>
          
          {/* Time Remaining */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Time left:</span>
            <span className="text-sm font-medium text-slate-800">{breakdown.timeRemaining}</span>
          </div>
          
          {/* Calculation */}
          <div className="py-2 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Cost Calculation</div>
            <div className="text-lg font-light text-slate-800 font-mono">
              {breakdown.calculation}
            </div>
          </div>
          
          {/* Result */}
          <div className="text-center py-2 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800">
              {breakdown.result}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Activity Back Side Component (dispatcher)
  const ActivityBackSide = ({ activity, yearsRemaining }) => {
    if (!activity) return null;
    
    // Dispatch to appropriate activity type
    if (activity.type === 'financial' && activity.financial) {
      return <FinancialActivityBackSide activity={activity} yearsRemaining={yearsRemaining} />;
    }
    
    // Default to experiential
    return <ExperientialActivityBackSide activity={activity} yearsRemaining={yearsRemaining} />;
  };

  // Quote Card Component
  const QuoteCard = ({ quote, progress }) => {
    if (!quote) return null;
    
    // Dynamic font sizing based on quote length
    const getQuoteFontSize = (text) => {
      if (text.length < 50) return 'text-2xl';
      if (text.length < 100) return 'text-xl';
      if (text.length < 150) return 'text-lg';
      return 'text-base';
    };

    return (
      <div className="p-8 flex flex-col justify-center items-center h-full text-center">
        <div className="mb-6">
          <svg className="w-8 h-8 mx-auto text-amber-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
          </svg>
        </div>
        
        <blockquote className={`${getQuoteFontSize(quote.quote)} font-light text-slate-800 mb-6 italic leading-relaxed`}>
          "{quote.quote}"
        </blockquote>
        
        <cite className="text-sm text-slate-500 not-italic mb-6">
          — {quote.author}
        </cite>
        
        {/* Progress Bar */}
        <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  if (cardsWithCounts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl font-light text-slate-700 mb-2">Loading Finitude...</div>
          <div className="text-sm text-slate-500">Preparing your life countdown</div>
        </div>
      </div>
    );
  }

  const currentActivity = cardsWithCounts[currentCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex items-center justify-center p-4">
      {currentView === 'main' && (
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-slate-700 mb-2">Finitude</h1>
            <p className="text-sm text-slate-500">A reminder of life's precious moments</p>
          </div>

          {/* Main Card */}
          <div className="card-container mb-2" onClick={handleCardClick} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className={`card ${isFlipped ? 'flipped' : ''} ${currentActivity.type === 'financial' ? 'financial-card' : ''} ${currentCardType === 'quote' ? 'quote-card' : ''}`}>
              {/* Front Side */}
              <div className="card-front">
                {/* Card Content */}
                {currentCardType === 'quote' && currentQuote ? (
                  <QuoteCard quote={currentQuote} progress={progress} />
                ) : currentActivity.type === 'financial' ? (
                  <div className="p-4 flex flex-col justify-center items-center h-full text-center">
                    <div className="text-4xl mb-2 animate-pulse">
                      {currentActivity.icon}
                    </div>
                    
                    <h2 className="text-lg font-light text-slate-700 mb-1">
                      {currentActivity.name}
                    </h2>
                    
                    <div className="text-3xl font-light text-green-600 mb-2 transition-all duration-500">
                      {formatCurrency(currentActivity.totalAmount, currentActivity.financial.currency)}
                    </div>
                    
                    <p className="text-xs text-slate-500 italic leading-relaxed mb-2">
                      remaining in {currentActivity.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="h-1 bg-stone-200 rounded-full overflow-hidden w-full max-w-[200px]">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col justify-center items-center h-full text-center">
                    <div className="text-4xl mb-2 animate-pulse">
                      {currentActivity.icon}
                    </div>
                    
                    <h2 className="text-lg font-light text-slate-700 mb-1">
                      {currentActivity.name}
                    </h2>
                    
                    <div className="text-3xl font-light text-slate-800 mb-2 transition-all duration-500">
                      {currentActivity.count.toLocaleString()}
                    </div>
                    
                    <p className="text-xs text-slate-500 italic leading-relaxed mb-2">
                      {currentActivity.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="h-1 bg-stone-200 rounded-full overflow-hidden w-full max-w-[200px]">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div className="card-back">
                {currentCardType === 'activity' ? (
                  <ActivityBackSide activity={currentActivity} yearsRemaining={yearsRemaining} />
                ) : (
                  <QuoteCard quote={currentQuote} progress={progress} />
                )}
              </div>
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={prevCard}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPauseClick}
                className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
              >
                {isAutoPlaying ? (
                  // Pause icon - two parallel bars
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  // Play icon - triangle
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <button
              onClick={nextCard}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-slate-400">
            <p>
              {firstName && yearsRemaining > 0 ? (
                `${firstName}'s remaining life: ${yearsRemaining.toFixed(1)} years`
              ) : yearsRemaining > 0 ? (
                `Based on ${yearsRemaining.toFixed(1)} years remaining`
              ) : (
                'Please adjust your settings'
              )}
            </p>
            <p className="mt-1">Tap card to pause • Swipe or use arrows to navigate</p>
          </div>
        </div>
      )}

      {currentView === 'settings' && <SettingsScreen />}
      {currentView === 'lifespan' && <LifespanScreen />}
      {currentView === 'activities' && <ActivitiesScreen />}
      
      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          onSave={handleActivitySave}
          onCancel={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
};

export default Finitude;