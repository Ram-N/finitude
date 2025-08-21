# Getting Started with Finitude

This guide will walk you through the process of setting up your own personalized version of Finitude, from forking the repository to deploying your customized app.

## Overview

Finitude is a life countdown app that helps you visualize your remaining time. Setting up your own version involves these main steps:

1. Fork the GitHub repository
2. Set up your activities in Google Sheets
3. Install prerequisites (Node.js, Python, uv)
4. Import your activities
5. Customize your settings
6. Deploy to GitHub Pages

## Step 1: Fork the Repository

1. Go to the [Finitude GitHub repository](https://github.com/ram-n/finitude)
2. Click the "Fork" button in the top-right corner
3. Wait for GitHub to create your copy of the repository
4. Once complete, clone your fork to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/finitude.git
cd finitude
```

## Step 2: Set Up Your Activities in Google Sheets

### Create Your Google Sheet

1. Create a new Google Sheets document
2. Set up the following tabs:
   - **Experiences** (first tab): For regular experiential activities
   - **Financial** (second tab): For financial activities (optional)

### Configure Column Headers

For the **Experiences** tab, add these column headers:
```
name | category | frequency | description | icon | age_start | age_end | color | is_active | user_created
```

For the **Financial** tab, add these column headers:
```
name | category | frequency | description | icon | amount | unit | currency | age_start | age_end | color | is_active
```

### Add Your Activities

Add rows for each activity you want to track. Example:

**Experiences tab:**
```
Morning Coffee | routine | daily | Daily caffeine ritual | ☕ | 18 |  | #4A90E2 | true | true
Family Dinners | social | 2/week | Family gathering time | 🍽️ | 5 |  | #E74C3C | true | true
```

**Financial tab:**
```
Netflix | subscriptions | monthly | Streaming service | 📺 | 15.99 | month | USD | 18 |  | #E50914 | true
Rent | housing | monthly | Housing costs | 🏠 | 1500 | month | USD | 25 | 65 | #DC2626 | true
```

### Set Sharing Permissions

1. Click "Share" in the top-right corner
2. Set access to "Anyone with the link can view"
3. Copy the URL - you'll need it for importing activities

## Step 3: Install Prerequisites

### Node.js and npm

1. Install Node.js (which includes npm) from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Python and uv

1. Install Python 3.8+ from [python.org](https://python.org/)
2. Install uv (Python package manager):
   ```bash
   pip install uv
   ```
3. Verify installation:
   ```bash
   python --version
   uv --version
   ```

## Step 4: Set Up the Project

### Install Dependencies

In your cloned repository:

```bash
# Install JavaScript dependencies
npm install

# Install Python dependencies
cd scripts
uv pip install -r requirements.txt
cd ..
```

### Configure Your Profile

Edit the default profile in `src/data/users/default-profile.json`:

1. Update `name` with your name
2. Set `birth_year` to your birth year
3. Adjust `life_expectancy` if desired
4. Save the file

## Step 5: Import Your Activities

### Configure Activities Import

Run the import script with your Google Sheet URL:

```bash
# First time setup - save your Google Sheet URL
npm run generate-activities -- --sheet-url YOUR_GOOGLE_SHEET_URL --save-config

# Import activities and replace defaults
npm run generate-activities -- --replace-default
```

The script will:
1. Connect to your Google Sheet
2. Convert your activities to the proper JSON format
3. Save them to `src/data/activities/default-activities.json`
4. Create a backup of any previous activities

## Step 6: Test Locally

Start the development server:

```bash
npm start
```

Your Finitude app should now be running at [http://localhost:3000/finitude](http://localhost:3000/finitude)

Verify that:
- Your profile information is correct
- Your activities appear as expected
- The countdown calculations work properly

## Step 7: Customize Settings (Optional)

Edit `src/data/users/default-settings.json` to customize:
- Display settings (animations, theme)
- Audio settings
- Card transition effects
- Show/hide financial activities

## Step 8: Deploy to GitHub Pages

### Update Repository Settings

1. In your forked GitHub repository, go to Settings > Pages
2. Under "Source", select "GitHub Actions"

### Deploy

Run the deployment command:

```bash
npm run deploy
```

This will:
1. Build an optimized production version
2. Push it to the `gh-pages` branch of your repository
3. Make it available at `https://YOUR_USERNAME.github.io/finitude`

Wait a few minutes for GitHub to complete the deployment, then visit your site at the URL above.

## Updating Your Activities

Whenever you update your Google Sheet, simply run:

```bash
npm run generate-activities
npm run deploy
```

This will import your latest activities and redeploy your site.

## Troubleshooting

### Import Issues
- Ensure your Google Sheet is shared with "Anyone with the link can view"
- Check column headers match exactly (case sensitive)
- Use supported frequency formats: "daily", "weekly", "monthly", "1/week", etc.

### Deployment Issues
- Make sure GitHub Pages is enabled for your repository
- Check that you've run `npm run deploy` successfully
- Allow a few minutes for GitHub to complete the deployment

### Local Development Issues
- Ensure all dependencies are installed (`npm install`)
- Clear browser cache if changes don't appear
- Check console for any error messages

## Next Steps

- Customize app appearance by editing CSS
- Add more activity types
- Contribute improvements back to the main repository via pull requests

Enjoy your personalized Finitude app!