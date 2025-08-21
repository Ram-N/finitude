# Finitude App - Quick Reference

Essential commands for developing and deploying your personalized life countdown app.

## 🚀 Development Commands

### Run Locally
```bash
npm start
```
- Starts development server at `http://localhost:3000/finitude`
- Hot-reload enabled (changes appear instantly)
- Press `Ctrl+C` to stop

### Build for Production
```bash
npm run build
```
- Creates optimized production build in `build/` folder
- Use this to test production version locally
- Required before deployment

### Run Tests
```bash
npm test
```
- Runs test suite in watch mode
- Press `q` to quit

## 📤 Git & Deployment

### Save Changes to Git
```bash
git add .
git commit -m "Your commit message here"
git push origin main
```

### Deploy to GitHub Pages
```bash
npm run deploy
```
- Automatically builds production version
- Pushes to `gh-pages` branch  
- Updates live site at `https://ram-n.github.io/finitude`

### Full Workflow (Recommended)
```bash
# 1. Save your work
git add .
git commit -m "Update activities and features"
git push origin main

# 2. Deploy to live site
npm run deploy
```

## 📁 Important Files

- **Activities**: `/src/data/activities/default-activities.json`
- **Activities Config**: `/src/data/config/activities_config.json`
- **User Profile**: `/src/data/users/default-profile.json`
- **Settings**: `/src/data/users/default-settings.json`
- **Main Component**: `/src/Finitude.js`
- **Activity Guides**: 
  - `docs/ACTIVITIES_WORKFLOW.md` - Complete workflow guide
  - `docs/CONFIGURATION_GUIDE.md` - Configuration options
  - `docs/ACTIVITIES_BACKUP_GUIDE.md` - Backup procedures

## 🛠️ Common Tasks

### Manage Activities

#### Using Google Sheets (Recommended)
```bash
# Configure Google Sheets URL once
npm run generate-activities -- --sheet-url YOUR_SHEET_URL --save-config

# Generate activities from Google Sheets
npm run generate-activities

# Replace default activities
npm run generate-activities -- --replace-default
```
See `docs/ACTIVITIES_WORKFLOW.md` for detailed instructions.

#### Manual JSON Editing
1. Edit `/src/data/activities/default-activities.json`
2. Add new activity object with proper schema
3. Run `npm start` to test locally
4. Deploy with `npm run deploy`

### Modify Settings
1. Edit `/src/data/users/default-settings.json`
2. Update tick intervals, themes, etc.
3. Test and deploy

### Backup Your Data
- All personal data stored in browser localStorage
- Export via app settings (when implemented)
- JSON files serve as defaults for new users
- Activities are automatically backed up when using `--replace-default` option
- See `docs/ACTIVITIES_BACKUP_GUIDE.md` for detailed backup procedures

## 🎯 Live URLs

- **Local Development**: `http://localhost:3000/finitude`
- **Production Site**: `https://ram-n.github.io/finitude`
- **GitHub Repository**: `https://github.com/ram-n/finitude`

## 🆘 Troubleshooting

### App Won't Start
```bash
npm install  # Reinstall dependencies
npm start    # Try again
```

### Build Errors
```bash
npm run build  # Check for errors
# Fix any linting or compilation issues
```

### Deploy Fails
```bash
npm run build  # Make sure build works first
npm run deploy # Try deployment again
```

---

**💡 Pro Tips:**
- Always test locally before deploying
- Commit frequently with descriptive messages  
- Use `npm run deploy` - it handles everything automatically
- Keep backups of your personalized activities JSON