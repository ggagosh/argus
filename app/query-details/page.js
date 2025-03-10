'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft,
  Github,
  Info,
  Clock,
  Search,
  FileText,
  ScanLine,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/analyzer/LoadingSpinner';
import OperationDetails from '@/components/analyzer/operations/OperationDetails';
import { Header } from '@/components/ui/header';

// Format utilities
const formatDuration = (ms) => {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    if (typeof dateString === 'string') {
      return new Date(dateString).toLocaleString();
    } 
    
    if (dateString.$date) {
      return new Date(dateString.$date).toLocaleString();
    }
    return 'Invalid date';
  } catch (e) {
    return 'Invalid date';
  }
};

// Client component that uses useSearchParams
function QueryDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadQuery = () => {
      try {
        setIsLoading(true);
        
        // Get query from localStorage
        const storedQuery = localStorage.getItem('selectedQuery');
        
        if (!storedQuery) {
          setError('No query selected. Please select a query from the dashboard.');
          setIsLoading(false);
          return;
        }
        
        const selectedQuery = JSON.parse(storedQuery);
        setQuery(selectedQuery);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading query:', err);
        setError(`Failed to load query details: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    loadQuery();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Loading query details...</p>
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
          onClick={() => router.push('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  if (!query) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Query Selected</AlertTitle>
          <AlertDescription>
            Please select a query from the dashboard to view detailed analysis.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/dashboard')}
        >
          Return to Dashboard
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
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Query Details</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Query Analysis</h1>
              <p className="text-muted-foreground mt-1">
                Detailed performance breakdown and optimization suggestions
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            {/* Main content - Operation Details */}
            <OperationDetails
              selectedOperation={query}
              formatTime={formatDuration}
              formatTimestamp={formatDate}
            />
          </div>
          
          <div className="md:col-span-1">
            {/* Sidebar - Performance Metrics Explained */}
            <div className="space-y-3">
                  <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-800 dark:text-blue-300">Query Duration</span>
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-xs opacity-90">
                      The total time taken to execute the query. Values above 100ms are generally considered slow.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-purple-800 dark:text-purple-300">Documents Examined</span>
                    </h4>
                    <p className="text-purple-700 dark:text-purple-300 text-xs opacity-90">
                      Number of documents MongoDB had to inspect to fulfill the query. Lower numbers indicate better index usage.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <h4 className="font-medium flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-800 dark:text-green-300">Documents Returned</span>
                    </h4>
                    <p className="text-green-700 dark:text-green-300 text-xs opacity-90">
                      The total number of documents returned by the query.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <h4 className="font-medium flex items-center gap-1.5">
                      <ScanLine className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-amber-800 dark:text-amber-300">Scan Ratio</span>
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-xs opacity-90">
                      Documents examined divided by documents returned. Lower ratios indicate more efficient queries. Values over 10 suggest optimization opportunities.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-md bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800">
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-cyan-800 dark:text-cyan-300">Index Usage</span>
                    </h4>
                    <p className="text-cyan-700 dark:text-cyan-300 text-xs opacity-90">
                      Indicates whether the query used an index. Collection scans (COLLSCAN) mean no suitable index was found and generally perform poorly on large collections.
                    </p>
                  </div>
                </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense boundary
export default function QueryDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <QueryDetailsContent />
    </Suspense>
  );
} 