#!/usr/bin/env python3
"""
Activities JSON Generator from Google Sheets
Converts a simple CSV/Google Sheets format to rich JSON structure
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
GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/138_Jq0OGLWXbtP3Qz8ZRrt94VO8u75tcrEzJAz-f50Q/edit?usp=sharing"  # Replace with your sheet URL

# Smart defaults
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
    "default": "⭐"
}


def generate_id(name: str) -> str:
    """Generate a valid ID from the activity name"""
    # Convert to lowercase, replace spaces with underscores, remove special chars
    id_str = name.lower().strip()
    id_str = re.sub(r'[^\w\s-]', '', id_str)
    id_str = re.sub(r'[-\s]+', '_', id_str)
    return id_str


def parse_frequency(freq_str: str) -> Dict[str, Any]:
    """
    Parse frequency string like '1/year', '52/year', '1/week', '365/year'
    Returns dict with 'times' and 'period'
    """
    freq_str = freq_str.strip().lower()
    
    # Handle special cases
    if freq_str in ['daily', 'everyday', 'every day']:
        return {"times": 365, "period": "year"}
    elif freq_str in ['weekly', 'every week']:
        return {"times": 52, "period": "year"}
    elif freq_str in ['monthly', 'every month']:
        return {"times": 12, "period": "year"}
    elif freq_str in ['yearly', 'annually', 'every year']:
        return {"times": 1, "period": "year"}
    
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
    frequency_str = str(row['frequency']).strip()
    
    # Generate ID
    activity_id = generate_id(name)
    
    # Parse frequency
    frequency = parse_frequency(frequency_str)
    
    # Get category defaults
    default_color = CATEGORY_COLORS.get(category, CATEGORY_COLORS['default'])
    default_icon = DEFAULT_ICONS.get(category, DEFAULT_ICONS['default'])
    
    # Build the activity object
    activity = {
        "id": activity_id,
        "name": name,
        "category": category,
        "frequency": frequency,
        "age_range": {
            "start": 0,
            "end": None,
            "flexible_end": True
        },
        "display": {
            "icon": default_icon,
            "color": default_color
        },
        "metadata": {
            "user_created": True,  # Will be overridden below if CSV has user_created column
            "is_active": True,    # Will be overridden below if CSV has is_active column
            "created_at": datetime.now().isoformat(),
            "source": "csv_import"
        }
    }
    
    # Optional fields from CSV
    if pd.notna(row.get('description')):
        activity["description"] = str(row['description']).strip()
    
    # Icon: use CSV value if provided, otherwise use category default
    if pd.notna(row.get('icon')):
        activity["display"]["icon"] = str(row['icon']).strip()
    
    # Age range handling
    if pd.notna(row.get('age_start')):
        try:
            age_start = int(float(row['age_start']))  # Handle float strings from CSV
            activity["age_range"]["start"] = age_start
        except (ValueError, TypeError):
            print(f"Warning: Invalid age_start '{row.get('age_start')}' for {name}, using default 0")
    
    if pd.notna(row.get('age_end')):
        try:
            age_end = int(float(row['age_end']))  # Handle float strings from CSV
            activity["age_range"]["end"] = age_end
            activity["age_range"]["flexible_end"] = False  # Set flexible_end to False when age_end is specified
            print(f"Info: Setting flexible_end=False for {name} due to age_end={age_end}")
        except (ValueError, TypeError):
            print(f"Warning: Invalid age_end '{row.get('age_end')}' for {name}, ignoring")
    
    # Color: use CSV value if provided, otherwise use category default
    if pd.notna(row.get('color')):
        color_value = str(row['color']).strip()
        if color_value:  # Only use if not empty string
            activity["display"]["color"] = color_value
    
    # is_active: read from CSV with proper boolean conversion
    if pd.notna(row.get('is_active')):
        is_active_value = str(row['is_active']).strip().lower()
        activity["metadata"]["is_active"] = is_active_value in ['true', 'yes', '1', 'active', 'on']
    
    # user_created: read from CSV with proper boolean conversion
    if pd.notna(row.get('user_created')):
        user_created_value = str(row['user_created']).strip().lower()
        activity["metadata"]["user_created"] = user_created_value in ['true', 'yes', '1', 'user', 'custom']
    
    return activity


def read_from_google_sheets(sheet_url: str) -> pd.DataFrame:
    """Read data from Google Sheets"""
    # Convert the URL to CSV export format
    if '/edit' in sheet_url:
        sheet_id = sheet_url.split('/d/')[1].split('/')[0]
    else:
        sheet_id = sheet_url
    
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    
    try:
        df = pd.read_csv(csv_url)
        return df
    except Exception as e:
        print(f"Error reading from Google Sheets: {e}")
        print("Make sure the sheet is publicly readable or use the CSV export")
        return None


def read_from_csv(file_path: str) -> pd.DataFrame:
    """Read data from local CSV file"""
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return None


def validate_data(df: pd.DataFrame) -> bool:
    """Validate that required columns exist and show column information"""
    required_columns = ['name', 'category', 'frequency']
    optional_columns = ['description', 'icon', 'age_start', 'age_end', 'color', 'is_active', 'user_created']
    
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
    for idx, row in df.iterrows():
        if pd.isna(row['name']) or str(row['name']).strip() == '':
            print(f"Error: Empty name at row {idx + 2}")  # +2 for header and 0-index
            return False
        if pd.isna(row['category']) or str(row['category']).strip() == '':
            print(f"Error: Empty category at row {idx + 2}")
            return False
        if pd.isna(row['frequency']) or str(row['frequency']).strip() == '':
            print(f"Error: Empty frequency at row {idx + 2}")
            return False
    
    return True


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
            "generated_by": "convert_activities_in_sheets_to_JSON.py"
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
        description='Convert Google Sheets CSV to activities JSON',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Safe default - outputs to src/data/activities/imported-activities.json
  uv run python scripts/convert_activities_in_sheets_to_JSON.py
  
  # Replace default file (with backup)
  uv run python scripts/convert_activities_in_sheets_to_JSON.py --replace-default
  
  # Custom filename
  uv run python scripts/convert_activities_in_sheets_to_JSON.py --filename my-activities.json
  
  # Dry run to test
  uv run python scripts/convert_activities_in_sheets_to_JSON.py --dry-run
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
    
    print("Activities JSON Generator")
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
        # Try to read from Google Sheets
        if GOOGLE_SHEETS_URL != "YOUR_GOOGLE_SHEETS_URL_HERE":
            print(f"Reading from Google Sheets...")
            df = read_from_google_sheets(GOOGLE_SHEETS_URL)
        else:
            print("Please provide a CSV file path or set GOOGLE_SHEETS_URL")
            print("Usage: python convert_activities_in_sheets_to_JSON.py [csv_file_path]")
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
            
            # Show detailed processing info
            age_info = f"ages {activity['age_range']['start']}-{activity['age_range']['end'] or 'life'}"
            flex_info = f"flexible_end={activity['age_range']['flexible_end']}"
            active_info = f"active={activity['metadata']['is_active']}"
            user_info = f"user_created={activity['metadata']['user_created']}"
            
            print(f"✓ Processed: {activity['name']} ({age_info}, {flex_info}, {active_info}, {user_info})")
        except Exception as e:
            print(f"✗ Error processing row {idx + 2}: {e}")
            print(f"   Row data: {dict(row)}")
    
    # Output results
    print("\n" + "=" * 50)
    print(f"Successfully generated {len(activities)} activities")
    
    # Show summary statistics
    active_count = sum(1 for a in activities if a['metadata']['is_active'])
    user_created_count = sum(1 for a in activities if a['metadata']['user_created'])
    with_age_end_count = sum(1 for a in activities if a['age_range']['end'] is not None)
    
    print(f"Summary:")
    print(f"  - Active activities: {active_count}/{len(activities)}")
    print(f"  - User created: {user_created_count}/{len(activities)}")
    print(f"  - With age_end (flexible_end=False): {with_age_end_count}/{len(activities)}")
    print(f"  - Output format: Full JSON structure with metadata wrapper")
    
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
    
    