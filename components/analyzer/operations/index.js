import React, { useState, useEffect } from 'react';
import OperationsList from './OperationsList';
import OperationDetails from './OperationDetails';
import { formatTime } from '../utils';

const Operations = ({ profileData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpType, setSelectedOpType] = useState('all');
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [sortBy, setSortBy] = useState('duration');
  const [sortOrder, setSortOrder] = useState('desc');

  // Define available operation types from the data
  const operationTypes = [
    'all',
    ...new Set(profileData.map((op) => op.op || 'unknown').filter(Boolean)),
  ];

  // Helper function to format MongoDB timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';

    // Handle MongoDB extended JSON format with $date
    if (typeof timestamp === 'object' && timestamp.$date) {
      const dateValue =
        typeof timestamp.$date === 'string'
          ? new Date(timestamp.$date)
          : new Date(timestamp.$date);
      return dateValue.toLocaleString();
    }

    // Handle regular date strings
    if (typeof timestamp === 'string') {
      try {
        return new Date(timestamp).toLocaleString();
      } catch (e) {
        return timestamp;
      }
    }

    // If it's already a number (milliseconds), convert to date
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString();
    }

    return String(timestamp);
  };

  // Filter and sort operations when any filter changes
  useEffect(() => {
    const filtered = profileData.filter((op) => {
      if (selectedOpType !== 'all' && op.op !== selectedOpType) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const ns = (op.ns || '').toLowerCase();
        const queryStr = JSON.stringify(
          op.query || op.command || {}
        ).toLowerCase();
        if (!ns.includes(searchLower) && !queryStr.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'duration') {
        const valA = a.millis || 0;
        const valB = b.millis || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'timestamp') {
        let valA, valB;
        if (a.ts && typeof a.ts === 'object' && a.ts.$date) {
          valA =
            typeof a.ts.$date === 'string'
              ? new Date(a.ts.$date).getTime()
              : a.ts.$date;
        } else {
          valA = a.ts ? new Date(a.ts).getTime() : 0;
        }
        if (b.ts && typeof b.ts === 'object' && b.ts.$date) {
          valB =
            typeof b.ts.$date === 'string'
              ? new Date(b.ts.$date).getTime()
              : b.ts.$date;
        } else {
          valB = b.ts ? new Date(b.ts).getTime() : 0;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    setFilteredOperations(sorted);
  }, [profileData, searchTerm, selectedOpType, sortBy, sortOrder]);

  const handleOperationSelect = (operation) => {
    setSelectedOperation(operation);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <OperationsList
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOpType={selectedOpType}
          setSelectedOpType={setSelectedOpType}
          operationTypes={operationTypes}
          filteredOperations={filteredOperations}
          selectedOperation={selectedOperation}
          handleOperationSelect={handleOperationSelect}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          formatTime={formatTime}
        />
        <div className="md:col-span-3">
          <OperationDetails
            selectedOperation={selectedOperation}
            formatTime={formatTime}
            formatTimestamp={formatTimestamp}
          />
        </div>
      </div>
    </div>
  );
};

export default Operations; 