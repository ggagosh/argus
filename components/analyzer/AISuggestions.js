import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, AlertCircle, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AISuggestions({ query, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openItems, setOpenItems] = useState({});

  // Toggle a specific suggestion open/closed
  const toggleSuggestion = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (!query) return;
    
    const analyzeQueryPerformance = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Retrieve MongoDB profiler data for additional analysis
        const storedData = localStorage.getItem('mongoProfileData');
        if (!storedData) {
          throw new Error('No MongoDB profiler data available for analysis');
        }
        
        const profileData = JSON.parse(storedData);
        const suggestionsResult = [];
        
        // 1. Check if query is using an index
        const usesIndex = query.planSummary 
          ? !query.planSummary.includes('COLLSCAN') 
          : !(query.keysExamined > 0 && query.nreturned > 0 && query.keysExamined / query.nreturned > 20);
          
        if (!usesIndex) {
          // Analyze query to identify potential index fields
          const indexFields = analyzeQueryForIndexFields(query);
          
          // Add index suggestion
          suggestionsResult.push({
            id: 'add-index',
            title: indexFields.length > 0 
              ? `Add index on ${indexFields.join(', ')} fields` 
              : 'Add appropriate index for query filter fields',
            description: 'This query is performing a collection scan which examines a large number of documents. Creating an index on the fields used in the query filter would significantly improve performance.',
            impact: 'high',
            code: indexFields.length > 0 
              ? `db.${query.collection || 'collection'}.createIndex({ ${indexFields.map(f => `${f}: 1`).join(', ')} })` 
              : `db.${query.collection || 'collection'}.createIndex({ field_name: 1 })`,
            status: 'suggested'
          });
        }
        
        // 2. Check scan ratio (keys examined vs docs returned)
        const scanRatio = query.keysExamined && query.nreturned 
          ? query.keysExamined / query.nreturned 
          : null;
          
        if (scanRatio && scanRatio > 10) {
          suggestionsResult.push({
            id: 'improve-filter',
            title: 'Improve query filter specificity',
            description: `The query has a high scan ratio (${scanRatio.toFixed(1)}), meaning it examines many more documents than it returns. Consider making your filter conditions more specific to narrow down the result set earlier.`,
            impact: 'medium',
            code: `// Original query\n${JSON.stringify(query.query || query.command || {}, null, 2)}\n\n// Consider adding more specific filter conditions`,
            status: 'suggested'
          });
        }
        
        // 3. Check for projection usage
        const usesProjection = query.command && query.command.projection;
        
        if (!usesProjection) {
          suggestionsResult.push({
            id: 'add-projection',
            title: 'Use projection to limit returned fields',
            description: 'This query retrieves all fields from the documents. Using projection to specify only the fields you need can reduce network transfer and processing time.',
            impact: 'low',
            code: `db.${query.collection || 'collection'}.find(\n  ${JSON.stringify(query.query || {}, null, 2)},\n  { field1: 1, field2: 1 }\n)`,
            status: 'suggested'
          });
        }
        
        // 4. Check for sort without index
        const usesSort = query.command && query.command.sort;
        
        if (usesSort && !usesIndex) {
          suggestionsResult.push({
            id: 'index-for-sort',
            title: 'Create index to support sort operation',
            description: 'This query includes a sort operation without an appropriate index. Adding an index that supports both the query filter and sort fields will avoid in-memory sorting and improve performance.',
            impact: 'high',
            code: `// Create a compound index that includes both filter and sort fields\ndb.${query.collection || 'collection'}.createIndex({ filter_field: 1, sort_field: 1 })`,
            status: 'suggested'
          });
        }
        
        // 5. Analyze if this query pattern appears frequently
        const similarQueries = findSimilarQueries(query, profileData);
        if (similarQueries.length > 3) {
          suggestionsResult.push({
            id: 'frequent-query',
            title: 'Frequently executed query pattern',
            description: `This query pattern was found ${similarQueries.length} times in your profiler data. Consider caching results or creating a covered index to optimize performance.`,
            impact: 'medium',
            code: `// Create a covered index that includes all fields needed by the query\ndb.${query.collection || 'collection'}.createIndex(\n  { ${indexFields.map(f => `${f}: 1`).join(', ')} },\n  { name: "covered_index_for_frequent_query" }\n)`,
            status: 'suggested'
          });
        }
        
        // 6. Suggest query plan analysis
        suggestionsResult.push({
          id: 'explain-plan',
          title: 'Analyze query execution plan',
          description: 'Run explain() to examine how MongoDB executes this query and identify potential bottlenecks.',
          impact: 'medium',
          code: `db.${query.collection || 'collection'}.find(${JSON.stringify(query.query || {}, null, 2)}).explain("executionStats")`,
          status: 'suggested'
        });
        
        setSuggestions(suggestionsResult);
        setIsLoading(false);
      } catch (error) {
        console.error('Error analyzing query performance:', error);
        setError(`Failed to generate optimization suggestions: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    analyzeQueryPerformance();
  }, [query]);
  
  // Helper function to analyze query for potential index fields
  const analyzeQueryForIndexFields = (query) => {
    const indexFields = [];
    try {
      if (query.query && query.query.$and) {
        // If query has $and, identify fields in each condition
        query.query.$and.forEach(condition => {
          Object.keys(condition).forEach(field => {
            if (!field.startsWith('$') && !indexFields.includes(field)) {
              indexFields.push(field);
            }
          });
        });
      } else if (query.query) {
        // Otherwise, get direct fields
        Object.keys(query.query).forEach(field => {
          if (!field.startsWith('$') && !indexFields.includes(field)) {
            indexFields.push(field);
          }
        });
      } else if (query.command) {
        // If it's a command, try to extract query from it
        if (query.command.filter) {
          Object.keys(query.command.filter).forEach(field => {
            if (!field.startsWith('$') && !indexFields.includes(field)) {
              indexFields.push(field);
            }
          });
        } else if (query.command.find) {
          // It's a find command, check if there's a filter
          if (query.command.filter) {
            Object.keys(query.command.filter).forEach(field => {
              if (!field.startsWith('$') && !indexFields.includes(field)) {
                indexFields.push(field);
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Error analyzing query for index fields:', e);
    }
    return indexFields;
  };
  
  // Helper function to find similar queries in profiler data
  const findSimilarQueries = (selectedQuery, profileData) => {
    return profileData.filter(op => {
      // Match by collection and query type
      const sameCollection = op.ns === selectedQuery.ns || 
        (op.database === selectedQuery.database && op.collection === selectedQuery.collection);
      const sameType = op.queryType === selectedQuery.queryType || op.op === selectedQuery.op;
      
      // For query operations, try to match query pattern
      let similarQueryPattern = true;
      if (op.query && selectedQuery.query) {
        // Compare query field names (not values) to match similar query patterns
        const opQueryFields = Object.keys(op.query).sort().join(',');
        const selectedQueryFields = Object.keys(selectedQuery.query).sort().join(',');
        similarQueryPattern = opQueryFields === selectedQueryFields;
      }
      
      return sameCollection && sameType && similarQueryPattern;
    });
  };
  
  const handleApplySuggestion = (suggestion) => {
    // Update the local state to mark suggestion as applied
    const updatedSuggestions = suggestions.map(s => 
      s.id === suggestion.id ? { ...s, status: 'applied' } : s
    );
    setSuggestions(updatedSuggestions);
    
    // Store applied suggestions in localStorage for persistence
    const appliedSuggestions = JSON.parse(localStorage.getItem('appliedSuggestions') || '[]');
    appliedSuggestions.push({
      id: suggestion.id,
      queryId: query.id || JSON.stringify(query.query || {}),
      timestamp: new Date().toISOString(),
      suggestion
    });
    localStorage.setItem('appliedSuggestions', JSON.stringify(appliedSuggestions));
    
    // Call parent handler if provided
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };
  
  const handleDismissSuggestion = (suggestion) => {
    // Mark suggestion as dismissed
    const updatedSuggestions = suggestions.map(s => 
      s.id === suggestion.id ? { ...s, status: 'dismissed' } : s
    );
    setSuggestions(updatedSuggestions);
    
    // Store dismissed suggestions in localStorage for persistence
    const dismissedSuggestions = JSON.parse(localStorage.getItem('dismissedSuggestions') || '[]');
    dismissedSuggestions.push({
      id: suggestion.id,
      queryId: query.id || JSON.stringify(query.query || {}),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('dismissedSuggestions', JSON.stringify(dismissedSuggestions));
  };
  
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-yellow-500 animate-pulse" />
            <CardTitle>Generating AI Suggestions...</CardTitle>
          </div>
          <CardDescription>
            Analyzing query patterns and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-muted-foreground/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Our AI is analyzing your query performance...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
            <CardTitle>Error Generating Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          <CardTitle>AI-Powered Suggestions</CardTitle>
        </div>
        <CardDescription>
          {suggestions.length > 0 
            ? `${suggestions.length} optimization suggestions for better performance`
            : 'No optimization suggestions available for this query'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {suggestions.length > 0 && (
          <>
            <div className="px-6 py-2 bg-muted/50">
              <div className="text-sm font-medium text-muted-foreground">
                Impact Level:
                <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-500 border-red-200 dark:border-red-800">High</Badge>
                <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-200 dark:border-yellow-800">Medium</Badge>
                <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800">Low</Badge>
              </div>
            </div>
            <ScrollArea className="h-[400px] max-h-[60vh]">
              <div className="p-0">
                {suggestions.map((suggestion) => (
                  <Collapsible 
                    key={suggestion.id} 
                    open={openItems[suggestion.id]}
                    onOpenChange={() => toggleSuggestion(suggestion.id)}
                    className="border-b last:border-0"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/30 transition-colors">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`mr-3 ${getImpactColor(suggestion.impact)}`}
                        >
                          {suggestion.impact.charAt(0).toUpperCase() + suggestion.impact.slice(1)}
                        </Badge>
                        <div>
                          <span className="font-medium">{suggestion.title}</span>
                          {suggestion.status === 'applied' && (
                            <span className="ml-2 text-xs text-green-500 flex items-center inline">
                              <CheckCircle className="inline-block mr-1 h-3 w-3" /> Applied
                            </span>
                          )}
                          {suggestion.status === 'dismissed' && (
                            <span className="ml-2 text-xs text-muted-foreground flex items-center inline">
                              <XCircle className="inline-block mr-1 h-3 w-3" /> Dismissed
                            </span>
                          )}
                        </div>
                      </div>
                      {openItems[suggestion.id] ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.code && (
                          <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-auto mb-4">
                            <pre>{suggestion.code}</pre>
                          </div>
                        )}
                        {suggestion.status === 'suggested' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApplySuggestion(suggestion)}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Mark as Applied
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDismissSuggestion(suggestion)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
        {suggestions.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No optimization suggestions available for this query.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 