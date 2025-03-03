import React, { useState, useEffect } from 'react';
import { Clock, Upload, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import _ from 'lodash';
import { Button } from './ui/button';

// Import analyzer components
import Uploader from './analyzer/Uploader';
import Overview from './analyzer/Overview';
import Collections from './analyzer/Collections';
import IndexSuggestions from './analyzer/IndexSuggestions';
import QueryPatterns from './analyzer/QueryPatterns';
import OperationDetails from './analyzer/OperationDetails';
import ErrorDisplay from './analyzer/ErrorDisplay';
import DebugInfo from './analyzer/DebugInfo';
import { LoadingSpinner } from './analyzer/LoadingSpinner';

const MongoDBAnalyzer = () => {
  const [profileData, setProfileData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOperations: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    byCollection: [],
    byOpType: [],
    missingIndexes: [],
    queryPatterns: []
  });

  // Monitor state changes for debugging
  useEffect(() => {
    console.log("Profile data updated, length:", profileData.length);
  }, [profileData]);

  useEffect(() => {
    console.log("Stats updated:", 
      "operations:", stats.totalOperations,
      "collections:", stats.byCollection.length,
      "opTypes:", stats.byOpType.length
    );
  }, [stats]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    console.log("File selected:", file.name, "Size:", file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log("File loaded, attempting to parse JSON");
        const rawData = e.target.result;
        
        // Try different parsing approaches for flexibility
        let data;
        try {
          // First try normal JSON parsing (array format)
          data = JSON.parse(rawData);
          console.log("Standard JSON parsing successful");
        } catch (standardParseError) {
          console.log("Standard JSON parsing failed, trying line-by-line format");
          
          // Try line-by-line JSON format (MongoDB sometimes exports this way)
          try {
            data = rawData
              .split('\n')
              .filter(line => line.trim())
              .map(line => JSON.parse(line));
            console.log("Line-by-line JSON parsing successful");
          } catch (lineParseError) {
            // If both approaches fail, throw the original error
            throw standardParseError;
          }
        }
        
        console.log("JSON parsed successfully, entries:", data.length);
        
        // Safety check for empty or invalid data
        if (!data || !Array.isArray(data) || data.length === 0) {
          setError('The uploaded file does not contain a valid MongoDB profile data array.');
          setIsLoading(false);
          return;
        }
        
        // Safety check for expected fields in at least some entries
        const hasValidEntries = data.some(item => 
          (typeof item === 'object') && 
          (('millis' in item) || ('op' in item) || ('ns' in item))
        );
        
        if (!hasValidEntries) {
          setError('The file does not appear to contain MongoDB profile data. Expected fields like "millis", "op", or "ns" were not found.');
          setIsLoading(false);
          return;
        }
        
        // First set the raw data
        setProfileData(data);
        
        try {
          console.log("Analyzing data...");
          
          // Process the data synchronously within this function
          const analysisResults = processData(data);
          
          // Then set the stats with the processed data - this ensures we have stats when we finish loading
          setStats(analysisResults);
          console.log("Analysis complete, stats set");
          
          // Finally mark loading as complete
          setIsLoading(false);
        } catch (analysisError) {
          console.error("Error during data analysis:", analysisError);
          setError(`Error analyzing data: ${analysisError.message}`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("JSON parse error:", err);
        setError('Failed to parse JSON file. Make sure it contains valid MongoDB profile data. Error: ' + err.message);
        setIsLoading(false);
      }
    };
    reader.onerror = (err) => {
      console.error("File read error:", err);
      setError('Failed to read file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Process profile data - separate from the state setting to avoid timing issues
  const processData = (data) => {
    if (!data || data.length === 0) {
      console.warn("No data to process");
      return {
        totalOperations: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        byCollection: [],
        byOpType: [],
        missingIndexes: [],
        queryPatterns: []
      };
    }

    try {
      console.log("Starting analysis on", data.length, "entries");
      
      // Check data structure for expected fields
      const sampleOp = data[0];
      console.log("Sample operation:", sampleOp);
      
      // General stats
      const totalDuration = data.reduce((sum, op) => sum + (op.millis || 0), 0);
      console.log("Total duration calculated:", totalDuration);
      const avgDuration = totalDuration / data.length;
      const maxDuration = Math.max(...data.map(op => op.millis || 0));

      // Group by collection
      const byCollectionMap = {};
      data.forEach(op => {
        const ns = op.ns || 'unknown';
        if (!byCollectionMap[ns]) {
          byCollectionMap[ns] = {
            name: ns,
            count: 0,
            totalTime: 0,
            operations: []
          };
        }
        byCollectionMap[ns].count++;
        byCollectionMap[ns].totalTime += (op.millis || 0);
        byCollectionMap[ns].operations.push(op);
      });

      console.log("Collections processed:", Object.keys(byCollectionMap).length);

      const byCollection = Object.values(byCollectionMap)
        .map(c => ({
          ...c,
          avgTime: c.totalTime / c.count
        }))
        .sort((a, b) => b.totalTime - a.totalTime);

      // Group by operation type
      const byOpTypeMap = {};
      data.forEach(op => {
        const opType = op.op || 'unknown';
        if (!byOpTypeMap[opType]) {
          byOpTypeMap[opType] = {
            name: opType,
            count: 0,
            totalTime: 0
          };
        }
        byOpTypeMap[opType].count++;
        byOpTypeMap[opType].totalTime += (op.millis || 0);
      });

      console.log("Operation types processed:", Object.keys(byOpTypeMap).length);

      const byOpType = Object.values(byOpTypeMap)
        .map(o => ({
          ...o,
          avgTime: o.totalTime / o.count
        }))
        .sort((a, b) => b.count - a.count);

      // Identify missing indexes and query patterns
      console.log("Identifying missing indexes...");
      const missingIndexes = identifyMissingIndexes(data);
      console.log("Missing indexes found:", missingIndexes.length);
      
      console.log("Identifying query patterns...");
      const queryPatterns = identifyQueryPatterns(data);
      console.log("Query patterns found:", queryPatterns.length);

      // Return the computed stats without setting state directly
      return {
        totalOperations: data.length,
        totalDuration,
        avgDuration,
        maxDuration,
        byCollection,
        byOpType,
        missingIndexes,
        queryPatterns
      };
    } catch (error) {
      console.error("Error in processData:", error);
      throw error; // Rethrow for upstream handling
    }
  };

  // Generate sample data for testing
  const generateSampleData = () => {
    const sampleData = [];
    const collections = ['users', 'products', 'orders', 'categories', 'reviews'];
    const opTypes = ['query', 'update', 'insert', 'remove', 'command', 'getmore'];
    
    // Generate 100 sample operations
    for (let i = 0; i < 100; i++) {
      const collection = collections[Math.floor(Math.random() * collections.length)];
      const opType = opTypes[Math.floor(Math.random() * opTypes.length)];
      const millis = Math.floor(Math.random() * 1000) + 1; // 1 to 1000ms
      
      const operation = {
        op: opType,
        ns: `test.${collection}`,
        millis: millis,
        ts: new Date().toISOString(),
        docsExamined: opType === 'query' ? Math.floor(Math.random() * 1000) + 1 : 0,
        nreturned: opType === 'query' ? Math.floor(Math.random() * 100) : 0,
      };
      
      // Add query details for query operations
      if (opType === 'query') {
        operation.query = { status: "active" };
        
        // 30% chance to have a potentially slow query with a COLLSCAN
        if (Math.random() < 0.3) {
          operation.planSummary = "COLLSCAN";
          operation.millis = operation.millis + 500; // Make it slower
        } else {
          operation.planSummary = "IXSCAN";
        }
      }
      
      sampleData.push(operation);
    }
    
    return sampleData;
  };

  // Handle sample data
  const handleUseSampleData = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Generating sample data");
      const sampleData = generateSampleData();
      setProfileData(sampleData);
      
      console.log("Analyzing sample data...");
      const analysisResults = processData(sampleData);
      setStats(analysisResults);
      console.log("Sample data analysis complete");
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error with sample data:", err);
      setError(`Error with sample data: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Identify operations that might benefit from indexes
  const identifyMissingIndexes = (data) => {
    // Look for scans without indexes or with high docs examined to returned ratio
    return data
      .filter(op => 
        // Include queries that:
        (op.op === 'query' || op.op === 'find') && // Only look at queries
        (
          (op.millis > 100) || // Slow queries
          (op.nreturned && op.docsExamined && op.docsExamined / op.nreturned > 10) || // High scan ratio
          (op.planSummary && op.planSummary.includes('COLLSCAN')) // Collection scans
        )
      )
      .map(op => {
        const fields = extractQueryFields(op.query || op.command?.filter || {});
        return {
          ns: op.ns,
          query: op.query || op.command?.filter || {},
          fields,
          millis: op.millis,
          docsExamined: op.docsExamined,
          nreturned: op.nreturned,
          scanRatio: op.nreturned ? op.docsExamined / op.nreturned : null,
          planSummary: op.planSummary
        };
      })
      .sort((a, b) => b.millis - a.millis);
  };

  // Extract fields that could be indexed from a query
  const extractQueryFields = (query) => {
    const fields = [];
    
    const processObject = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      // Handle special MongoDB operators
      if ('$and' in obj && Array.isArray(obj.$and)) {
        obj.$and.forEach((condition, i) => {
          processObject(condition, prefix);
        });
        return;
      }
      
      if ('$or' in obj && Array.isArray(obj.$or)) {
        obj.$or.forEach((condition, i) => {
          processObject(condition, prefix);
        });
        return;
      }
      
      // Process regular fields
      for (const key in obj) {
        if (key.startsWith('$')) continue; // Skip operators
        
        const value = obj[key];
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object') {
          // Check if this is a query operator
          const hasQueryOperator = Object.keys(value).some(k => k.startsWith('$'));
          
          if (hasQueryOperator) {
            fields.push(fullPath);
          } else {
            processObject(value, fullPath);
          }
        } else {
          fields.push(fullPath);
        }
      }
    };
    
    processObject(query);
    return [...new Set(fields)]; // Remove duplicates
  };

  // Identify common query patterns
  const identifyQueryPatterns = (data) => {
    // Only consider find/query operations
    const queries = data.filter(op => 
      (op.op === 'query' || op.op === 'find') && 
      (op.query || op.command?.filter)
    );
    
    // Group by pattern
    const patternGroups = _.groupBy(queries, op => {
      return generateQueryPatternKey(op.query || op.command?.filter || {});
    });
    
    // Format results
    return Object.entries(patternGroups)
      .map(([pattern, operations]) => {
        const totalTime = operations.reduce((sum, op) => sum + (op.millis || 0), 0);
        return {
          pattern,
          count: operations.length,
          totalTime,
          avgTime: totalTime / operations.length,
          examples: operations.slice(0, 3).map(op => ({
            ns: op.ns,
            query: op.query || op.command?.filter || {},
            millis: op.millis,
          }))
        };
      })
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 20); // Limit to top 20 patterns
  };

  // Generate a simplified key that represents the query pattern
  const generateQueryPatternKey = (query) => {
    const simplifyQueryObject = (obj) => {
      if (!obj || typeof obj !== 'object') return '?';
      
      // Handle arrays (for $and, $or, etc.)
      if (Array.isArray(obj)) {
        return '[' + obj.map(item => simplifyQueryObject(item)).join(',') + ']';
      }
      
      // Build simplified object with just the field names and operator types
      const simplified = {};
      
      for (const key in obj) {
        const value = obj[key];
        
        // Handle special operators
        if (key === '$and' || key === '$or' || key === '$nor') {
          simplified[key] = simplifyQueryObject(value);
        }
        // Handle regular fields
        else if (typeof value === 'object' && value !== null) {
          // Check if it's an operator object
          const hasOperators = Object.keys(value).some(k => k.startsWith('$'));
          
          if (hasOperators) {
            simplified[key] = '{' + Object.keys(value)
              .filter(k => k.startsWith('$'))
              .sort()
              .join(',') + '}';
          } else {
            simplified[key] = simplifyQueryObject(value);
          }
        } else {
          simplified[key] = '?';
        }
      }
      
      // Convert to string for consistent hashing
      return JSON.stringify(simplified);
    };
    
    return simplifyQueryObject(query);
  };

  // Handle tab change
  const handleTabChange = (value) => {
    console.log("Tab changing from", activeTab, "to", value);
    setActiveTab(value);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Only show when no data */}
      {!profileData.length && !isLoading && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Welcome to MongoDB Slow Query Analyzer</h2>
          <p className="text-sm text-muted-foreground">
            Upload your MongoDB profiler data to analyze slow queries, get performance insights, and receive AI-powered optimization suggestions.
          </p>
        </div>
      )}

      {/* File Upload Section - Only show when no data */}
      {!profileData.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Profile Data</CardTitle>
            <CardDescription>
              Upload your MongoDB profiler data file to begin analysis. The file should be in JSON format and contain MongoDB profiler entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 border-muted-foreground/25">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/75">
                    MongoDB profiler JSON file
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-muted-foreground">
              Analyzing profile data...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {!isLoading && profileData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Analysis Results</CardTitle>
                <CardDescription>
                  Showing analysis for {profileData.length.toLocaleString()} operations
                </CardDescription>
              </div>
              <label>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <div>
                    <Upload className="h-4 w-4" />
                    Upload New Data
                  </div>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="indexes">Indexes</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="overview">
                  <Overview stats={stats} />
                </TabsContent>
                <TabsContent value="collections">
                  <Collections stats={stats} />
                </TabsContent>
                <TabsContent value="indexes">
                  <IndexSuggestions stats={stats} />
                </TabsContent>
                <TabsContent value="patterns">
                  <QueryPatterns stats={stats} />
                </TabsContent>
                <TabsContent value="details">
                  <OperationDetails profileData={profileData} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Debug Info - Only in development */}
      {process.env.NODE_ENV === 'development' && (
          <DebugInfo 
            stats={stats} 
            profileData={profileData} 
            activeTab={activeTab} 
          />
      )}
    </div>
  );
};

export default MongoDBAnalyzer; 