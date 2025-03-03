import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from './LoadingSpinner';
import { formatTime } from './utils';

const QueryPatterns = ({ stats }) => {
  // Safety check - if data analysis is still in progress
  if (!stats || stats.totalOperations === 0) {
    return (
      <div className="p-4 text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Analyzing query patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats.queryPatterns?.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <div className="text-sm text-yellow-700">
              No query patterns were identified. This could be because the dataset is too small or there are no recurring patterns.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stats.queryPatterns?.map((pattern, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <div className="flex justify-between items-center">
                    <span>Pattern #{i+1}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {pattern.count} occurrences
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Time</div>
                    <div className="text-xl font-bold">{formatTime(pattern.totalTime)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Average Time</div>
                    <div className="text-xl font-bold">{formatTime(pattern.avgTime)}</div>
                  </div>
                </div>
                
                {pattern.examples.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Example Query:</div>
                    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(pattern.examples[0].query, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryPatterns; 