# Scripts Directory - Activities Management

This directory contains utility scripts for managing activities in the Tick-Tock project.

## Activities Generation Workflow

### Overview
The `convert_activities_in_sheets_to_JSON.py` script converts a Google Sheets spreadsheet into the complex JSON structure required by the app. This allows for easy, human-friendly editing of activities without dealing with JSON syntax.

### Prerequisites
1. **Dependencies**: The script uses `uv` to manage Python dependencies automatically
2. **Google Sheet Setup**:
   - Sheet name: `finitude_activities_ram`
   - Make it publicly readable: Share → "Anyone with the link can view"
   - Current sheet URL is already configured in the script

### Google Sheets Structure

Your Google Sheets header row should be:
```
name | category | frequency | description | icon | age_start | age_end | color | is_active | user_created
```

**Required columns** (must have these three):
- `name` - The display name of the activity
- `category` - Category type (see below for options)
- `frequency` - How often it occurs (see formats below)

**Optional columns**:
- `description` - Detailed description of the activity
- `icon` - Custom emoji icon (overrides category default)
- `age_start` - Starting age (default: 0)
- `age_end` - Ending age (when provided, sets `flexible_end=false`)
- `color` - Custom hex color (overrides category default)
- `is_active` - Whether activity is active (true/false, default: true)
- `user_created` - Whether user created this activity (true/false, default: true)

### Key Age Range Logic

- **`age_start`**: Age when activity becomes relevant (0 = from birth)
- **`age_end`**: Age when activity stops being relevant (empty = continues until death)
- **`flexible_end`**: Automatically set to `false` when `age_end` is provided, `true` when empty

Examples:
- `age_start=0, age_end=` → Activity for entire life (`flexible_end=true`)
- `age_start=18, age_end=65` → Career activity (`flexible_end=false`)
- `age_start=5, age_end=` → Activity starting at age 5 until death (`flexible_end=true`)

### Categories and Their Defaults

| Category | Default Color | Default Icon |
|----------|--------------|--------------|
| celebration | #FFD700 | 🎉 |
| nature | #FF6347 | 🌳 |
| routine | #4A90E2 | ☕ |
| exercise | #2ECC71 | 💪 |
| social | #E74C3C | 👥 |
| learning | #9B59B6 | 📚 |
| travel | #1ABC9C | ✈️ |
| food | #F39C12 | 🍽️ |
| work | #34495E | 💼 |
| hobby | #16A085 | 🎨 |
| relationships | #9370DB | 💭 |
| health | #32CD32 | 🏃 |
| personal_growth | #4169E1 | 🎓 |
| entertainment | #8A2BE2 | 🎵 |
| experiences | #DC143C | 🍽️ |
| reflection | #8B4513 | 📔 |
| universal | #87CEEB | 🌅 |
| daily_life | #8B4513 | ☕ |

### Frequency Formats

The script accepts flexible frequency formats:
- `1/year`, `12/year`, `52/year`, `365/year`
- `1/week`, `2/week` (converted to per year)
- `1/month`, `6/month` (converted to per year)
- `daily`, `weekly`, `monthly`, `yearly`
- `everyday`, `every week`, `every month`

## Usage Examples

### Basic Usage (Recommended)

```bash
# Generate activities to imported-activities.json (safe default)
npm run generate-activities

# OR using uv directly
uv run python scripts/convert_activities_in_sheets_to_JSON.py
```
- **Output**: `src/data/activities/imported-activities.json`
- **Safe**: Won't overwrite your default activities
- **Backup**: Not needed since it creates a new file

### Replace Default Activities

```bash
# Replace default-activities.json with backup
npm run generate-activities -- --replace-default

# OR using uv directly
uv run python scripts/convert_activities_in_sheets_to_JSON.py --replace-default
```
- **Output**: `src/data/activities/default-activities.json`
- **Backup**: Automatically creates backup file (e.g., `default-activities.backup.1731234567.json`)
- **Use when**: You want to completely replace the default activities

### Testing and Validation

```bash
# Dry run - see output without writing files
npm run generate-activities -- --dry-run

# OR using uv directly
uv run python scripts/convert_activities_in_sheets_to_JSON.py --dry-run
```
- **Output**: Console only (no file created)
- **Use when**: Testing your Google Sheets changes before committing

### Custom Filename

```bash
# Custom filename in activities directory
npm run generate-activities -- --filename my-activities.json

# OR using uv directly
uv run python scripts/convert_activities_in_sheets_to_JSON.py --filename my-activities.json
```
- **Output**: `src/data/activities/my-activities.json`
- **Use when**: You want a specific filename

### Custom Directory

```bash
# Custom output directory
uv run python scripts/convert_activities_in_sheets_to_JSON.py --output-dir /path/to/custom/dir
```
- **Output**: Custom directory location
- **Use when**: You need output in a different location

### Skip Backup

```bash
# Skip backup when overwriting (not recommended)
npm run generate-activities -- --replace-default --no-backup
```
- **Use when**: You're absolutely sure you don't need a backup

### Local CSV File

```bash
# Use local CSV file instead of Google Sheets
uv run python scripts/convert_activities_in_sheets_to_JSON.py path/to/activities.csv
```
- **Use when**: Working with local CSV files instead of Google Sheets

### Help and Options

```bash
# See all available options
uv run python scripts/convert_activities_in_sheets_to_JSON.py --help
```

## Step-by-Step Workflow

### 1. Edit the Google Sheet
- Go to your `finitude_activities_ram` sheet
- Add new activities or modify existing ones
- Ensure required columns (name, category, frequency) are filled
- Use `age_end` when you want activities to stop at a specific age

### 2. Test Your Changes
```bash
# Dry run to validate data
npm run generate-activities -- --dry-run
```
- Check console output for validation errors
- Verify activities have correct `flexible_end` values
- Look for "Setting flexible_end=False" messages for activities with `age_end`

### 3. Generate Activities
```bash
# Generate to safe location
npm run generate-activities
```
- Creates `src/data/activities/imported-activities.json`
- Review the generated file structure

### 4. Integrate with App
Option A: **Use imported file directly**
```javascript
import activities from './src/data/activities/imported-activities.json'
```

Option B: **Replace default activities**
```bash
# Replace default file (with backup)
npm run generate-activities -- --replace-default
```

### 5. Test in App
- Run the app locally to verify new activities appear correctly
- Check that icons, colors, and age ranges display as expected
- Verify `flexible_end=false` activities show age limits

## Output Structure

The script generates proper JSON structure matching the app's requirements:

```json
{
  "activities": [
    {
      "id": "morning_coffee",
      "name": "Morning Coffee",
      "category": "routine",
      "description": "Daily caffeine ritual",
      "frequency": {
        "times": 365,
        "period": "year"
      },
      "age_range": {
        "start": 18,
        "end": null,
        "flexible_end": true
      },
      "display": {
        "icon": "☕",
        "color": "#4A90E2"
      },
      "metadata": {
        "user_created": true,
        "is_active": true,
        "created_at": "2025-07-15T16:04:02.879277",
        "source": "csv_import"
      }
    }
  ],
  "metadata": {
    "version": "2.0",
    "created_at": "2025-07-15T16:04:02.880735",
    "last_updated": "2025-07-15T16:04:02.880736",
    "total_activities": 40,
    "source": "csv_import",
    "generated_by": "convert_activities_in_sheets_to_JSON.py"
  }
}
```

## Console Output Explained

When you run the script, you'll see detailed output like:

```
✓ Processed: Books Read (ages 10-75, flexible_end=False, active=True, user_created=True)
Info: Setting flexible_end=False for Books Read due to age_end=75
```

This tells you:
- **Activity name**: "Books Read"
- **Age range**: 10-75 years old
- **flexible_end=False**: Activity stops at age 75 (not life expectancy)
- **active=True**: Activity is enabled
- **user_created=True**: User-created activity

## Example Google Sheets Entry

```
name,category,frequency,description,icon,age_start,age_end,color,is_active,user_created
"Family Game Night",social,weekly,"Board games and laughter",🎲,6,,#E74C3C,true,true
"College Courses",learning,32/year,"University semester courses",🎓,18,22,,true,true
"Retirement Planning",work,1/year,"Annual financial review",💼,40,65,,true,true
"Morning Coffee",routine,daily,"Daily caffeine ritual",☕,18,,,true,true
```

## Troubleshooting

**"Error reading from Google Sheets"**
- Ensure sheet is set to "Anyone with link can view"
- Check internet connection
- Verify Google Sheets URL is correct in script

**"Missing required columns"**
- Your sheet must have columns named exactly: `name`, `category`, `frequency`
- Column names are case-sensitive

**"Invalid frequency"**
- Check frequency format matches accepted patterns
- Script will default to "1/year" if it can't parse

**"Available columns" shows missing columns**
- Check your Google Sheets header row matches expected format
- Ensure no typos in column names

## File Locations

- **Script**: `scripts/convert_activities_in_sheets_to_JSON.py`
- **Default output**: `src/data/activities/imported-activities.json`
- **Default activities**: `src/data/activities/default-activities.json`
- **Backups**: `src/data/activities/default-activities.backup.TIMESTAMP.json`

## Notes

- The script generates IDs automatically from activity names
- All CSV-imported activities have `user_created: true` unless specified otherwise
- Timestamps are added to track when activities were imported
- The script validates data and provides helpful error messages
- Backup files are created with timestamps for easy identification
- Age ranges with `age_end` automatically set `flexible_end=false`