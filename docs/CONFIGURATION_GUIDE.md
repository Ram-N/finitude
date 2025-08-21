# Activities Configuration Guide

This document explains how to configure and customize the activities generation script using configuration files.

## Configuration Overview

The `convert_activities_sheets_to_json.py` script can use a configuration file to remember your preferences, including:

- Google Sheets URL
- Tab GIDs for different activity types
- Default output settings
- Script behavior preferences

Using a configuration file eliminates the need to specify these options every time you run the script.

## Configuration File Location

The configuration file is stored at:
```
src/data/config/activities_config.json
```

A template with comments is also available at:
```
src/data/config/activities_config.template.json
```

## Setting Up Configuration

### Using Command-Line Options

The easiest way to create a configuration file is to use the `--save-config` option:

```bash
# Save Google Sheets URL to configuration
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --save-config

# Save URL and tab GIDs to configuration
npm run generate-activities -- --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --financial-tab 123456789 --save-config
```

### Interactive Setup

When running the script without a specified URL, you'll be prompted to enter one:

```bash
npm run generate-activities
```

After entering the URL, you'll be asked if you want to save it for future use:
```
Please enter the Google Sheets URL:
URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
Save this URL for future use? (y/n): y
```

### Manual Configuration

You can also create or edit the configuration file manually. The file is in JSON format:

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
  },
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-08-21T16:45:32.124Z",
    "created_at": "2025-08-21T16:45:32.124Z"
  }
}
```

## Configuration Options Explained

### `sheet_url`

The URL of your Google Sheets document containing activity data.

```json
"sheet_url": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
```

### `tabs`

GIDs for each tab in your Google Sheets document:

```json
"tabs": {
  "experiences": "0",        // GID for Experiences tab (usually 0 for first tab)
  "financial": "123456789",  // GID for Financial tab
  "quotes": "987654321"      // GID for Quotes tab
}
```

To find a tab's GID, click on the tab in Google Sheets and look at the URL. The GID appears after `#gid=`.

### `default_output`

Default output file settings:

```json
"default_output": {
  "filename": "imported-activities.json",   // Default output filename
  "directory": "src/data/activities/"       // Default output directory
}
```

### `preferences`

Script behavior preferences:

```json
"preferences": {
  "create_backups": true,      // Create backups when overwriting files
  "default_replace": false,    // Replace default-activities.json by default
  "skip_financial": false,     // Skip reading Financial tab
  "skip_quotes": false         // Skip reading Quotes tab
}
```

## Managing Configuration

### Viewing Current Configuration

To see your current configuration:

```bash
npm run generate-activities -- --show-config
```

This will display all current settings, including whether they're from the config file or defaults.

### Resetting Configuration

To remove your configuration file and start fresh:

```bash
npm run generate-activities -- --reset-config
```

### Overriding Configuration

Command-line arguments always override configuration file settings:

```bash
# Use config file but with a different filename
npm run generate-activities -- --filename custom-output.json

# Use config file but skip financial tab this time
npm run generate-activities -- --skip-financial
```

## Configuration Precedence

Options are determined in this order:

1. Command-line arguments
2. Configuration file settings
3. Default values

## Common Configuration Scenarios

### Personal Google Sheet

For your personal activities:

```json
"sheet_url": "https://docs.google.com/spreadsheets/d/YOUR_PERSONAL_SHEET_ID/edit",
"preferences": {
  "default_replace": true  // Always replace default-activities.json
}
```

### Testing Setup

For testing new activities without replacing defaults:

```json
"sheet_url": "https://docs.google.com/spreadsheets/d/YOUR_TEST_SHEET_ID/edit",
"default_output": {
  "filename": "test-activities.json"
}
```

### Different Tabs Structure

If your tabs have different names or positions:

```json
"tabs": {
  "experiences": "987654321",  // Custom GID for Experiences tab
  "financial": "123456789",    // Custom GID for Financial tab
  "quotes": "0"                // Quotes on first tab
}
```

## Sharing Configuration

When sharing your application with others:

1. **Do not commit your personal configuration file** to GitHub
2. **Include the template file** to help others set up
3. **Document your Google Sheet structure** so others can create compatible sheets

## Troubleshooting

### Configuration Not Applied

- Confirm config file exists at the correct location
- Check file permissions
- Verify JSON format is valid
- Run with `--show-config` to see what's being loaded

### Cannot Save Configuration

- Check directory permissions for `src/data/config/`
- Ensure the directory exists
- Try creating the configuration file manually

### Configuration Overwrites Unexpectedly

- Remember that command-line arguments override config file
- Use `--show-config` to see which settings are active