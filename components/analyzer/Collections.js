import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from './LoadingSpinner';
import { formatTime } from './utils';

// Green Pea color palette (only used for progress bars)
const greenPea = {
  50: '#ebfef5',
  500: '#05c484',
};

const Collections = ({ stats }) => {
  // Safety check - if collections data isn't populated, show loading indicator
  if (!stats || stats.byCollection?.length === 0) {
    return (
      <div className="p-4 text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Preparing collection data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {stats.byCollection.map((collection, i) => (
          <Card key={collection.name}>
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between items-center">
                  <span>{collection.name}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {collection.count} operations
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Total Time</div>
                  <div className="text-xl font-bold">{formatTime(collection.totalTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Average Time</div>
                  <div className="text-xl font-bold">{formatTime(collection.avgTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">% of Total</div>
                  <div className="text-xl font-bold">
                    {((collection.totalTime / stats.totalDuration) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="h-10 bg-[#ebfef5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#05c484] transition-all duration-300" 
                  style={{ 
                    width: `${Math.min(100, (collection.totalTime / stats.totalDuration) * 100)}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Collections; 