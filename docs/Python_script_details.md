# Task Implementation: Update Python Script to Read Finance Tab

## Overview

This document describes the implementation of multi-tab Google Sheets reading functionality for the `scripts/convert_to_json2.py` script. The script now reads from both the Experiences and Financial tabs, combines the data, and outputs a single JSON file with enhanced functionality.

## Implementation Summary

### ✅ Completed Tasks

1. **Added Complete Argparse Implementation**
   - Copied full argparse setup from `convert_activities_in_sheets_to_JSON.py`
   - Added support for: `--replace-default`, `--filename`, `--output-dir`, `--dry-run`, `--no-backup`
   - Includes comprehensive help text and usage examples

2. **Created Multi-Tab Reading Functions**
   - `read_from_google_sheets_tab()` - Reads from a specific tab using GID
   - `read_from_google_sheets_multi_tab()` - Reads from both Experiences and Financial tabs
   - Proper error handling and progress reporting

3. **Implemented Combined Data Processing**
   - Reads from both tabs using predefined GIDs
   - Combines data into a single DataFrame
   - Maintains backward compatibility with existing single-tab functionality

4. **Fixed Output Directory Structure**
   - Changed from current directory to `src/data/activities/`
   - Added project root detection logic
   - Proper directory creation with `mkdir(parents=True, exist_ok=True)`

5. **Added Proper JSON Structure**
   - Wraps activities in metadata structure with version, timestamps, and source info
   - Matches the format of the original script

6. **Implemented File Backup Functionality**
   - Creates timestamped backups when overwriting existing files
   - Follows the same backup pattern as the original script

7. **Enhanced Validation**
   - Better error messages with activity names and row numbers
   - Validates financial activity requirements (amount, currency format)
   - Comprehensive column reporting

8. **Enhanced Summary Reporting**
   - Detailed statistics by activity type and category
   - Financial activity analysis with totals by currency
   - Quote activity preview
   - Data quality metrics (descriptions, custom icons, etc.)

## Key Features

### Multi-Tab Support
- **Experiences Tab (GID: '0')**: Traditional experiential activities
- **Financial Tab (GID: '2109664992')**: Financial activities with amount, unit, currency
  - **Auto-type Setting**: All activities from Financial tab automatically have `type='financial'`
- **Combined Processing**: Automatically merges data from both tabs

### Financial Activity Integration
The script handles the 3 financial columns mentioned in the requirements:
- `amount`: Numeric value (required for financial activities)
- `unit`: Unit of measurement (e.g., "month", "occurrence", "year")
- `currency`: 3-letter currency code (e.g., "USD", "EUR")

### Command Line Interface
```bash
# Safe default - outputs to src/data/activities/imported-activities.json
python scripts/convert_to_json2.py

# Replace default file (with backup)
python scripts/convert_to_json2.py --replace-default

# Custom filename
python scripts/convert_to_json2.py --filename my-activities.json

# Dry run to test
python scripts/convert_to_json2.py --dry-run

# Custom output directory
python scripts/convert_to_json2.py --output-dir /path/to/custom/dir
```

## Technical Details

### Tab Configuration
```python
TAB_GIDS = {
    'Experiences': '0',  # Usually first tab
    'Financial': '2109664992',  # Financial tab GID
    'Quotes': '1377645241'  # Quote tab GID (for future use)
}
```

### Data Processing Flow
1. **Read from Google Sheets**: Uses tab-specific GIDs to read from multiple tabs
2. **Auto-type Assignment**: All activities from Financial tab automatically get `type='financial'`
3. **Combine DataFrames**: Merges data from both tabs into single DataFrame
4. **Validate Data**: Checks required columns and validates financial data
5. **Process Activities**: Converts each row to proper JSON structure
6. **Generate Summary**: Provides comprehensive statistics and previews
7. **Output JSON**: Creates structured JSON with metadata wrapper

### Error Handling
- Graceful handling of missing tabs
- Detailed error messages with row numbers and activity names
- Validation of financial data (amount format, currency codes)
- Backup creation before overwriting files

### Data Quality Features
- Column availability reporting
- Missing optional column notifications
- Activity statistics (active, user-created, age-limited)
- Financial totals by currency
- Custom icon usage tracking

## Output Structure

The script creates a JSON file with the following structure:
```json
{
  "activities": [
    {
      "id": "activity_id",
      "name": "Activity Name",
      "type": "experiential|financial|quote",
      "category": "category_name",
      "frequency": {"times": 1, "period": "year"},
      "age_range": {"start": 0, "end": null, "flexible_end": true},
      "display": {"icon": "🎉", "color": "#FFD700", "format": "occurrences"},
      "financial": {"amount": 100.0, "unit": "month", "currency": "USD"},
      "metadata": {
        "user_created": true,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00",
        "source": "csv_import"
      }
    }
  ],
  "metadata": {
    "version": "2.0",
    "created_at": "2024-01-01T00:00:00",
    "last_updated": "2024-01-01T00:00:00",
    "total_activities": 100,
    "source": "csv_import",
    "generated_by": "convert_to_json2.py"
  }
}
```

## Usage Examples

### Basic Usage
```bash
# Process Google Sheets and output to default location
python scripts/convert_to_json2.py

# Test with dry run
python scripts/convert_to_json2.py --dry-run
```

### Advanced Usage
```bash
# Replace default activities file (with backup)
python scripts/convert_to_json2.py --replace-default

# Custom filename and skip backup
python scripts/convert_to_json2.py --filename my-activities.json --no-backup

# Process local CSV file
python scripts/convert_to_json2.py path/to/activities.csv
```

## Required Google Sheets Structure

### Experiences Tab
- `name` (required): Activity name
- `category` (required): Activity category
- `type` (optional): Activity type (defaults to 'experiential')
- `frequency` (optional): Frequency string (e.g., "1/year", "monthly")
- `description` (optional): Activity description
- `icon` (optional): Custom emoji icon
- `color` (optional): Custom color hex code
- `age_start` (optional): Starting age
- `age_end` (optional): Ending age
- `is_active` (optional): Active status (true/false)
- `user_created` (optional): User created flag (true/false)

### Financial Tab
- All columns from Experiences tab, plus:
- `amount` (required for financial): Numeric amount
- `unit` (optional): Unit of measurement
- `currency` (optional): 3-letter currency code

## Testing

To test the implementation:

1. **Dry Run**: `python scripts/convert_to_json2.py --dry-run`
2. **Test with CSV**: Create a test CSV file with sample data
3. **Validate Output**: Check the generated JSON structure
4. **Verify Backup**: Ensure backups are created when overwriting files

## Future Enhancements

1. **Quote Tab Support**: The script already has GID for quotes tab
2. **Custom Tab Selection**: Allow users to specify which tabs to process
3. **Enhanced Validation**: More detailed financial data validation
4. **Export Formats**: Support for additional output formats (CSV, Excel)
5. **Progress Bars**: Visual progress indicators for large datasets

## Troubleshooting

### Common Issues

1. **Tab Not Found**: Ensure the GID values in `TAB_GIDS` match your Google Sheets tabs
2. **Permission Errors**: Make sure the Google Sheets document is publicly readable
3. **Missing Columns**: Check the validation output for required column information
4. **Financial Data Errors**: Ensure amount values are numeric and currencies are 3-letter codes

### Getting Tab GIDs

1. Open your Google Sheets document
2. Click on the tab you want to use
3. Look at the URL - the GID appears after `#gid=`
4. Update the `TAB_GIDS` dictionary in the script

## Files Modified

- `scripts/convert_to_json2.py` - Main implementation
- `docs/Tasks.md` - This documentation file

## Dependencies

- `pandas` - Data manipulation and CSV reading
- `argparse` - Command line argument parsing
- `pathlib` - Modern path handling
- `json` - JSON serialization
- `datetime` - Timestamp generation
- `shutil` - File operations (backup)

---

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


*Generated by Claude Code - Task Implementation Documentation*