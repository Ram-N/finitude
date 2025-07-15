# Activity Management Guide

This guide explains how to add, customize, and manage activities in the Finitude app.

## 📋 Table of Contents
- [Understanding the Activity Schema](#understanding-the-activity-schema)
- [Adding New Activities](#adding-new-activities)
- [Customizing Existing Activities](#customizing-existing-activities)
- [Frequency Examples](#frequency-examples)
- [Real vs. Experienced Frequency](#real-vs-experienced-frequency)
- [Activity Categories](#activity-categories)
- [Advanced Customizations](#advanced-customizations)

## 🏗️ Understanding the Activity Schema

Each activity in `/src/data/activities/default-activities.json` follows this structure:

```json
{
  "id": "unique_activity_id",
  "name": "Activity Name",
  "category": "category_name",
  "description": "Meaningful description of the activity",
  "frequency": {
    "times": 2,           // How many times
    "period": "week"      // Per what period (day/week/month/year)
  },
  "age_range": {
    "start": 0,           // Age when activity starts (0 = birth)
    "end": null,          // Age when activity ends (null = life expectancy)
    "flexible_end": true  // Should end age adjust with life expectancy?
  },
  "display": {
    "icon": "🌅",         // Emoji icon for the card
    "color": "#FF6347"    // Hex color for theming (optional)
  },
  "metadata": {
    "user_created": false,  // false = default activity, true = user added
    "is_active": true       // Can be toggled off without deleting
  }
}
```

## ➕ Adding New Activities

### Method 1: Edit JSON File Directly

1. Open `/src/data/activities/default-activities.json`
2. Add your new activity to the `activities` array:

```json
{
  "id": "meditation_sessions",
  "name": "Meditation Sessions",
  "category": "health",
  "description": "Moments of mindfulness and inner peace",
  "frequency": {
    "times": 5,
    "period": "week"
  },
  "age_range": {
    "start": 25,
    "end": null,
    "flexible_end": true
  },
  "display": {
    "icon": "🧘",
    "color": "#9370DB"
  },
  "metadata": {
    "user_created": false,
    "is_active": true
  }
}
```

3. Update the metadata section:
```json
"metadata": {
  "version": "1.1",
  "last_updated": "2025-07-14T12:00:00Z",
  "total_activities": 13  // Increment the count
}
```

### Method 2: Use the App Interface

1. Open the Finitude app
2. Go to **Settings** ⚙️
3. Select **Manage Activities**
4. Click the **+** button
5. Fill in the activity details
6. Save

*Note: App-created activities are stored in localStorage and may have different schema structure for compatibility.*

## ✏️ Customizing Existing Activities

### Example: Sunsets - Real vs. Experienced Frequency

**Problem**: Sunsets occur daily (365/year), but you only actively watch 2 per week.

**Solution**: Modify the frequency to reflect your actual experience:

```json
{
  "id": "sunsets",
  "name": "Sunsets Watched",  // Updated name for clarity
  "category": "nature",
  "description": "Weekly sunsets you consciously stop to admire",
  "frequency": {
    "times": 2,      // Changed from 1 daily to 2 weekly
    "period": "week" // Changed from "day" to "week"
  },
  "age_range": {
    "start": 0,
    "end": null,
    "flexible_end": true
  },
  "display": {
    "icon": "🌅",
    "color": "#FF6347"
  },
  "metadata": {
    "user_created": false,
    "is_active": true
  }
}
```

**Result**: Instead of showing ~8,395 sunsets remaining (23 years × 365), it will show ~2,392 sunsets watched (23 years × 52 weeks × 2).

## 📊 Frequency Examples

### Daily Activities
```json
"frequency": { "times": 1, "period": "day" }     // Once daily (365/year)
"frequency": { "times": 3, "period": "day" }     // Three times daily (1,095/year)
```

### Weekly Activities  
```json
"frequency": { "times": 1, "period": "week" }    // Once weekly (52/year)
"frequency": { "times": 2, "period": "week" }    // Twice weekly (104/year)
```

### Monthly Activities
```json
"frequency": { "times": 1, "period": "month" }   // Once monthly (12/year)
"frequency": { "times": 2, "period": "month" }   // Twice monthly (24/year)
```

### Annual Activities
```json
"frequency": { "times": 1, "period": "year" }    // Once yearly (1/year)
"frequency": { "times": 4, "period": "year" }    // Four times yearly (4/year)
```

### Irregular Frequencies
For activities that don't fit standard periods, use the closest approximation:

```json
// Every other day ≈ 182.5 times per year
"frequency": { "times": 182, "period": "year" }

// Every 3 months ≈ 4 times per year  
"frequency": { "times": 4, "period": "year" }

// Every weekday ≈ 260 times per year
"frequency": { "times": 260, "period": "year" }
```

## 🎭 Real vs. Experienced Frequency

Many activities have a **real frequency** (how often they occur) vs. an **experienced frequency** (how often you meaningfully engage with them).

### Examples of Adjustments

| Activity | Real Frequency | Experienced Frequency | Reasoning |
|----------|---------------|---------------------|-----------|
| Sunsets | 365/year | 104/year (2/week) | Only actively watched ones |
| Meals | 1,095/year (3/day) | 365/year (1/day) | Only memorable/special meals |
| Songs | 2,000+/year | 100/year | Only songs that truly move you |
| Conversations | 365+/year | 48/year (1/week) | Only deep, meaningful ones |
| Photos | 1,000+/year | 52/year (1/week) | Only photos you'll treasure |

### When to Use Each

- **Real Frequency**: For routine activities (coffee, sleep, commute)
- **Experienced Frequency**: For meaningful moments (sunsets, deep talks, adventures)

## 📂 Activity Categories

Choose from these categories or create new ones:

- **`nature`**: Sunsets, seasons, walks, weather events
- **`daily_life`**: Meals, coffee, weekends, commute
- **`relationships`**: Family gatherings, deep conversations, dates
- **`personal_growth`**: Books, learning sessions, reflection
- **`health`**: Exercise, medical checkups, self-care
- **`celebration`**: Birthdays, holidays, achievements  
- **`travel`**: Vacations, weekend trips, new places
- **`entertainment`**: Movies, concerts, games, shows

## 🎨 Advanced Customizations

### Age Ranges and Life Expectancy

Age ranges control when activities are relevant in your life and interact with your life expectancy setting in `/src/data/users/default-profile.json`.

#### Age Range Fields

- **`start`**: Age when activity becomes relevant (0 = from birth)
- **`end`**: Age when activity stops being relevant (null = until death)
- **`flexible_end`**: Whether the end age should adjust with life expectancy changes

#### Life Expectancy Interaction

The system calculates remaining occurrences using your life expectancy. For example, with age 57 and life expectancy 80:

```json
// Current user profile
{
  "demographics": { "age": 57 },
  "life_expectancy": { "years": 80 }
}

// Activity calculation
"frequency": { "times": 4, "period": "year" }
// Remaining years: 80 - 57 = 23
// Remaining seasons: 23 × 4 = 92 seasons
```

#### flexible_end: true vs false

**`flexible_end: true`** - Adjusts with life expectancy:
```json
// Activity continues until death
"age_range": {
  "start": 0,
  "end": null,
  "flexible_end": true
}
// If life expectancy changes from 80 to 85, activity extends 5 more years
```

**`flexible_end: false`** - Hard stop at specified age:
```json
// College exams stop at 22 regardless of life expectancy
"age_range": {
  "start": 18,
  "end": 22,
  "flexible_end": false
}
// Even if you live to 100, college exams only calculated for ages 18-22
```

#### Practical Examples

**College Activities** (fixed timeframe):
```json
{
  "id": "college_exams",
  "name": "College Exams",
  "category": "education",
  "frequency": { "times": 8, "period": "year" },
  "age_range": {
    "start": 18,
    "end": 22,
    "flexible_end": false  // Hard stop at graduation
  }
}
```

**Career Activities** (retirement-based):
```json
{
  "id": "career_promotions",
  "name": "Career Promotions",
  "category": "work",
  "frequency": { "times": 1, "period": "3 years" },
  "age_range": {
    "start": 25,
    "end": 65,
    "flexible_end": false  // Hard stop at retirement
  }
}
```

**Lifelong Activities** (adjusts with longevity):
```json
{
  "id": "sunsets_watched",
  "name": "Sunsets Watched",
  "category": "nature",
  "frequency": { "times": 2, "period": "week" },
  "age_range": {
    "start": 0,
    "end": null,
    "flexible_end": true  // Continues until death
  }
}
```

#### The Mortality Clock Effect

This creates a "mortality clock" showing remaining experiences:

- **Life Expectancy 80, Current Age 57**:
  - Remaining birthdays: 23 (80 - 57)
  - Remaining seasons: 92 (23 × 4)
  - Remaining vacations: 23 (23 × 1)

- **If Life Expectancy Updated to 85**:
  - Remaining birthdays: 28 (85 - 57)
  - Remaining seasons: 112 (28 × 4)
  - Activities with `flexible_end: true` automatically recalculate

### Color Theming

Use colors that match the activity's mood:

```json
"display": {
  "icon": "🌅",
  "color": "#FF6347"  // Tomato red for warm sunsets
}
```

Popular color choices:
- **Nature**: `#228B22` (Forest Green), `#87CEEB` (Sky Blue)
- **Celebration**: `#FFD700` (Gold), `#FF69B4` (Hot Pink)  
- **Health**: `#32CD32` (Lime Green), `#4169E1` (Royal Blue)
- **Relationships**: `#FF69B4` (Hot Pink), `#DDA0DD` (Plum)

### Seasonal Variations

For activities that vary by season, use yearly frequency with a note:

```json
{
  "id": "beach_days",
  "name": "Beach Days",
  "category": "travel",
  "description": "Summer days by the ocean (May-September only)",
  "frequency": {
    "times": 8,      // 8 beach days per year
    "period": "year"
  }
}
```

## 🔄 Migration to Database

When moving to Supabase, this JSON structure maps directly to database tables:

```sql
-- Activities table
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  frequency_times INTEGER,
  frequency_period TEXT,
  age_start INTEGER,
  age_end INTEGER,
  flexible_end BOOLEAN,
  icon TEXT,
  color TEXT,
  user_created BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User activity customizations
CREATE TABLE user_activities (
  user_id UUID,
  activity_id TEXT,
  custom_frequency_times INTEGER,
  custom_frequency_period TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
```

## 💡 Tips and Best Practices

1. **Start with Experience**: Focus on meaningful encounters, not mechanical occurrences
2. **Be Realistic**: Base frequencies on your actual lifestyle and habits
3. **Use Clear Names**: "Sunsets Watched" vs. "Sunsets" clarifies the intention
4. **Test Calculations**: Check if the resulting countdown feels emotionally accurate
5. **Iterate**: Adjust frequencies as you learn what resonates with you
6. **Backup**: Save your customizations before major changes

---

**Remember**: The goal is to create meaningful awareness of life's finite moments, not to track every occurrence. Choose frequencies that inspire intentionality and gratitude.