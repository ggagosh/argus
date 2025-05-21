# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Argus is a MongoDB slow query analyzer web application built with Next.js. It helps developers identify and fix performance bottlenecks in MongoDB queries by analyzing slow query logs and providing actionable insights.

Key features:
- Upload and analysis of MongoDB profiler data
- Performance metrics visualization
- Query pattern identification
- Index recommendations
- AI-powered optimization suggestions

## Command Reference

### Development

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Project Structure

### Core Components

- **Frontend (Next.js App Router)**: 
  - `/app`: Pages and API routes using Next.js App Router
  - `/components`: Reusable React components
  - `/styles`: Global CSS styles

- **Data Analysis**:
  - `/components/MongoDBAnalyzer.js`: Core analysis logic for MongoDB profiler data
  - `/components/analyzer`: UI components for visualizing analysis results
  
- **AI Integration**:
  - `/app/api/analyze-operation/route.js`: API endpoint for AI-powered query analysis
  - `@ai-sdk/anthropic`: Integration with Claude AI for generating optimization suggestions

### Data Flow

1. User uploads MongoDB profiler data (JSON format)
2. Data is processed in `MongoDBAnalyzer.js`
3. Analysis results include:
   - Performance statistics
   - Collection usage
   - Index recommendations
   - Query patterns
   - Operation details
4. Selected operations can be sent to AI for deeper analysis and recommendations

## Technical Details

- **State Management**: React state with localStorage for persisting data between sessions
- **UI Framework**: shadcn/ui components based on Radix UI
- **API**: Next.js API routes
- **Libraries**:
  - Recharts for data visualization
  - @ai-sdk/anthropic for AI integration
  - Zod for schema validation

## Development Notes

- MongoDB profiler data is expected in JSON format from db.system.profile.find()
- The app can also work with demo data for testing purposes
- All data is processed client-side - no server-side database needed
- Analysis functions can handle large datasets but very large index arrays are trimmed for performance