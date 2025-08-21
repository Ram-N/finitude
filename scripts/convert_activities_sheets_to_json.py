#!/usr/bin/env python3
"""
Activities JSON Generator with Types Support
Handles experiential, financial, and quote activity types
"""

import json
import sys
import re
import os
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime

# Default configuration (overridden by command line arguments)
DEFAULT_CONFIG = {
    # For Google Sheets integration
    "sheet_url": None,  # Will prompt user or use command line argument
    
    # Tab GIDs mapping (tab name to GID)
    "tab_gids": {
        'Experiences': '0',  # Usually first tab
        'Financial': None,    # Will be detected or provided via args
        'Quotes': None        # Will be detected or provided via args
    },
    
    # Default output settings
    "default_output": {
        "filename": "imported-activities.json",
        "directory": "src/data/activities/"
    },
    
    # Default preferences
    "preferences": {
        "create_backups": True,
        "default_replace": False,
        "skip_financial": False,
        "skip_quotes": False
    }
}

# Configuration file path
CONFIG_FILE_PATH = Path("src/data/config/activities_config.json")
CONFIG_TEMPLATE_PATH = Path("src/data/config/activities_config.template.json")


# Smart defaults by category
CATEGORY_COLORS = {
    "celebration": "#FFD700",
    "nature": "#FF6347",
    "routine": "#4A90E2",
    "exercise": "#2ECC71",
    "social": "#E74C3C",
    "learning": "#9B59B6",
    "travel": "#1ABC9C",
    "food": "#F39C12",
    "work": "#34495E",
    "hobby": "#16A085",
    "subscriptions": "#7C3AED",
    "insurance": "#2563EB",
    "utilities": "#059669",
    "housing": "#DC2626",
    "transportation": "#F59E0B",
    "financial": "#10B981",
    "reflection": "#8B5CF6",
    "default": "#95A5A6"
}

DEFAULT_ICONS = {
    "celebration": "🎉",
    "nature": "🌳",
    "routine": "☕",
    "exercise": "💪",
    "social": "👥",
    "learning": "📚",
    "travel": "✈️",
    "food": "🍽️",
    "work": "💼",
    "hobby": "🎨",
    "subscriptions": "📊",
    "insurance": "🛡️",
    "utilities": "🔌",
    "housing": "🏠",
    "transportation": "🚗",
    "financial": "💰",
    "reflection": "💭",
    "default": "⭐"
}

# Type-specific defaults
TYPE_DEFAULTS = {
    "experiential": {
        "display_format": "occurrences"  # Show remaining count
    },
    "financial": {
        "display_format": "currency",    # Show total cost
        "default_currency": "USD"
    },
    "quote": {
        "display_format": "text",        # Show the quote
        "frequency": {"times": 1, "period": "year"}  # Default annual reminder
    }
}


def get_sheet_id_and_gid(url):
    """Extract sheet ID and tab GID from URL"""
    # URL format: https://docs.google.com/spreadsheets/d/{id}/edit#gid={gid}
    sheet_id = url.split('/d/')[1].split('/')[0]
    # For simplicity, you might want to hardcode GIDs initially
    return sheet_id


def generate_id(name: str) -> str:
    """Generate a valid ID from the activity name"""
    id_str = name.lower().strip()
    id_str = re.sub(r'[^\w\s-]', '', id_str)
    id_str = re.sub(r'[-\s]+', '_', id_str)
    return id_str


def parse_frequency(freq_str: str) -> Dict[str, Any]:
    """Parse frequency string like '1/year', '52/year', '1/week', '365/year'"""
    freq_str = freq_str.strip().lower()
    
    # Handle special cases
    frequency_map = {
        'daily': {"times": 365, "period": "year"},
        'everyday': {"times": 365, "period": "year"},
        'every day': {"times": 365, "period": "year"},
        'weekly': {"times": 52, "period": "year"},
        'every week': {"times": 52, "period": "year"},
        'monthly': {"times": 12, "period": "year"},
        'every month': {"times": 12, "period": "year"},
        'yearly': {"times": 1, "period": "year"},
        'annually': {"times": 1, "period": "year"},
        'every year': {"times": 1, "period": "year"}
    }
    
    if freq_str in frequency_map:
        return frequency_map[freq_str]
    
    # Parse format like "1/year" or "52/year"
    match = re.match(r'(\d+)\s*/\s*(year|month|week|day)', freq_str)
    if match:
        times = int(match.group(1))
        period = match.group(2)
        
        # Normalize to year-based for consistency
        if period == "week":
            times = times * 52
            period = "year"
        elif period == "month":
            times = times * 12
            period = "year"
        elif period == "day":
            times = times * 365
            period = "year"
            
        return {"times": times, "period": period}
    
    # Default fallback
    print(f"Warning: Could not parse frequency '{freq_str}', defaulting to 1/year")
    return {"times": 1, "period": "year"}


def create_activity(row: pd.Series) -> Dict[str, Any]:
    """Convert a CSV row to a full activity JSON object"""
    # Required fields
    name = str(row['name']).strip()
    category = str(row['category']).strip().lower()
    
    # Get type (default to experiential for backward compatibility)
    activity_type = str(row.get('type', 'experiential')).strip().lower()
    if activity_type not in TYPE_DEFAULTS:
        print(f"Warning: Unknown type '{activity_type}' for {name}, defaulting to 'experiential'")
        activity_type = 'experiential'
    
    # Generate ID
    activity_id = generate_id(name)
    
    # Parse frequency (quotes have a default)
    if activity_type == 'quote' and pd.isna(row.get('frequency')):
        frequency = TYPE_DEFAULTS['quote']['frequency']
    else:
        frequency_str = str(row.get('frequency', '1/year')).strip()
        frequency = parse_frequency(frequency_str)
    
    # Get category defaults
    color = CATEGORY_COLORS.get(category, CATEGORY_COLORS['default'])
    default_icon = DEFAULT_ICONS.get(category, DEFAULT_ICONS['default'])
    
    # Build the base activity object
    activity = {
        "id": activity_id,
        "name": name,
        "type": activity_type,
        "category": category,
        "frequency": frequency,
        "age_range": {
            "start": 0,
            "end": None,
            "flexible_end": True
        },
        "display": {
            "icon": default_icon,
            "color": color,
            "format": TYPE_DEFAULTS[activity_type]["display_format"]
        },
        "metadata": {
            "user_created": True,  # Will be overridden below if CSV has user_created column
            "is_active": True,    # Will be overridden below if CSV has is_active column
            "created_at": datetime.now().isoformat(),
            "source": "csv_import"
        }
    }
    
    # Add type-specific data
    if activity_type == "financial":
        # Financial activities need amount, unit, and currency
        if pd.notna(row.get('amount')):
            financial_data = {
                "amount": float(row['amount']),
                "unit": str(row.get('unit', 'occurrence')).strip(),
                "currency": str(row.get('currency', 'USD')).strip().upper()
            }
            activity["financial"] = financial_data
        else:
            print(f"Warning: Financial activity '{name}' missing amount data")
    
    elif activity_type == "quote":
        # Quotes might have author information in description
        if pd.notna(row.get('description')):
            desc = str(row['description']).strip()
            # Check if author is included (format: "Quote text - Author")
            if ' - ' in desc:
                quote_parts = desc.rsplit(' - ', 1)
                activity["quote"] = {
                    "text": quote_parts[0],
                    "author": quote_parts[1]
                }
                activity["description"] = desc  # Keep full description too
            else:
                activity["quote"] = {"text": desc}
                activity["description"] = desc
    
    # Common optional fields
    if pd.notna(row.get('description')) and activity_type != "quote":
        activity["description"] = str(row['description']).strip()
    
    if pd.notna(row.get('icon')):
        activity["display"]["icon"] = str(row['icon']).strip()
    
    if pd.notna(row.get('age_start')):
        try:
            activity["age_range"]["start"] = int(row['age_start'])
        except ValueError:
            print(f"Warning: Invalid age_start for {name}")
    
    if pd.notna(row.get('age_end')):
        try:
            activity["age_range"]["end"] = int(row['age_end'])
            activity["age_range"]["flexible_end"] = False
        except ValueError:
            print(f"Warning: Invalid age_end for {name}")
    
    if pd.notna(row.get('color')):
        activity["display"]["color"] = str(row['color']).strip()
    
    if pd.notna(row.get('is_active')):
        activity["metadata"]["is_active"] = str(row['is_active']).lower() in ['true', 'yes', '1']
    
    if pd.notna(row.get('user_created')):
        activity["metadata"]["user_created"] = str(row['user_created']).lower() in ['true', 'yes', '1']
    
    return activity


def validate_data(df: pd.DataFrame) -> bool:
    """Validate that required columns exist and have valid data"""
    required_columns = ['name', 'category']  # type is optional for backward compatibility
    optional_columns = ['description', 'icon', 'age_start', 'age_end', 'color', 'is_active', 'user_created', 'type', 'frequency', 'amount', 'unit', 'currency']
    
    # Show all available columns
    print(f"Available columns: {list(df.columns)}")
    
    # Check required columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"Error: Missing required columns: {missing_columns}")
        return False
    
    # Show which optional columns are available
    available_optional = [col for col in optional_columns if col in df.columns]
    missing_optional = [col for col in optional_columns if col not in df.columns]
    
    if available_optional:
        print(f"Available optional columns: {available_optional}")
    if missing_optional:
        print(f"Missing optional columns (will use defaults): {missing_optional}")
    
    # Check for empty required fields
    errors = 0
    for idx, row in df.iterrows():
        if pd.isna(row['name']) or str(row['name']).strip() == '':
            print(f"Error: Empty name at row {idx + 2}")  # +2 for header and 0-index
            errors += 1
            continue
            
        if pd.isna(row['category']) or str(row['category']).strip() == '':
            print(f"Error: Empty category at row {idx + 2}")
            errors += 1
            continue
        
        # Type-specific validation
        if pd.notna(row.get('type')):
            activity_type = str(row['type']).strip().lower()
            
            if activity_type == 'financial':
                if pd.isna(row.get('amount')):
                    print(f"Warning: Financial activity '{row['name']}' at row {idx + 2} missing amount")
                else:
                    try:
                        float(row['amount'])
                    except ValueError:
                        print(f"Error: Invalid amount '{row.get('amount')}' for '{row['name']}' at row {idx + 2}")
                        errors += 1
                        continue
                        
                # Validate currency format
                if pd.notna(row.get('currency')):
                    currency = str(row['currency']).strip().upper()
                    if len(currency) != 3:
                        print(f"Warning: Currency '{currency}' for '{row['name']}' should be 3-letter code (e.g., USD, EUR)")
    
    if errors > 0:
        print(f"\\nValidation failed with {errors} errors. Please fix the issues above.")
        return False
    
    print(f"\\n✓ Validation passed for {len(df)} activities")
    return True


def read_from_google_sheets_tab(sheet_url: str, tab_name: str = None, gid: str = None) -> pd.DataFrame:
    """Read data from a specific Google Sheets tab"""
    if '/edit' in sheet_url:
        sheet_id = sheet_url.split('/d/')[1].split('/')[0]
    else:
        sheet_id = sheet_url
    
    # Use provided GID or look up from tab name
    if gid:
        tab_gid = gid
    elif tab_name == "Experiences":
        tab_gid = '0'  # Default GID for Experiences tab
    else:
        # Try to extract GID from URL if present
        if '#gid=' in sheet_url:
            try:
                tab_gid = sheet_url.split('#gid=')[1].split('&')[0]
                print(f"Detected GID from URL: {tab_gid}")
            except Exception:
                tab_gid = '0'  # Default to first tab
        else:
            tab_gid = '0'  # Default to first tab
    
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={tab_gid}"
    
    try:
        df = pd.read_csv(csv_url)
        tab_info = f"tab '{tab_name}'" if tab_name else f"GID {tab_gid}"
        print(f"✓ Successfully read {len(df)} rows from {tab_info}")
        return df
    except Exception as e:
        tab_info = f"tab '{tab_name}'" if tab_name else f"GID {tab_gid}"
        print(f"✗ Error reading from Google Sheets {tab_info}: {e}")
        print("Make sure the sheet is publicly readable and the tab exists")
        return None


def read_from_google_sheets(sheet_url: str) -> pd.DataFrame:
    """Read data from Google Sheets - backward compatibility function"""
    return read_from_google_sheets_tab(sheet_url, tab_name='Experiences')


def read_from_google_sheets_multi_tab(sheet_url: str, tabs_to_read: List[str] = None, tab_gids: Dict[str, str] = None) -> pd.DataFrame:
    """Read data from multiple Google Sheets tabs and combine them"""
    print("Reading from multiple Google Sheets tabs...")
    
    if tabs_to_read is None:
        tabs_to_read = ["Experiences", "Financial"]  # Default tabs to read
    
    if tab_gids is None:
        tab_gids = {}  # Use default GIDs in read_from_google_sheets_tab
    
    # Dictionary to hold dataframes from each tab
    tab_dfs = {}
    
    # Read data from each tab
    for tab_name in tabs_to_read:
        tab_gid = tab_gids.get(tab_name)
        df = read_from_google_sheets_tab(sheet_url, tab_name=tab_name, gid=tab_gid)
        
        if df is not None:
            print(f"✓ {tab_name} tab: {len(df)} activities")
            
            # Set activity type based on tab
            if tab_name == "Financial":
                df = df.copy()
                df['type'] = 'financial'
                print(f"  ↳ Auto-set type='financial' for all activities in this tab")
            elif tab_name == "Quotes":
                df = df.copy()
                df['type'] = 'quote'
                print(f"  ↳ Auto-set type='quote' for all activities in this tab")
            
            tab_dfs[tab_name] = df
        else:
            print(f"✗ Could not read {tab_name} tab")
    
    # If no tabs were read successfully, return None
    if not tab_dfs:
        print("✗ No tabs could be read successfully")
        return None
    
    # Combine all dataframes
    combined_dfs = list(tab_dfs.values())
    combined_df = pd.concat(combined_dfs, ignore_index=True)
    print(f"✓ Combined total: {len(combined_df)} activities from {len(combined_dfs)} tabs")
    
    return combined_df


def read_from_csv(file_path: str) -> pd.DataFrame:
    """Read data from local CSV file"""
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return None


def generate_summary(activities: List[Dict[str, Any]]) -> None:
    """Print a comprehensive summary of generated activities by type and source"""
    # Count by type
    type_counts = {}
    category_counts = {}
    
    for activity in activities:
        activity_type = activity.get('type', 'experiential')
        type_counts[activity_type] = type_counts.get(activity_type, 0) + 1
        
        category = activity.get('category', 'unknown')
        category_counts[category] = category_counts.get(category, 0) + 1
    
    print("\n" + "=" * 60)
    print("ACTIVITY SUMMARY")
    print("=" * 60)
    
    # Summary by Type
    print("\nBy Activity Type:")
    print("-" * 30)
    for activity_type, count in sorted(type_counts.items()):
        percentage = (count / len(activities)) * 100
        print(f"{activity_type.capitalize()}: {count} activities ({percentage:.1f}%)")
    
    # Summary by Category (top 10)
    print("\nBy Category (Top 10):")
    print("-" * 30)
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    for category, count in sorted_categories[:10]:
        percentage = (count / len(activities)) * 100
        print(f"{category.capitalize()}: {count} activities ({percentage:.1f}%)")
    
    # Financial Activities Detail
    financial_activities = [a for a in activities if a.get('type') == 'financial']
    if financial_activities:
        print("\nFinancial Activities Detail:")
        print("-" * 30)
        
        # Calculate total financial impact
        total_amounts = {}
        for activity in financial_activities:
            if 'financial' in activity:
                currency = activity['financial']['currency']
                amount = activity['financial']['amount']
                if currency not in total_amounts:
                    total_amounts[currency] = 0
                total_amounts[currency] += amount
        
        print(f"Total financial activities: {len(financial_activities)}")
        for currency, total in sorted(total_amounts.items()):
            print(f"Total {currency}: {total:,.2f}")
        
        print("\nSample Financial Activities:")
        for activity in financial_activities[:5]:  # Show first 5
            if 'financial' in activity:
                amount = activity['financial']['amount']
                unit = activity['financial']['unit']
                currency = activity['financial']['currency']
                print(f"- {activity['name']}: {currency} {amount} per {unit}")
        if len(financial_activities) > 5:
            print(f"  ... and {len(financial_activities) - 5} more")
    
    # Quote Activities
    quote_activities = [a for a in activities if a.get('type') == 'quote']
    if quote_activities:
        print(f"\nQuote Activities: {len(quote_activities)} found")
        print("-" * 30)
        for activity in quote_activities[:3]:  # Show first 3
            if 'quote' in activity:
                text = activity['quote']['text'][:50] + "..." if len(activity['quote']['text']) > 50 else activity['quote']['text']
                author = activity['quote'].get('author', 'Unknown')
                print(f"- \"{text}\" - {author}")
        if len(quote_activities) > 3:
            print(f"  ... and {len(quote_activities) - 3} more")
    
    # Overall Statistics
    active_count = sum(1 for a in activities if a['metadata']['is_active'])
    user_created_count = sum(1 for a in activities if a['metadata']['user_created'])
    with_age_end_count = sum(1 for a in activities if a['age_range']['end'] is not None)
    
    print(f"\nOverall Statistics:")
    print("-" * 30)
    print(f"  • Total activities: {len(activities)}")
    print(f"  • Active activities: {active_count}/{len(activities)} ({(active_count/len(activities)*100):.1f}%)")
    print(f"  • User created: {user_created_count}/{len(activities)} ({(user_created_count/len(activities)*100):.1f}%)")
    print(f"  • With age_end (flexible_end=False): {with_age_end_count}/{len(activities)} ({(with_age_end_count/len(activities)*100):.1f}%)")
    print(f"  • Output format: Full JSON structure with metadata wrapper")
    
    # Data Quality Summary
    print(f"\nData Quality:")
    print("-" * 30)
    activities_with_description = sum(1 for a in activities if a.get('description'))
    activities_with_custom_icon = sum(1 for a in activities if a.get('display', {}).get('icon') != DEFAULT_ICONS.get(a.get('category', 'default'), DEFAULT_ICONS['default']))
    
    print(f"  • Activities with descriptions: {activities_with_description}/{len(activities)} ({(activities_with_description/len(activities)*100):.1f}%)")
    print(f"  • Activities with custom icons: {activities_with_custom_icon}/{len(activities)} ({(activities_with_custom_icon/len(activities)*100):.1f}%)")
    print(f"  • Categories represented: {len(category_counts)}")
    print(f"  • Activity types: {len(type_counts)}")


def get_project_root() -> Path:
    """Find the project root directory"""
    current = Path.cwd()
    # Look for package.json or src directory as indicators
    while current.parent != current:
        if (current / "package.json").exists() or (current / "src").exists():
            return current
        current = current.parent
    return Path.cwd()  # fallback to current directory


def create_output_structure(activities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Wrap activities in the proper JSON structure with metadata"""
    return {
        "activities": activities,
        "metadata": {
            "version": "2.0",
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "total_activities": len(activities),
            "source": "csv_import",
            "generated_by": "convert_activities_sheets_to_json.py"
        }
    }


def backup_file(filepath: Path) -> Optional[Path]:
    """Create a backup of an existing file"""
    if not filepath.exists():
        return None
    
    backup_path = filepath.with_suffix(f".backup.{int(datetime.now().timestamp())}.json")
    shutil.copy2(filepath, backup_path)
    print(f"Backed up existing file to: {backup_path}")
    return backup_path


def load_config() -> Dict[str, Any]:
    """Load configuration from file if it exists"""
    config = DEFAULT_CONFIG.copy()
    
    if CONFIG_FILE_PATH.exists():
        try:
            with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
                
            # Extract relevant parts of the configuration
            if 'activities' in file_config:
                activities_config = file_config['activities']
                
                # Update sheet URL
                if 'sheet_url' in activities_config and activities_config['sheet_url']:
                    config['sheet_url'] = activities_config['sheet_url']
                
                # Update tab GIDs
                if 'tabs' in activities_config:
                    tabs = activities_config['tabs']
                    if 'experiences' in tabs and tabs['experiences']:
                        config['tab_gids']['Experiences'] = tabs['experiences']
                    if 'financial' in tabs and tabs['financial']:
                        config['tab_gids']['Financial'] = tabs['financial']
                    if 'quotes' in tabs and tabs['quotes']:
                        config['tab_gids']['Quotes'] = tabs['quotes']
                
                # Update output settings
                if 'default_output' in activities_config:
                    output = activities_config['default_output']
                    if 'filename' in output:
                        config['default_output']['filename'] = output['filename']
                    if 'directory' in output:
                        config['default_output']['directory'] = output['directory']
                
                # Update preferences
                if 'preferences' in activities_config:
                    prefs = activities_config['preferences']
                    if 'create_backups' in prefs:
                        config['preferences']['create_backups'] = prefs['create_backups']
                    if 'default_replace' in prefs:
                        config['preferences']['default_replace'] = prefs['default_replace']
                    if 'skip_financial' in prefs:
                        config['preferences']['skip_financial'] = prefs['skip_financial']
                    if 'skip_quotes' in prefs:
                        config['preferences']['skip_quotes'] = prefs['skip_quotes']
            
            print(f"✓ Loaded configuration from {CONFIG_FILE_PATH}")
        except Exception as e:
            print(f"✗ Error loading configuration: {e}")
            print(f"  Using default configuration instead")
    else:
        print(f"ℹ No configuration file found at {CONFIG_FILE_PATH}")
        print(f"  Using default configuration")
    
    return config


def save_config(config: Dict[str, Any], sheet_url: str = None, tab_gids: Dict[str, str] = None) -> None:
    """Save configuration to file"""
    # Create parent directories if they don't exist
    CONFIG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Prepare configuration data
    now = datetime.now().isoformat()
    
    # Start with an empty configuration
    file_config = {
        "activities": {
            "sheet_url": sheet_url or config.get('sheet_url', ""),
            "tabs": {
                "experiences": tab_gids.get('Experiences', "") if tab_gids else config.get('tab_gids', {}).get('Experiences', ""),
                "financial": tab_gids.get('Financial', "") if tab_gids else config.get('tab_gids', {}).get('Financial', ""),
                "quotes": tab_gids.get('Quotes', "") if tab_gids else config.get('tab_gids', {}).get('Quotes', "")
            },
            "default_output": config.get('default_output', {
                "filename": "imported-activities.json",
                "directory": "src/data/activities/"
            }),
            "preferences": config.get('preferences', {
                "create_backups": True,
                "default_replace": False,
                "skip_financial": False,
                "skip_quotes": False
            })
        },
        "metadata": {
            "version": "1.0",
            "last_updated": now
        }
    }
    
    # Add created_at timestamp if file doesn't exist
    if not CONFIG_FILE_PATH.exists():
        file_config["metadata"]["created_at"] = now
    else:
        # Read existing file to preserve created_at
        try:
            with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
                existing_config = json.load(f)
                if "metadata" in existing_config and "created_at" in existing_config["metadata"]:
                    file_config["metadata"]["created_at"] = existing_config["metadata"]["created_at"]
                else:
                    file_config["metadata"]["created_at"] = now
        except:
            file_config["metadata"]["created_at"] = now
    
    # Write configuration to file
    try:
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(file_config, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved configuration to {CONFIG_FILE_PATH}")
    except Exception as e:
        print(f"✗ Error saving configuration: {e}")


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Convert Google Sheets CSV to activities JSON with multi-tab support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Using a specific Google Sheet URL
  python scripts/convert_to_json2.py --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
  
  # Using a local CSV file
  python scripts/convert_to_json2.py path/to/activities.csv
  
  # Replace default file (with backup)
  python scripts/convert_to_json2.py --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --replace-default
  
  # Custom filename
  python scripts/convert_to_json2.py --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --filename my-activities.json
  
  # Dry run to test
  python scripts/convert_to_json2.py --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --dry-run
  
  # Specify tab GIDs manually
  python scripts/convert_to_json2.py --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit --experiences-tab 0 --financial-tab 123456789
  
  # Configuration management
  python scripts/convert_to_json2.py --save-config --sheet-url https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
  python scripts/convert_to_json2.py --show-config
  python scripts/convert_to_json2.py --reset-config
'''
    )
    
    # Input source arguments
    parser.add_argument('csv_file', nargs='?', help='CSV file path (optional if using Google Sheets)')
    parser.add_argument('--sheet-url', help='Google Sheets URL to read from')
    
    # Tab GID arguments
    parser.add_argument('--experiences-tab', help='GID for Experiences tab')
    parser.add_argument('--financial-tab', help='GID for Financial tab')
    parser.add_argument('--quotes-tab', help='GID for Quotes tab')
    parser.add_argument('--detect-tabs', action='store_true', help='Automatically detect tab GIDs (experimental)')
    
    # Output arguments
    parser.add_argument('--replace-default', action='store_true', help='Replace default-activities.json (creates backup)')
    parser.add_argument('--filename', help='Output filename (default from config or imported-activities.json)')
    parser.add_argument('--output-dir', help='Output directory (default from config or src/data/activities/)')
    
    # Behavior arguments
    parser.add_argument('--dry-run', action='store_true', help='Print output instead of writing file')
    parser.add_argument('--no-backup', action='store_true', help='Skip backup when overwriting files')
    parser.add_argument('--skip-financial', action='store_true', help='Skip reading Financial tab')
    parser.add_argument('--skip-quotes', action='store_true', help='Skip reading Quotes tab')
    
    # Configuration management
    parser.add_argument('--save-config', action='store_true', help='Save current settings to configuration file')
    parser.add_argument('--show-config', action='store_true', help='Display current configuration')
    parser.add_argument('--reset-config', action='store_true', help='Reset configuration to defaults')
    
    return parser.parse_args()


def show_config(config: Dict[str, Any]) -> None:
    """Display current configuration"""
    print("\nCurrent Configuration:")
    print("-" * 50)
    
    # Sheet URL
    sheet_url = config.get('sheet_url', "Not set")
    print(f"Google Sheet URL: {sheet_url}")
    
    # Tab GIDs
    tab_gids = config.get('tab_gids', {})
    print("\nTab GIDs:")
    print(f"  Experiences: {tab_gids.get('Experiences', 'Not set')}")
    print(f"  Financial: {tab_gids.get('Financial', 'Not set')}")
    print(f"  Quotes: {tab_gids.get('Quotes', 'Not set')}")
    
    # Output settings
    output = config.get('default_output', {})
    print("\nDefault Output:")
    print(f"  Filename: {output.get('filename', 'imported-activities.json')}")
    print(f"  Directory: {output.get('directory', 'src/data/activities/')}")
    
    # Preferences
    prefs = config.get('preferences', {})
    print("\nPreferences:")
    print(f"  Create backups: {prefs.get('create_backups', True)}")
    print(f"  Default replace: {prefs.get('default_replace', False)}")
    print(f"  Skip financial tab: {prefs.get('skip_financial', False)}")
    print(f"  Skip quotes tab: {prefs.get('skip_quotes', False)}")
    
    # Config file status
    if CONFIG_FILE_PATH.exists():
        print(f"\nConfiguration file: {CONFIG_FILE_PATH} (exists)")
    else:
        print(f"\nConfiguration file: {CONFIG_FILE_PATH} (not found)")


def main():
    """Main function to run the converter"""
    args = parse_args()
    
    print("Activities JSON Generator with Types Support")
    print("=" * 50)
    
    # Handle configuration management commands
    if args.show_config:
        config = load_config()
        show_config(config)
        return
    
    if args.reset_config:
        if CONFIG_FILE_PATH.exists():
            try:
                CONFIG_FILE_PATH.unlink()
                print(f"✓ Removed configuration file: {CONFIG_FILE_PATH}")
            except Exception as e:
                print(f"✗ Error removing configuration file: {e}")
        else:
            print(f"ℹ No configuration file to reset at: {CONFIG_FILE_PATH}")
        return
    
    # Load configuration (will use defaults if no file exists)
    config = load_config()
    
    # Determine project root and output directory
    project_root = get_project_root()
    print(f"Project root: {project_root}")
    
    # Use command line args, then config, then defaults for output settings
    if args.output_dir:
        output_dir = Path(args.output_dir)
    elif 'default_output' in config and 'directory' in config['default_output']:
        output_dir = Path(config['default_output']['directory'])
    else:
        output_dir = project_root / "src" / "data" / "activities"
    
    print(f"Output directory: {output_dir}")
    
    # Update configuration from command line arguments
    if args.sheet_url:
        config["sheet_url"] = args.sheet_url
    
    # Update tab GIDs if provided
    tab_gids = config.get('tab_gids', {})
    if args.experiences_tab:
        tab_gids["Experiences"] = args.experiences_tab
    if args.financial_tab:
        tab_gids["Financial"] = args.financial_tab
    if args.quotes_tab:
        tab_gids["Quotes"] = args.quotes_tab
    
    # Save configuration if requested
    if args.save_config:
        save_config(config, config["sheet_url"], tab_gids)
        print("\nConfiguration saved. You can now run the script without specifying these options again.")
        if not args.csv_file:  # If only saving config, exit
            return
    
    # Choose input source
    if args.csv_file:
        # Use command line argument as CSV file path
        print(f"Reading from CSV file: {args.csv_file}")
        df = read_from_csv(args.csv_file)
    else:
        # Try to read from Google Sheets
        if not config["sheet_url"]:
            # Prompt user for Google Sheets URL if not provided
            print("Please enter the Google Sheets URL:")
            config["sheet_url"] = input("URL: ").strip()
            
            # Ask if user wants to save this URL for future use
            save_url = input("Save this URL for future use? (y/n): ").strip().lower()
            if save_url == 'y' or save_url == 'yes':
                save_config(config, config["sheet_url"], tab_gids)
        
        print(f"Reading from Google Sheets: {config['sheet_url']}")
        
        # Determine which tabs to read
        tabs_to_read = ["Experiences"]  # Always read Experiences tab
        
        # Use command-line args first, then config preferences
        skip_financial = args.skip_financial if args.skip_financial else config.get('preferences', {}).get('skip_financial', False)
        skip_quotes = args.skip_quotes if args.skip_quotes else config.get('preferences', {}).get('skip_quotes', False)
        
        if not skip_financial:
            tabs_to_read.append("Financial")
        if not skip_quotes:
            tabs_to_read.append("Quotes")
            
        df = read_from_google_sheets_multi_tab(config["sheet_url"], tabs_to_read, tab_gids)
    
    if df is None:
        return
    
    print(f"Loaded {len(df)} rows")
    
    # Validate data
    if not validate_data(df):
        return
    
    # Convert each row to an activity
    activities = []
    for idx, row in df.iterrows():
        try:
            activity = create_activity(row)
            activities.append(activity)
            type_indicator = f"[{activity['type'][0].upper()}]"
            print(f"✓ Processed {type_indicator}: {activity['name']}")
        except Exception as e:
            print(f"✗ Error processing row {idx + 2}: {e}")
            print(f"   Row data: {dict(row)}")
    
    # Generate summary
    generate_summary(activities)
    
    # Output results
    print("\n" + "=" * 50)
    print(f"Successfully generated {len(activities)} activities")
    
    # Create proper JSON structure
    output_data = create_output_structure(activities)
    
    # Determine output file
    default_replace = args.replace_default if args.replace_default else config.get('preferences', {}).get('default_replace', False)
    
    if default_replace:
        output_file = output_dir / "default-activities.json"
    else:
        # Use filename from command line, then config, then default
        if args.filename:
            filename = args.filename
        elif 'default_output' in config and 'filename' in config['default_output']:
            filename = config['default_output']['filename']
        else:
            filename = "imported-activities.json"
        
        output_file = output_dir / filename
    
    print(f"Output file: {output_file}")
    
    # Handle dry run
    if args.dry_run:
        print("\n" + "=" * 50)
        print("DRY RUN - JSON Output:")
        print("-" * 50)
        print(json.dumps(output_data, indent=2, ensure_ascii=False))
        return
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Backup existing file if requested
    create_backups = not args.no_backup
    if create_backups is None:  # Not specified in command line
        create_backups = config.get('preferences', {}).get('create_backups', True)
    
    if create_backups and output_file.exists():
        backup_file(output_file)
    
    # Write the file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ JSON saved to: {output_file}")
        
        # Show file size
        file_size = output_file.stat().st_size
        print(f"📊 File size: {file_size:,} bytes")
        
    except Exception as e:
        print(f"❌ Error writing file: {e}")
        return
    
    # Show usage examples
    print("\n" + "=" * 50)
    print("Usage in your app:")
    print(f"  - File location: {output_file.relative_to(project_root)}")
    print(f"  - Import: import activities from './{output_file.relative_to(project_root)}'")


if __name__ == "__main__":
    main()