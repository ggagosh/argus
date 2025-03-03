import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

const DebugInfo = ({ stats = {}, profileData = [], activeTab = '' }) => {
  // Only show in development environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-4 text-xs text-gray-500">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center text-gray-500 hover:text-gray-700 cursor-pointer">
          <span className="flex items-center">
            <svg 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
            Debug Info
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 bg-gray-100 p-4 rounded-md overflow-x-auto">
            <p>Profile Data Length: {profileData?.length || 0}</p>
            <p>Total Operations: {stats?.totalOperations || 0}</p>
            <p>Collections: {stats?.byCollection?.length || 0}</p>
            <p>Operation Types: {stats?.byOpType?.length || 0}</p>
            <p>Missing Indexes: {stats?.missingIndexes?.length || 0}</p>
            <p>Query Patterns: {stats?.queryPatterns?.length || 0}</p>
            <p>Active Tab: {activeTab || 'none'}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DebugInfo; 