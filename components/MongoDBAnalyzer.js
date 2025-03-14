"use client";

import React, { useState, useEffect } from "react";
import { Upload, AlertCircle, PlayCircle, Trash, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// Import analyzer components
import Overview from "./analyzer/Overview";
import Collections from "./analyzer/Collections";
import IndexSuggestions from "./analyzer/IndexSuggestions";
import QueryPatterns from "./analyzer/QueryPatterns";
import OperationDetails from "./analyzer/OperationDetails";
import DebugInfo from "./analyzer/DebugInfo";
import { LoadingSpinner } from "./analyzer/LoadingSpinner";

// Import sample data
import { sampleData } from "../lib/sampleData";

const MongoDBAnalyzer = () => {
  const [profileData, setProfileData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalOperations: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    byCollection: [],
    byOpType: [],
    missingIndexes: [],
    queryPatterns: [],
  });

  useEffect(() => {
    console.log("Profile data updated, length:", profileData.length);
  }, [profileData]);

  useEffect(() => {
    console.log(
      "Stats updated:",
      "operations:",
      stats.totalOperations,
      "collections:",
      stats.byCollection.length,
      "opTypes:",
      stats.byOpType.length
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
          console.log(
            "Standard JSON parsing failed, trying line-by-line format"
          );

          // Try line-by-line JSON format (MongoDB sometimes exports this way)
          try {
            data = rawData
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => JSON.parse(line));
            console.log("Line-by-line JSON parsing successful");
          } catch (lineParseError) {
            // If both approaches fail, throw the original error
            throw standardParseError;
          }
        }

        console.log("JSON parsed successfully, entries:", data.length);

        // Safety check for empty or invalid data
        if (!data || !Array.isArray(data) || data.length === 0) {
          setError(
            "The uploaded file does not contain a valid MongoDB profile data array."
          );
          setIsLoading(false);
          return;
        }

        // Safety check for expected fields in at least some entries
        const hasValidEntries = data.some(
          (item) =>
            typeof item === "object" &&
            ("millis" in item || "op" in item || "ns" in item)
        );

        if (!hasValidEntries) {
          setError(
            'The file does not appear to contain MongoDB profile data. Expected fields like "millis", "op", or "ns" were not found.'
          );
          setIsLoading(false);
          return;
        }

        // Analyze and cut large arrays in arrays
        data = analyzeAndCutLargeInArrays(data);

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
        setError(
          "Failed to parse JSON file. Make sure it contains valid MongoDB profile data. Error: " +
            err.message
        );
        setIsLoading(false);
      }
    };
    reader.onerror = (err) => {
      console.error("File read error:", err);
      setError("Failed to read file.");
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
        queryPatterns: [],
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
      const maxDuration = Math.max(...data.map((op) => op.millis || 0));

      // Group by collection
      const byCollectionMap = {};
      data.forEach((op) => {
        const ns = op.ns || "unknown";
        if (!byCollectionMap[ns]) {
          byCollectionMap[ns] = {
            name: ns,
            count: 0,
            totalTime: 0,
            operations: [],
          };
        }
        byCollectionMap[ns].count++;
        byCollectionMap[ns].totalTime += op.millis || 0;
        byCollectionMap[ns].operations.push(op);
      });

      console.log(
        "Collections processed:",
        Object.keys(byCollectionMap).length
      );

      const byCollection = Object.values(byCollectionMap)
        .map((c) => ({
          ...c,
          avgTime: c.totalTime / c.count,
        }))
        .sort((a, b) => b.totalTime - a.totalTime);

      // Group by operation type
      const byOpTypeMap = {};
      data.forEach((op) => {
        const opType = op.op || "unknown";
        if (!byOpTypeMap[opType]) {
          byOpTypeMap[opType] = {
            name: opType,
            count: 0,
            totalTime: 0,
          };
        }
        byOpTypeMap[opType].count++;
        byOpTypeMap[opType].totalTime += op.millis || 0;
      });

      console.log(
        "Operation types processed:",
        Object.keys(byOpTypeMap).length
      );

      const byOpType = Object.values(byOpTypeMap)
        .map((o) => ({
          ...o,
          avgTime: o.totalTime / o.count,
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
        queryPatterns,
      };
    } catch (error) {
      console.error("Error in processData:", error);
      throw error; // Rethrow for upstream handling
    }
  };

  // Generate sample data for testing
  const generateSampleData = () => {
    const sampleData = [];
    const collections = [
      "users",
      "products",
      "orders",
      "categories",
      "reviews",
    ];
    const opTypes = [
      "query",
      "update",
      "insert",
      "remove",
      "command",
      "getmore",
    ];

    // Generate 100 sample operations
    for (let i = 0; i < 100; i++) {
      const collection =
        collections[Math.floor(Math.random() * collections.length)];
      const opType = opTypes[Math.floor(Math.random() * opTypes.length)];
      const millis = Math.floor(Math.random() * 1000) + 1; // 1 to 1000ms

      const operation = {
        op: opType,
        ns: `test.${collection}`,
        millis: millis,
        ts: new Date().toISOString(),
        docsExamined:
          opType === "query" ? Math.floor(Math.random() * 1000) + 1 : 0,
        nreturned: opType === "query" ? Math.floor(Math.random() * 100) : 0,
      };

      // Add query details for query operations
      if (opType === "query") {
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
    // Define thresholds as constants for easier configuration
    const SLOW_QUERY_THRESHOLD_MS = 100;
    const HIGH_SCAN_RATIO = 10;

    // Helper function to safely extract query shape
    const getQueryFilter = (op) => {
      // Handle regular queries
      if (op.query) return op.query;

      // Handle find command
      if (op.command && op.command.filter) return op.command.filter;

      // Handle aggregation pipelines
      if (op.command && op.command.aggregate && op.command.pipeline) {
        // Extract $match stages from the aggregation pipeline
        const matchStages = op.command.pipeline.filter((stage) => stage.$match);
        if (matchStages.length > 0) {
          // Return all match conditions merged into one object
          return matchStages.reduce(
            (acc, stage) => ({ ...acc, ...stage.$match }),
            {}
          );
        }
      }

      // Default to empty object if no filter found
      return {};
    };

    return data
      .filter((op) => {
        // Check if the operation is a query type we want to analyze
        const isQueryOp = op.op === "query" || op.op === "find";
        const isAggregateOp =
          op.op === "command" && op.command && op.command.aggregate;

        if (!isQueryOp && !isAggregateOp) return false;

        // Check if operation meets any of our problematic criteria
        const isSlow = op.millis > SLOW_QUERY_THRESHOLD_MS;
        const hasHighScanRatio =
          op.nreturned &&
          op.docsExamined &&
          op.docsExamined / op.nreturned > HIGH_SCAN_RATIO;
        const usesCollectionScan =
          op.planSummary && op.planSummary.includes("COLLSCAN");

        return isSlow || hasHighScanRatio || usesCollectionScan;
      })
      .map((op) => {
        const queryFilter = getQueryFilter(op);
        const fields = extractQueryFields(queryFilter);
        const scanRatio = op.nreturned ? op.docsExamined / op.nreturned : null;

        // Return enhanced object with index recommendation
        return {
          ns: op.ns,
          query: queryFilter,
          fields,
          millis: op.millis,
          docsExamined: op.docsExamined,
          nreturned: op.nreturned,
          scanRatio,
          planSummary: op.planSummary,
          // Include a recommendation score to prioritize issues
          recommendationScore: calculateRecommendationScore(op, scanRatio),
          // Include suggested index based on query pattern
          suggestedIndex: suggestIndex(op.ns, fields),
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore); // Sort by recommendation priority
  };

  // Helper function to calculate a recommendation score
  const calculateRecommendationScore = (op, scanRatio) => {
    // Prioritize based on multiple factors
    let score = 0;

    // Very slow queries get higher priority
    if (op.millis > 1000) score += 100;
    else if (op.millis > 500) score += 50;
    else if (op.millis > 100) score += 20;

    // High scan ratios indicate poor index usage
    if (scanRatio > 1000) score += 50;
    else if (scanRatio > 100) score += 30;
    else if (scanRatio > 10) score += 10;

    // Collection scans are particularly problematic for large collections
    if (op.planSummary && op.planSummary.includes("COLLSCAN")) {
      score += 40;
      // If examining many documents, it's even worse
      if (op.docsExamined > 10000) score += 30;
    }

    return score;
  };

  // Helper function to suggest an appropriate index
  const suggestIndex = (namespace, fields) => {
    if (!fields || fields.length === 0) return null;

    // Create a basic index suggestion using the fields from the query
    // In a real implementation, this would be more sophisticated
    const [collection] = namespace.split(".");
    const indexFields = fields.slice(0, 3); // Limit to first 3 fields for simplicity

    return {
      collection,
      indexFields,
      indexDef: `{ ${indexFields.map((f) => `"${f}": 1`).join(", ")} }`,
      command: `db.${collection}.createIndex(${JSON.stringify(
        Object.fromEntries(indexFields.map((f) => [f, 1]))
      )})`,
    };
  };

  // Extract fields that could be indexed from a query
  const extractQueryFields = (query) => {
    const fields = [];

    const processObject = (obj, prefix = "") => {
      if (!obj || typeof obj !== "object") return;

      // Handle special MongoDB operators
      if ("$and" in obj && Array.isArray(obj.$and)) {
        obj.$and.forEach((condition, i) => {
          processObject(condition, prefix);
        });
        return;
      }

      if ("$or" in obj && Array.isArray(obj.$or)) {
        obj.$or.forEach((condition, i) => {
          processObject(condition, prefix);
        });
        return;
      }

      // Process regular fields
      for (const key in obj) {
        if (key.startsWith("$")) continue; // Skip operators

        const value = obj[key];
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === "object") {
          // Check if this is a query operator
          const hasQueryOperator = Object.keys(value).some((k) =>
            k.startsWith("$")
          );

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
    // Consider find, query, and aggregation operations
    const queries = data.filter((op) => {
      const isRegularQuery =
        (op.op === "query" || op.op === "find") &&
        (op.query || op.command?.filter);

      const isAggregation =
        op.op === "command" &&
        op.command?.aggregate &&
        Array.isArray(op.command.pipeline);

      return isRegularQuery || isAggregation;
    });

    // Extract query pattern from each operation
    const queriesWithPatterns = queries.map((op) => {
      let queryObj;
      let queryType = "find";

      if (op.query) {
        queryObj = op.query;
      } else if (op.command?.filter) {
        queryObj = op.command.filter;
      } else if (op.command?.aggregate && Array.isArray(op.command.pipeline)) {
        queryType = "aggregate";
        // Extract match conditions from aggregation pipeline
        const matchStages = op.command.pipeline.filter((stage) => stage.$match);
        if (matchStages.length > 0) {
          queryObj = matchStages.reduce(
            (acc, stage) => ({ ...acc, ...stage.$match }),
            {}
          );
        } else {
          // For aggregations without match stages, create a pattern based on pipeline structure
          queryObj = {
            pipelineStructure: op.command.pipeline.map(
              (stage) => Object.keys(stage)[0] || "unknown"
            ),
          };
        }
      } else {
        queryObj = {};
      }

      return {
        ...op,
        patternKey: generateQueryPatternKey(queryObj),
        queryType,
        extractedQuery: queryObj,
      };
    });

    // Group by pattern
    const patternGroups = queriesWithPatterns.reduce((groups, query) => {
      const key = query.patternKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(query);
      return groups;
    }, {});

    // Format results
    return Object.entries(patternGroups)
      .map(([pattern, operations]) => {
        const totalTime = operations.reduce(
          (sum, op) => sum + (op.millis || 0),
          0
        );

        // Get the most common namespace for this pattern
        const nsCounts = operations.reduce((acc, op) => {
          acc[op.ns] = (acc[op.ns] || 0) + 1;
          return acc;
        }, {});
        const topNamespaces = Object.entries(nsCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([ns, count]) => ({
            ns,
            count,
            percentage: Math.round((count / operations.length) * 100),
          }));

        // Get example operations, prioritizing slower ones
        const examples = operations
          .sort((a, b) => b.millis - a.millis)
          .slice(0, 3)
          .map((op) => ({
            ns: op.ns,
            query: op.extractedQuery,
            queryType: op.queryType,
            millis: op.millis,
            planSummary: op.planSummary,
          }));

        return {
          pattern,
          count: operations.length,
          totalTime,
          avgTime: Math.round(totalTime / operations.length),
          maxTime: Math.max(...operations.map((op) => op.millis || 0)),
          namespaces: topNamespaces,
          queryTypes: operations.reduce((acc, op) => {
            acc[op.queryType] = (acc[op.queryType] || 0) + 1;
            return acc;
          }, {}),
          hasCollectionScans: operations.some(
            (op) => op.planSummary && op.planSummary.includes("COLLSCAN")
          ),
          examples,
        };
      })
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 20); // Limit to top 20 patterns
  };

  // Generate a simplified key that represents the query pattern
  const generateQueryPatternKey = (query) => {
    const simplifyQueryObject = (obj, depth = 0) => {
      // Prevent infinite recursion on circular references
      if (depth > 10) return "...";

      if (!obj || typeof obj !== "object") return "?";

      // Handle arrays (for $and, $or, etc. or for aggregation pipeline stages)
      if (Array.isArray(obj)) {
        // Special case for pipeline structure in aggregations
        if (obj.every((item) => typeof item === "string")) {
          return "[" + obj.join(",") + "]";
        }
        return (
          "[" +
          obj.map((item) => simplifyQueryObject(item, depth + 1)).join(",") +
          "]"
        );
      }

      // Build simplified object with just the field names and operator types
      const simplified = {};

      for (const key in obj) {
        const value = obj[key];

        // Handle special operators
        if (key === "$and" || key === "$or" || key === "$nor") {
          simplified[key] = simplifyQueryObject(value, depth + 1);
        }
        // Handle MongoDB dot notation fields (preserve the full path)
        else if (key.includes(".")) {
          simplified[key] =
            typeof value === "object" && value !== null
              ? simplifyQueryObject(value, depth + 1)
              : "?";
        }
        // Handle regular fields
        else if (typeof value === "object" && value !== null) {
          // Check if it's an operator object
          const hasOperators = Object.keys(value).some((k) =>
            k.startsWith("$")
          );

          if (hasOperators) {
            // Preserve just the operator names, not their values
            simplified[key] =
              "{" +
              Object.keys(value)
                .filter((k) => k.startsWith("$"))
                .sort()
                .join(",") +
              "}";
          } else {
            simplified[key] = simplifyQueryObject(value, depth + 1);
          }
        } else {
          simplified[key] = "?";
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

  const loadSampleData = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Process the sample data
      const analysisResults = processData(sampleData);
      setProfileData(sampleData);
      setStats(analysisResults);

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading sample data:", err);
      setError("Failed to load sample data. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    setProfileData([]);
    setStats({
      totalOperations: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      byCollection: [],
      byOpType: [],
      missingIndexes: [],
      queryPatterns: [],
    });
    setError(null);
    setActiveTab("overview");
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Only show when no data */}
      {!profileData.length && !isLoading && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">
            Welcome to MongoDB Slow Query Analyzer
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your MongoDB profiler data to analyze slow queries, get
            performance insights, and receive AI-powered optimization
            suggestions.
          </p>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadSampleData}
              variant="secondary"
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Try Demo
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <p className="text-sm text-muted-foreground">
              or upload your own data
            </p>
          </div>
        </div>
      )}

      {/* File Upload Section - Only show when no data */}
      {!profileData.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Profile Data</CardTitle>
            <CardDescription>
              Upload your MongoDB profiler data file to begin analysis. The file
              should be in JSON format and contain MongoDB profiler entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 border-muted-foreground/25">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
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
              {profileData.length
                ? "Analyzing profile data..."
                : "Loading sample data..."}
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
                  Showing analysis for {profileData.length.toLocaleString()}{" "}
                  operations
                  {profileData === sampleData && " (Demo Data)"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <label>
                    <Upload className="h-4 w-4" />
                    Upload New Data
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </label>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleClearData}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
      {process.env.NODE_ENV === "development" && (
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
