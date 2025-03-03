import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { formatTime } from './utils';
import ShikiHighlighter from 'react-shiki';

const IndexSuggestions = ({ stats }) => {
  // Safety check - if data analysis is still in progress
  if (!stats || stats.totalOperations === 0) {
    return (
      <div className="p-4 text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Analyzing index usage...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats.missingIndexes?.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <div className="text-sm text-yellow-700">
              No index suggestions found. Either no slow queries were detected or the queries already use optimal indexes.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stats.missingIndexes?.map((item, i) => (
            <Card key={`${item.ns}-${i}`}>
              <CardHeader>
                <CardTitle>
                  <div className="flex justify-between items-center">
                    <span>{item.ns}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {formatTime(item.millis)}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {item.docsExamined && (
                    <div>
                      <div className="text-sm text-gray-500">Docs Examined</div>
                      <div className="text-xl font-bold">{item.docsExamined.toLocaleString()}</div>
                    </div>
                  )}
                  
                  {item.nreturned && (
                    <div>
                      <div className="text-sm text-gray-500">Docs Returned</div>
                      <div className="text-xl font-bold">{item.nreturned.toLocaleString()}</div>
                    </div>
                  )}
                  
                  {item.scanRatio && (
                    <div>
                      <div className="text-sm text-gray-500">Scan Ratio</div>
                      <div className="text-xl font-bold">{item.scanRatio.toFixed(1)}:1</div>
                    </div>
                  )}
                </div>
                
                {item.planSummary && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Plan Summary</div>
                    <div className="text-sm p-2 bg-gray-100 rounded-md">{item.planSummary}</div>
                  </div>
                )}
                
                {item.fields.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Suggested Index Fields</div>
                    <div className="flex flex-wrap gap-2">
                      {item.fields.map((field, j) => (
                        <Badge key={j} variant="secondary">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Query</div>
                  <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs">
                  <ShikiHighlighter
                    language="json"
                    theme="houston"
                    delay={150}
                  >
                      {JSON.stringify(item.query, null, 2)}
                    </ShikiHighlighter>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IndexSuggestions; 