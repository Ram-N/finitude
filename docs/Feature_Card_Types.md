
# Introducing Card Types (Experiential vs Financial)


## Key changes in the Financial Cards

There are 3 new keys to the JSON structure now.

`amount` - The numerical value (15.99, 350.00, etc.)
`unit` - What the amount represents (month, visit, ride, meal, etc.)
`currency` - All set to USD, but you can change as needed

Unit types used:

month - For monthly subscriptions and bills
year - For annual fees
week - For weekly expenses like groceries
visit - For per-visit costs (doctor, dental, coffee shop)
meal - For restaurant dining
ride - For transportation services
night - For hotel stays
roundtrip - For flights
tank - For gas
cut - For haircuts
service - For car maintenance
quarter - For quarterly expenses
event - For entertainment
hour - For parking

Description column is now pure text without dollar amounts, making it cleaner and more focused on what the expense actually is.
This structure makes calculations straightforward:

You have to figure out the "future occurrences" remaining, based on current age and end_age.
For example, if user is 57, and end_age is `77` then there are 20*12 months remaining.
And if some financial activities occurs 2/month, then occurrences is simply 2/month * 20 years * 12 months = 480.

`Total cost = amount × occurrences`
`Display format: "$X per [unit]"`

Note the addition of the "type" key to the json structure. This is important.

```json
{
  "id": "netflix_subscription",
  "name": "Netflix Subscription",
  "type": "financial",  // Core differentiator
  "category": "subscriptions",
  "description": "Premium streaming entertainment",  // Pure text
  "frequency": {
    "times": 12,
    "period": "year"
  },
  "financial": {  // Only for type="financial"
    "amount": 15.99,
    "unit": "month",  // or "visit", "trip", "tank", etc.
    "currency": "USD"
  },
  "display": {
    "icon": "📺",
    "color": "#E50914"
  }
}
```
##  Update React Components

Idea to Create Type-Specific Card Components:

// ActivityCard.jsx - Main dispatcher
const ActivityCard = ({ activity, remainingOccurrences }) => {
  switch (activity.type) {
    case 'financial':
      return <FinancialActivityCard activity={activity} occurrences={remainingOccurrences} />;
    case 'quote':
      return <QuoteActivityCard activity={activity} occurrences={remainingOccurrences} />;
    case 'experiential':
    default:
      return <ExperientialActivityCard activity={activity} occurrences={remainingOccurrences} />;
  }
};

// FinancialActivityCard.jsx
const FinancialActivityCard = ({ activity, occurrences }) => {
  const { amount, unit, currency } = activity.financial || {};
  const totalAmount = amount * occurrences;
  
  return (
    <Card className="financial-card">
      <div className="card-front">
        <Icon>{activity.display.icon}</Icon>
        <h3>{formatCurrency(totalAmount, currency)}</h3>
        <p>remaining in {activity.name}</p>
      </div>
      <div className="card-back">
        <h4>{activity.name}</h4>
        <p>{activity.description}</p>
        <div className="financial-details">
          <span>{occurrences} × {formatCurrency(amount, currency)}</span>
          <span>per {unit}</span>
        </div>
      </div>
    </Card>
  );
};


### Phase 3: Add Type Filtering
javascript// Add type filter to your UI

```javascript
const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities', icon: '🎯' },
  { value: 'experiential', label: 'Life Events', icon: '✨' },
  { value: 'financial', label: 'Financial', icon: '💰' },
  { value: 'quote', label: 'Quotes', icon: '💭' }
];
```


Benefits of This Approach

Extensibility: Easy to add new types (health metrics, goals, etc.)
Clean Data: Description remains pure text, calculations are explicit
Type Safety: Each type has its own data structure
Better UX: Different card designs for different types
Future-Proof: Can add type-specific features later

### Migration Path

1. Update your React components to handle types
2. Test with mixed activity types


## Multiple Tabs Approach (Your Preference)

**Pros:**
- **Mental clarity**: Each tab has its own purpose and structure
- **Different columns**: Financial tab can have amount/unit/currency columns that don't clutter the Experiences tab
- **Easier editing**: When adding quotes, you're not scrolling past financial entries
- **Natural organization**: Matches how you think about these different types
- **Simpler validation**: Each tab can have its own required columns

**Cons:**
- Script needs to read multiple tabs
- Need to ensure no ID conflicts across tabs

1. **Each type has different data needs** - no wasted columns
2. **Cleaner mental model** - matches your app's type system
3. **Scales better** - easy to add new types as new tabs

## Implementation Approach

Here's how to modify the Python script to handle multiple tabs:

```python
def read_all_tabs_from_google_sheets(sheet_id: str) -> pd.DataFrame:
    """Read all tabs and combine them"""
    tabs = {
        'Experiences': 'experiential',
        'Financial': 'financial', 
        'Quotes': 'quote'
    }
    
    all_activities = []
    
    for tab_name, activity_type in tabs.items():
        try:
            # Each tab has its own export URL
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={get_tab_gid(sheet_id, tab_name)}"
            df = pd.read_csv(csv_url)
            
            # Add the type column based on tab
            df['type'] = activity_type
            
            all_activities.append(df)
            print(f"✓ Loaded {len(df)} activities from '{tab_name}' tab")
            
        except Exception as e:
            print(f"Warning: Could not read '{tab_name}' tab: {e}")
    
    # Combine all dataframes
    if all_activities:
        return pd.concat(all_activities, ignore_index=True)
    return None
```

## Tab Structure

**Experiences Tab:**
```
name,category,frequency,description,icon,age_start,age_end,color
Sunsets Watched,nature,52/year,Weekly moments of beauty,🌅,0,,#FF6347
```

**Financial Tab:**
```
name,category,frequency,description,icon,amount,unit,currency,age_start,color
Netflix,subscriptions,12/year,Streaming service,📺,15.99,month,USD,18,#E50914
```

This is for the future... The quotes are working fine for now.
**Quotes Tab:**
```
name,category,description,icon,author,frequency
Life is Short,reflection,Make it count,💭,Marcus Aurelius,1/year
```

## Quick Implementation Stub

```python
# Add this to your script
def get_sheet_id_and_gid(url):
    """Extract sheet ID and tab GID from URL"""
    # URL format: https://docs.google.com/spreadsheets/d/{id}/edit#gid={gid}
    sheet_id = url.split('/d/')[1].split('/')[0]
    # For simplicity, you might want to hardcode GIDs initially
    return sheet_id

# Hardcode tab GIDs (you can find these in the URL when you click each tab)
TAB_GIDS = {
    'Experiences': '0',  # Usually first tab
    'Financial': '123456789',  # Replace with actual GID
    'Quotes': '987654321'  # Replace with actual GID
}

# Or alternatively, just use separate sheet URLs
SHEET_URLS = {
    'experiential': 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0',
    'financial': 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=123456789',
    'quote': 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=987654321'
}
```

This approach aligns perfectly with your type system and will make maintenance much easier. 
