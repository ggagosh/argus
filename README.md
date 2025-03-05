# Argus - MongoDB Slow Query Analyzer

Argus is an AI-powered MongoDB slow query analyzer that helps developers and DevOps teams identify, analyze, and optimize slow queries. The application provides comprehensive insights into MongoDB query performance through an intuitive user interface.

## Features

### Upload & Import
- File upload interface for MongoDB slow query logs (JSON format)
- Drag-and-drop functionality with support for large files
- Validation and parsing of MongoDB profiler entries
- Sample data option for demonstration purposes

### Dashboard (Slow Query Overview)
- Summary metrics showing total slow queries, time range, and average query duration
- Filter controls for database/collection and time range
- Sorting options by duration, frequency, or collection name
- Comprehensive table view of slow queries with essential metrics
- Visual highlighting of problematic queries

### Query Details & Analysis
- Detailed view of individual slow query performance
- Execution stats list for each occurrence of the query
- Performance charts showing query duration over time
- Index usage information and query plan visualization
- AI-powered suggestions for query optimization

### Collections Analysis
- Collection-level metrics and statistics
- Distribution of slow queries across collections
- Identification of collections with performance issues

### Query Pattern Analysis
- Identification of common query patterns
- Aggregation of similar queries for analysis
- Performance metrics by query pattern

### Index Suggestions
- AI-powered index recommendations
- Impact assessment for suggested indexes
- Explanation of why indexes would improve performance

## Technology Stack

- Next.js framework with React 19
- ShadCN UI components for consistent design
- Tailwind CSS for styling
- Recharts for data visualization
- AI integration for query analysis and suggestions

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload your MongoDB slow query log (JSON array of profiler entries)
2. Explore the dashboard to identify problematic queries
3. Drill down into specific queries for detailed analysis
4. Review AI-powered suggestions for optimization
5. Apply recommendations to improve your MongoDB performance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.