import React from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';

const OperationsList = ({
  searchTerm,
  setSearchTerm,
  selectedOpType,
  setSelectedOpType,
  operationTypes,
  filteredOperations,
  selectedOperation,
  handleOperationSelect,
  sortBy,
  sortOrder,
  handleSort,
  formatTime,
}) => {
  return (
    <div className="md:col-span-1 border rounded-lg overflow-hidden">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Filter className="h-4 w-4 mt-2.5" />
          <select
            value={selectedOpType}
            onChange={(e) => setSelectedOpType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
          >
            {operationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Header */}
      <div className="px-4 py-3 border-b bg-muted flex justify-between text-sm font-medium">
        <button
          onClick={() => handleSort("duration")}
          className={`flex items-center gap-1 ${
            sortBy === "duration"
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          Duration {sortBy === "duration" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("timestamp")}
          className={`flex items-center gap-1 ${
            sortBy === "timestamp"
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          Time {sortBy === "timestamp" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* Operations List */}
      <div className="max-h-[700px] overflow-y-auto">
        {filteredOperations.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No operations match the current filters
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOperations.map((op, index) => {
              // Determine badge variant based on operation type
              let badgeVariant = "outline";
              if (op.op === "query" || op.op === "find") badgeVariant = "default";
              else if (op.op === "update") badgeVariant = "secondary";
              else if (op.op === "insert") badgeVariant = "success";
              else if (op.op === "remove" || op.op === "delete")
                badgeVariant = "destructive";
              else if (op.op === "command") badgeVariant = "outline";

              return (
                <div
                  key={index}
                  onClick={() => handleOperationSelect(op)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedOperation === op
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-accent border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between mb-1 items-center">
                    <Badge variant={badgeVariant} className="font-medium">
                      {op.op || "unknown"}
                    </Badge>
                    <span className="font-mono text-sm font-medium">
                      {formatTime(op.millis || 0)}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {op.ns || "unknown"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsList; 