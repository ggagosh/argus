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
    } else if (dateString.$date) {
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
        setError('Failed to load query details: ' + err.message);
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
            <Card className="max-w-xs mx-auto md:ml-auto w-full">
              <CardHeader className="px-4 py-4">
                <CardTitle className="flex items-center text-sm">
                  <Info className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Query Duration
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      The total time taken to execute the query. Values above 100ms are generally considered slow.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      Documents Examined
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      Number of documents MongoDB had to inspect to fulfill the query. Lower numbers indicate better index usage.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Documents Returned
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      The total number of documents returned by the query.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium flex items-center gap-1.5">
                      <ScanLine className="h-4 w-4 text-muted-foreground" />
                      Scan Ratio
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      Documents examined divided by documents returned. Lower ratios indicate more efficient queries. Values over 10 suggest optimization opportunities.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      Index Usage
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      Indicates whether the query used an index. Collection scans (COLLSCAN) mean no suitable index was found and generally perform poorly on large collections.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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