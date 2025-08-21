# Activities Management Workflow

This document describes the complete workflow for managing activities in the Finitude application, from Google Sheets to the final JSON integration.

## Overview

There are four main steps to manage activities in the Finitude application:

1. **Set up your Google Sheets** containing all activities in a structured format
2. **Run the conversion script** which takes the Google Sheets data and creates a local activities.json file
3. **Test the generated JSON file** to ensure it was created correctly
4. **Replace the existing activities.json** file with the newly generated one

All of these steps can be performed using npm run commands, and this document provides detailed instructions for each step of the process.

The activities management system follows this workflow:

## Step 1: Setting Up Google Sheets

### Create Your Google Sheets Document

1. Create a new Google Sheets document
2. Create the following tabs:
   - **Experiences** (first tab): For regular experiential activities
   - **Financial** (second tab): For financial activities with amount/currency
   - **Quotes** (optional third tab): For reflective quotes

### Configure Permissions

1. Click the "Share" button in the top-right corner
2. Set access to "Anyone with the link can view"
3. Copy the URL for use with the conversion script

### Set Up Each Tab

#### Experiences Tab

Create a header row with these columns:
```
name | category | frequency | description | icon | age_start | age_end | color | is_active | user_created
```

Example data row:
```
Morning Coffee | routine | daily | Daily caffeine ritual | ☕ | 18 |  | #4A90E2 | true | true
```

#### Financial Tab

Create a header row with these columns:
```
name | category | frequency | description | icon | amount | unit | currency | age_start | age_end | color | is_active
```

Example data row:
```
Netflix | subscriptions | monthly | Streaming service | 📺 | 15.99 | month | USD | 18 |  | #E50914 | true
```

#### Quotes Tab (Optional)

Create a header row with these columns:
```
name | category | description | icon | frequency
```

Example data row:
```
Life is Short | reflection | Make it count - Marcus Aurelius | 💭 | 1/year
```

## Step 2: Running the Conversion Script

### Basic Usage

```bash
# Interactive mode (will prompt for Google Sheet URL)
npm run generate-activities

# Specify sheet URL directly
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

### Advanced Options

```bash
# Replace default activities (with automatic backup)
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --replace-default

# Dry run (test without writing files)
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --dry-run

# Skip specific tabs
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --skip-financial
```

### Using Local CSV Files

If you prefer working with local files:

```bash
# Use a local CSV file
npm run generate-activities -- path/to/activities.csv
```

### Manually Specifying Tab GIDs

If your tabs have custom GIDs:

```bash
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --experiences-tab 0 --financial-tab 123456789
```

## Step 3: Testing Activities

### Review Console Output

The script also provides detailed validation and statistics:
- Column validation
- Activity counts by type and category
- Financial activity analysis
- Data quality metrics

### Perform a Dry Run

Always perform a dry run before replacing default activities:

```bash
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --dry-run
```

This will show you the final JSON structure without writing to any files.

### Review Generated File

If not using dry run, the script will generate `imported-activities.json` in the `src/data/activities/` directory. You can:

1. Open this file and check the structure
2. Test it with the app without replacing the default file
3. Verify that categories, icons, and formats appear correctly

## Step 4: Deploying Activities

### Best Practice Workflow

Follow this workflow to safely update your activities:

1. **Backup current activities**: The script automatically creates backups when using `--replace-default`
2. **Replace default activities**:
   ```bash
   npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --replace-default
   ```
3. **Verify in the app**: Run the app and check that activities display correctly
4. **If needed, restore from backup**:
   ```bash
   # Restore from the most recent backup (example filename)
   cp src/data/activities/default-activities.backup.1752765378.json src/data/activities/default-activities.json
   ```

### Integrating with Version Control

When working with git:

1. Commit your changes after updating activities
2. Include both the script and the generated JSON
3. Document changes in commit messages

Example commit workflow:
```bash
# After updating activities
git add src/data/activities/default-activities.json
git commit -m "Update activities: Add new financial categories"
```

## Troubleshooting

### Common Issues and Solutions

#### "Error reading from Google Sheets"
- Ensure your sheet is set to "Anyone with the link can view"
- Verify your Google Sheets URL is correct
- Check your internet connection

#### "Could not read [Tab] tab"
- Verify the tab name matches exactly (case-sensitive)
- Check that the tab GID is correct
- Ensure the tab has the required columns

#### "Invalid frequency format"
- Use standard formats like: `daily`, `weekly`, `monthly`, `1/year`, `52/year`
- Check for typos in frequency cells

#### "Missing required columns"
- Ensure your sheet has the required columns (`name`, `category`)
- Column names must match exactly (case-sensitive)
- No spaces before or after column names

## Activity Format Reference

### Frequency Formats

The script supports these frequency formats:
- `daily`, `everyday`, `every day` (→ 365/year)
- `weekly`, `every week` (→ 52/year)
- `monthly`, `every month` (→ 12/year)
- `yearly`, `annually`, `every year` (→ 1/year)
- `N/day`, `N/week`, `N/month`, `N/year` (where N is a number)

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
| subscriptions | #7C3AED | 📊 |
| insurance | #2563EB | 🛡️ |
| utilities | #059669 | 🔌 |
| housing | #DC2626 | 🏠 |
| transportation | #F59E0B | 🚗 |
| financial | #10B981 | 💰 |
| reflection | #8B5CF6 | 💭 |

## Using Configuration Files

To avoid entering the Google Sheets URL and other options each time, you can use a configuration file:

### Setting Up Configuration

```bash
# Save the current settings to config file
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --save-config

# Run with saved configuration (no need to specify URL again)
npm run generate-activities
```

### Configuration Management

```bash
# Show current configuration
npm run generate-activities -- --show-config

# Reset to default configuration
npm run generate-activities -- --reset-config
```

### Configuration File Location

The configuration is stored in:
```
src/data/config/activities_config.json
```

You can edit this file directly with a text editor if needed.

### Configuration File Format

```json
{
  "activities": {
    "sheet_url": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
    "tabs": {
      "experiences": "0",
      "financial": "123456789",
      "quotes": "987654321"
    },
    "default_output": {
      "filename": "imported-activities.json",
      "directory": "src/data/activities/"
    },
    "preferences": {
      "create_backups": true,
      "default_replace": false,
      "skip_financial": false,
      "skip_quotes": false
    }
  }
}
```

## Advanced: Manual Tab GID Detection

To find the GID for a specific tab:

1. Open your Google Sheets document
2. Click on the tab you want to use
3. Look at the URL - the GID appears after `#gid=`
4. Use this GID with the `--experiences-tab`, `--financial-tab`, or `--quotes-tab` options

Example URL with GID:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=123456789
```

In this example, the GID is `123456789`.