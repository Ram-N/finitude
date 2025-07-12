# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React application created with Create React App. It uses React 19 with modern tooling and includes TailwindCSS for styling.

## Key Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Run tests in watch mode
npm test

# Build for production
npm run build

# Run single test file
npm test -- --testNamePattern="ComponentName"

# Build and verify no errors
npm run build
```

## Architecture

**Tech Stack**: React 19, Create React App, TailwindCSS, Jest/React Testing Library

### Project Structure
- Standard Create React App structure
- TailwindCSS configured as dev dependency for utility-first styling
- Jest and React Testing Library for testing
- Modern React with functional components and hooks

### Key Files
- `src/App.js` - Main application component
- `src/index.js` - Application entry point
- `package.json` - Dependencies and scripts
- `public/index.html` - HTML template

### Styling
- TailwindCSS available for utility classes
- Standard CSS files in `src/` for custom styles
- Default Create React App CSS structure maintained

### Testing
- Jest test runner with React Testing Library
- Tests can be run with `npm test`
- Test files should follow `*.test.js` or `*.spec.js` naming convention