# Google Sheets Activities Template: User Guide

This guide will help you customize your copy of the Activities Template to create your own personalized Finitude data.

## Getting Started

1. **Make a Copy**: Make a copy of the Google Sheets template to your own Google Drive
2. **Rename**: Give your copy a descriptive name (e.g., "My Finitude Activities")
3. **Understand the Tabs**: The template has three tabs:
   - **Experiences**: Regular activities you do in life
   - **Financial**: Costs that recur in your life
   - **Quotes**: Inspirational quotes for reflection

## General Guidelines

- **Do not delete** the header row in any tab
- **Do not rename** the tabs
- All data will be read by the conversion script when you run it
- Always use UTF-8 characters (including emojis)

## Tab 1: Experiences

This tab contains activities you do in your life.

### Field Requirements

| Field | Required? | Format | Description |
|-------|-----------|--------|-------------|
| name | **Required** | Text | Short, descriptive name (e.g., "Family Dinners") |
| category | **Required** | Text | Category like "nature", "celebration", "relationships", etc. |
| frequency | **Required** | Format: `[number]/[period]` | How often it occurs - "1/year", "52/year", "365/year", "12/year", etc. |
| description | **Required** | Text | Brief description of the activity |
| icon | **Required** | Emoji | Visual representation (emoji) |
| age_start | Optional | Number | Age when you start doing this activity (default: 0) |
| age_end | Optional | Number | Age when you stop doing this activity (leave blank for lifetime) |
| color | Optional | Hex code | Custom color (e.g., "#FF6347") |
| is_active | Optional | TRUE/FALSE | Whether this activity is active (default: TRUE) |
| user_created | Optional | TRUE/FALSE | Whether you created this (default: TRUE) |

### Examples

```
Birthdays    celebration    1/year    Annual celebration of life    🎂    0        #FFD700    TRUE    TRUE
Bike Rides    exercise    24/year    Cycling through nature    🚲    0        #2ECC71    TRUE    TRUE
```

## Tab 2: Financial

This tab contains recurring financial costs in your life.

### Field Requirements

| Field | Required? | Format | Description |
|-------|-----------|--------|-------------|
| name | **Required** | Text | Name of the financial activity |
| category | **Required** | Text | Category like "subscriptions", "health", "utilities", etc. |
| frequency | **Required** | Format: `[number]/[period]` | How often you pay - "1/year", "12/year", etc. |
| description | **Required** | Text | Brief description |
| icon | **Required** | Emoji | Visual representation (emoji) |
| amount | **Required** | Number | Cost amount (e.g., 15.99) |
| unit | **Required** | Text | Payment frequency unit (e.g., "month", "year", "visit") |
| currency | **Required** | 3-letter code | Currency code (e.g., "USD", "EUR", "GBP") |
| age_start | Optional | Number | Age when you start paying this (default: 0) |
| age_end | Optional | Number | Age when you stop paying this (leave blank for lifetime) |
| color | Optional | Hex code | Custom color (e.g., "#1DB954") |
| is_active | Optional | TRUE/FALSE | Whether this expense is active (default: TRUE) |
| user_created | Optional | TRUE/FALSE | Whether you created this (default: TRUE) |

### Examples

```
Netflix Subscription    subscriptions    12/year    Premium streaming entertainment    📺    15.99    month    USD    18        #E50914    TRUE    TRUE
Car Insurance    insurance    4/year    Quarterly auto coverage    🚗    250    quarter    USD    16    80    #3498DB    TRUE    TRUE
```

## Tab 3: Quotes

This tab contains meaningful quotes that will appear randomly in your app.

### Field Requirements

| Field | Required? | Format | Description |
|-------|-----------|--------|-------------|
| name | **Required** | Text | Descriptive name for the quote (e.g., "Seneca Quote") |
| category | **Required** | Text | Usually "reflection" for quotes |
| description | **Required** | Format: `Quote text - Author` | The quote followed by author name, separated by " - " |

### Important Note About Quotes
The description field MUST follow the format "Quote text - Author" with the dash surrounded by spaces. This format is used to extract the quote text and author separately.

### Examples

```
Seneca Quote    reflection    It is not that we have a short time to live, but that we waste much of it. - Seneca
Marcus Aurelius Quote    reflection    You could leave life right now. Let that determine what you do and say and think. - Marcus Aurelius
```

## Tips for Success

1. **Categories**: Try to use consistent categories across your activities
2. **Icons**: Choose emojis that visually represent your activities well
3. **Frequency**: Be realistic about frequency - yearly (1/year), monthly (12/year), weekly (52/year), daily (365/year)
4. **Names**: Keep names concise but descriptive
5. **Financial Unit**: Choose the most appropriate unit (month, year, visit, meal, etc.)

## Running the Conversion Script

After updating your Google Sheets, you'll need to run the conversion script:

1. Make sure your Google Sheet is publicly accessible (or shared with the script user)
2. Copy your Google Sheet URL
3. Run the conversion script with your sheet URL:
   ```
   python scripts/convert_activities_sheets_to_json.py --sheet-url YOUR_GOOGLE_SHEET_URL
   ```

The script will generate a JSON file with all your activities, financial items, and quotes ready for use in the Finitude app.