import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  loadDefaultActivities, 
  convertActivitiesToLegacyFormat 
} from './utils/dataLoader';
import { 
  loadUserProfile, 
  saveUserProfile, 
  loadUserSettings,
  loadUserActivities,
  saveUserActivities 
} from './utils/userManager';

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
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  // Derived values from profile for backwards compatibility
  const lifeExpectancy = userProfile?.life_expectancy?.years || 78.5;
  const currentAge = userProfile?.demographics?.age || 57;
  const firstName = userProfile?.name || '';
  const tickInterval = userSettings?.display?.tick_interval_seconds || 5;

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

  const cardsWithCounts = activities.map(activity => ({
    ...activity,
    count: Math.floor(activity.frequency * yearsRemaining)
  }));

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    
    setProgress(0);
    
    // Progress animation
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    // Card rotation
    intervalRef.current = setInterval(() => {
      setCurrentCard(prev => (prev + 1) % cardsWithCounts.length);
      setProgress(0);
    }, tickInterval * 1000);
  }, [cardsWithCounts.length, tickInterval]);

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
  };

  useEffect(() => {
    if (isAutoPlaying && cardsWithCounts.length > 0) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }

    return () => {
      stopAutoPlay();
    };
  }, [isAutoPlaying, currentCard, cardsWithCounts.length, startAutoPlay]);

  const nextCard = () => {
    if (cardsWithCounts.length > 0) {
      setCurrentCard(prev => (prev + 1) % cardsWithCounts.length);
      setProgress(0);
    }
  };

  const prevCard = () => {
    if (cardsWithCounts.length > 0) {
      setCurrentCard(prev => (prev - 1 + cardsWithCounts.length) % cardsWithCounts.length);
      setProgress(0);
    }
  };

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

    const handleSave = () => {
      onSave({
        ...activity,
        name,
        icon,
        frequency: parseFloat(frequency),
        description
      });
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
          <div 
            className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-stone-200 rounded-t-2xl overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Card Content */}
            <div className="p-8 pt-10 text-center">
              <div className="text-4xl mb-4 animate-pulse">
                {currentActivity.icon}
              </div>
              
              <h2 className="text-xl font-light text-slate-700 mb-2">
                {currentActivity.name}
              </h2>
              
              <div className="text-5xl font-light text-slate-800 mb-4 transition-all duration-500">
                {currentActivity.count.toLocaleString()}
              </div>
              
              <p className="text-sm text-slate-500 italic leading-relaxed">
                {currentActivity.description}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prevCard}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>


            <button
              onClick={nextCard}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="px-6 py-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-slate-600 hover:text-slate-800 text-sm"
            >
              {isAutoPlaying ? 'Pause' : 'Play'}
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