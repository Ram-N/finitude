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

# For Google Sheets integration
GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/138_Jq0OGLWXbtP3Qz8ZRrt94VO8u75tcrEzJAz-f50Q/edit?usp=sharing"

# Hardcode tab GIDs (you can find these in the URL when you click each tab)
TAB_GIDS = {
    'Experiences': '0',  # Usually first tab
    'Financial': '2109664992',  # Example GID for financial tab
    'Quotes': '1377645241' 
}


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
    elif tab_name and tab_name in TAB_GIDS:
        tab_gid = TAB_GIDS[tab_name]
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


def read_from_google_sheets_multi_tab(sheet_url: str) -> pd.DataFrame:
    """Read data from both Experiences and Financial tabs and combine them"""
    print("Reading from multiple Google Sheets tabs...")
    
    # Read from Experiences tab
    experiences_df = read_from_google_sheets_tab(sheet_url, tab_name='Experiences')
    
    # Read from Financial tab
    financial_df = read_from_google_sheets_tab(sheet_url, tab_name='Financial')
    
    # Combine the dataframes
    combined_dfs = []
    
    if experiences_df is not None:
        print(f"✓ Experiences tab: {len(experiences_df)} activities")
        combined_dfs.append(experiences_df)
    else:
        print("✗ Could not read Experiences tab")
    
    if financial_df is not None:
        # Ensure all activities from Financial tab have type='financial'
        financial_df = financial_df.copy()
        financial_df['type'] = 'financial'
        print(f"✓ Financial tab: {len(financial_df)} activities (auto-set type='financial')")
        combined_dfs.append(financial_df)
    else:
        print("✗ Could not read Financial tab")
    
    # If no tabs were read successfully, return None
    if not combined_dfs:
        print("✗ No tabs could be read successfully")
        return None
    
    # Combine all dataframes
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
            "generated_by": "convert_to_json2.py"
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


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Convert Google Sheets CSV to activities JSON with multi-tab support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Safe default - outputs to src/data/activities/imported-activities.json
  python scripts/convert_to_json2.py
  
  # Replace default file (with backup)
  python scripts/convert_to_json2.py --replace-default
  
  # Custom filename
  python scripts/convert_to_json2.py --filename my-activities.json
  
  # Dry run to test
  python scripts/convert_to_json2.py --dry-run
'''
    )
    
    parser.add_argument('csv_file', nargs='?', help='CSV file path (optional if using Google Sheets)')
    parser.add_argument('--replace-default', action='store_true', help='Replace default-activities.json (creates backup)')
    parser.add_argument('--filename', default='imported-activities.json', help='Output filename (default: imported-activities.json)')
    parser.add_argument('--output-dir', help='Output directory (default: src/data/activities/)')
    parser.add_argument('--dry-run', action='store_true', help='Print output instead of writing file')
    parser.add_argument('--no-backup', action='store_true', help='Skip backup when overwriting files')
    
    return parser.parse_args()


def main():
    """Main function to run the converter"""
    args = parse_args()
    
    print("Activities JSON Generator with Types Support")
    print("=" * 50)
    
    # Determine project root and output directory
    project_root = get_project_root()
    print(f"Project root: {project_root}")
    
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = project_root / "src" / "data" / "activities"
    
    print(f"Output directory: {output_dir}")
    
    # Choose input source
    if args.csv_file:
        # Use command line argument as CSV file path
        df = read_from_csv(args.csv_file)
    else:
        # Try to read from Google Sheets (both Experiences and Financial tabs)
        if GOOGLE_SHEETS_URL != "YOUR_GOOGLE_SHEETS_URL_HERE":
            print(f"Reading from Google Sheets...")
            df = read_from_google_sheets_multi_tab(GOOGLE_SHEETS_URL)
        else:
            print("Please provide a CSV file path or set GOOGLE_SHEETS_URL")
            print("Usage: python convert_to_json2.py [csv_file_path]")
            return
    
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
    if args.replace_default:
        output_file = output_dir / "default-activities.json"
    else:
        output_file = output_dir / args.filename
    
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
    if not args.no_backup and output_file.exists():
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