'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  AlertCircle,
  ClockIcon,
  Database,
  Filter,
  Search,
  ArrowUpDown,
  ExternalLink,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Header } from '@/components/ui/header';

// Import analyzer components
import { LoadingSpinner } from '@/components/analyzer/LoadingSpinner';

// Format utilities
const formatDuration = (ms) => {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

export default function DashboardPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  // Allow selecting multiple collections and query types simultaneously
  const [filters, setFilters] = useState({
    collection: [],
    queryType: [],
    searchText: '',
    timeRange: 'all'
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'millis',
    direction: 'desc'
  });

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalQueries: 0,
    avgDuration: 0,
    maxDuration: 0,
    slowestQuery: null,
    totalCollections: 0,
    totalDatabases: 0,
    timeRange: { start: null, end: null }
  });

  // Display limit state
  const [displayLimit, setDisplayLimit] = useState(25);

  // Process data
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true);

        // Try to load data from localStorage
        const storedData = localStorage.getItem('mongoProfileData');

        if (!storedData) {
          setError('No MongoDB profile data found. Please upload a file first.');
          setIsLoading(false);
          return;
        }

        const data = JSON.parse(storedData);

        if (!Array.isArray(data) || data.length === 0) {
          setError('Invalid or empty MongoDB profile data.');
          setIsLoading(false);
          return;
        }

        // Process the data
        const processedData = processData(data);
        setProfileData(processedData);

        // Calculate metrics
        calculateMetrics(processedData);

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load or process MongoDB profile data.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const processData = (data) => {
    // Process and prepare the data for analysis
    // This is a simplified version; the actual implementation would be more complex
    return data.map(entry => {
      // Extract namespace parts
      const ns = entry.ns || '';
      const [database, collection] = ns.split('.');

      return {
        ...entry,
        database,
        collection,
        // Ensure millis is available for sorting
        millis: entry.millis || (entry.responseLength?.time || 0),
        // Extract query type
        queryType: getQueryType(entry),
        // Format the query for display
        displayQuery: formatQueryForDisplay(entry)
      };
    });
  };

  const getQueryType = (entry) => {
    if (entry.op) return entry.op;
    if (entry.command?.find) return 'find';
    if (entry.command?.aggregate) return 'aggregate';
    if (entry.command?.insert) return 'insert';
    if (entry.command?.update) return 'update';
    if (entry.command?.delete) return 'delete';
    return 'unknown';
  };

  const formatQueryForDisplay = (entry) => {
    if (entry.query) return JSON.stringify(entry.query, null, 2);
    if (entry.command) return JSON.stringify(entry.command, null, 2);
    return JSON.stringify(entry, null, 2);
  };

  const calculateMetrics = (data) => {
    if (!data || data.length === 0) return;

    // Calculate total queries
    const totalQueries = data.length;

    // Calculate average duration
    const totalDuration = data.reduce((sum, query) => sum + (query.millis || 0), 0);
    const avgDuration = totalDuration / totalQueries;

    // Find max duration and slowest query
    let maxDuration = 0;
    let slowestQuery = null;

    for (const query of data) {
      if ((query.millis || 0) > maxDuration) {
        maxDuration = query.millis || 0;
        slowestQuery = query;
      }
    }

    // Count unique collections and databases
    const collections = new Set();
    const databases = new Set();

    for (const query of data) {
      if (query.collection) collections.add(query.collection);
      if (query.database) databases.add(query.database);
    }

    // Determine time range
    let startTime = new Date().getTime();
    let endTime = 0;

    for (const query of data) {
      const timestamp = query.ts ? new Date(query.ts.$date).getTime() : 0;
      if (timestamp > 0) {
        startTime = Math.min(startTime, timestamp);
        endTime = Math.max(endTime, timestamp);
      }
    }

    setMetrics({
      totalQueries,
      avgDuration,
      maxDuration,
      slowestQuery,
      totalCollections: collections.size,
      totalDatabases: databases.size,
      timeRange: {
        start: startTime !== new Date().getTime() ? new Date(startTime) : null,
        end: endTime > 0 ? new Date(endTime) : null
      }
    });
  };

  const handleFilterChange = (key, value) => {
    // Support multi-select for collection and query type filters
    if (key === 'collection' || key === 'queryType') {
      setFilters(prevFilters => {
        const currentValues = prevFilters[key] || [];
        const exists = currentValues.includes(value);
        return {
          ...prevFilters,
          [key]: exists
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value]
        };
      });
    } else {
      setFilters(prevFilters => ({
        ...prevFilters,
        [key]: value
      }));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key
          ? prevConfig.direction === 'asc' ? 'desc' : 'asc'
          : 'desc'
    }));
  };

  const handleQueryClick = (query) => {
    // Store the selected query for details view
    localStorage.setItem('selectedQuery', JSON.stringify(query));
    router.push('/query-details');
  };

  // Filter data based on current filters
  const filteredData = profileData ? profileData.filter(query => {
    // Filter by collection (support multiple selections)
    if (filters.collection.length > 0 && !filters.collection.includes(query.collection)) {
      return false;
    }

    // Filter by query type (support multiple selections)
    if (filters.queryType.length > 0 && !filters.queryType.includes(query.queryType)) {
      return false;
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const queryString = query.displayQuery.toLowerCase();
      if (!queryString.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }) : [];

  // Sort data based on current sort config
  const sortedData = filteredData ? [...filteredData].sort((a, b) => {
    const key = sortConfig.key;

    if (typeof a[key] === 'number' && typeof b[key] === 'number') {
      return sortConfig.direction === 'asc'
        ? a[key] - b[key]
        : b[key] - a[key];
    }

    // Handle string comparison
    const valueA = String(a[key] || '');
    const valueB = String(b[key] || '');

    return sortConfig.direction === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  }) : [];

  // Extract unique collections for filter dropdown
  const collections = profileData
    ? [...new Set(profileData.map(q => q.collection).filter(Boolean))]
    : [];

  // Extract unique query types for filter dropdown
  const queryTypes = profileData
    ? [...new Set(profileData.map(q => q.queryType).filter(Boolean))]
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Loading MongoDB profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/upload')}
        >
          Go to Upload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">MongoDB Slow Query Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Analyze and optimize your MongoDB query performance
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-4 py-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Slow Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-2xl font-bold">{formatNumber(metrics.totalQueries)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {metrics.totalCollections} collections
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-4 py-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Average Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-2xl font-bold">{formatDuration(metrics.avgDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per query execution time
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-4 py-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Slowest Query
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-2xl font-bold">{formatDuration(metrics.maxDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.slowestQuery?.collection && `In ${metrics.slowestQuery.collection}`}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-4 py-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Database Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-2xl font-bold">{metrics.totalDatabases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Databases with slow queries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="overflow-hidden mb-6">
          <CardHeader className="px-4 py-4 pb-2">
            <CardTitle className="text-sm">Filter Queries</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-1 gap-3">
              {/* Collection Filter */}
              <div>
                <div className="text-xs font-medium mb-1.5">Collections</div>
                <div className="flex flex-wrap gap-1.5">
                  {collections.length > 0 ? (
                    <>
                      {collections.map(collection => (
                        <Button
                          key={collection}
                          variant={filters.collection.includes(collection) ? "default" : "outline"}
                          size="sm"
                          className="text-xs py-1 h-7"
                          onClick={() => handleFilterChange('collection', collection)}
                        >
                          {collection}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">No collections found</div>
                  )}
                </div>
              </div>

              {/* Query Type Filter */}
              <div>
                <div className="text-xs font-medium mb-1.5">Query Types</div>
                <div className="flex flex-wrap gap-1.5">
                  {queryTypes.length > 0 ? (
                    <>
                      {queryTypes.map(type => (
                        <Button
                          key={type}
                          variant={filters.queryType.includes(type) ? "default" : "outline"}
                          size="sm"
                          className="text-xs py-1 h-7"
                          onClick={() => handleFilterChange('queryType', type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">No query types found</div>
                  )}
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search queries..."
                  className="pl-8 h-8 text-xs"
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange('searchText', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-muted-foreground">
                Showing {filteredData.length} of {profileData.length} queries
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilters({
                  collection: [],
                  queryType: [],
                  searchText: '',
                  timeRange: 'all'
                })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queries Table */}
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-4 pb-2">
            <CardTitle className="text-sm">Slow Queries</CardTitle>
            <CardDescription className="text-xs">
              Click on a row to view detailed analysis of a query
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:text-primary w-[180px] text-xs"
                    onClick={() => handleSort('collection')}
                  >
                    Collection
                    {sortConfig.key === 'collection' && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary w-[100px] text-xs"
                    onClick={() => handleSort('queryType')}
                  >
                    Type
                    {sortConfig.key === 'queryType' && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead className="text-xs">Query</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary text-right w-[100px] text-xs"
                    onClick={() => handleSort('millis')}
                  >
                    Duration
                    {sortConfig.key === 'millis' && (
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead className="text-right w-[100px] text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      No matching queries found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.slice(0, displayLimit).map((query, index) => (
                    <TableRow
                      key={`query-${query.ts ? query.ts.$date : ''}-${query.collection || ''}-${query.millis || ''}-${index}`}
                      className={`cursor-pointer text-xs ${(query.millis || 0) > metrics.avgDuration * 2
                        ? 'dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/20 border-l-2 border-l-red-500'
                        : (query.millis || 0) > metrics.avgDuration
                          ? 'dark:bg-amber-950/10 hover:bg-amber-100 dark:hover:bg-amber-950/20 border-l-2 border-l-amber-500'
                          : 'dark:hover:bg-purple-950/10 border-l-2 border-l-purple-200 dark:border-l-purple-800'}`}
                      onClick={() => handleQueryClick(query)}
                    >
                      <TableCell className="font-medium py-2">
                        {query.collection || 'N/A'}
                        {query.database && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {query.database}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] py-0 h-5">{query.queryType || 'unknown'}</Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="font-mono text-[10px] max-w-[500px] truncate">
                          {query.displayQuery.slice(0, 100)}
                          {query.displayQuery.length > 100 ? '...' : ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 h-5 ${(query.millis || 0) > metrics.avgDuration * 2
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                              : (query.millis || 0) > metrics.avgDuration
                                ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                            }`}
                        >
                          {formatDuration(query.millis || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/query-details?id=${index}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {sortedData.length > displayLimit && (
                <TableCaption>
                  <div className="flex justify-between items-center py-2">
                    <p className="text-muted-foreground">
                      Showing {displayLimit} of {sortedData.length} queries
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/20 bg-primary/5 hover:bg-primary/10 dark:text-primary-foreground dark:border-primary/30 dark:bg-primary/10 dark:hover:bg-primary/20"
                      onClick={() => setDisplayLimit(displayLimit + 25)}
                    >
                      <span>Show More</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </TableCaption>
              )}
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 