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

