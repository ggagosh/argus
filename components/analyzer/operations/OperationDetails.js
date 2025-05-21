import React, { useState } from "react";
import {
  Database,
  FileText,
  Tag,
  Clock,
  Info,
  GitBranch,
  Copy,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import PerformanceAnalysis from "./PerformanceAnalysis";
import { ThemeAwareShikiHighlighter } from "../../ui/shiki-highlighter";

const OperationDetails = ({
  selectedOperation,
  formatTime,
  formatTimestamp,
}) => {
  if (!selectedOperation) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Select an operation</h3>
        <p className="text-muted-foreground">
          Select an operation from the list to view detailed information about
          it.
        </p>
      </div>
    );
  }

const [displayMode, setDisplayMode] = useState("json");

  const [copied, setCopied] = useState(false);

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          selectedOperation.query || selectedOperation.command,
          null,
          2
        )
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy query:", err);
    }
  };

  // Check if the operation contains a MongoDB pipeline
  const hasPipeline = selectedOperation?.command?.pipeline &&
    Array.isArray(selectedOperation.command.pipeline) &&
    selectedOperation.command.pipeline.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {selectedOperation.ns || "Unknown Collection"}
            </div>
            <Badge
              size="lg"
              variant="secondary"
              className="text-base px-3 py-1"
            >
              {formatTime(selectedOperation.millis || 0)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {selectedOperation.op === "query" || selectedOperation.op === "find"
              ? "Query operation to retrieve documents from the database"
              : selectedOperation.op === "update"
                ? "Update operation to modify existing documents"
                : selectedOperation.op === "insert"
                  ? "Insert operation to add new documents"
                  : selectedOperation.op === "remove" ||
                    selectedOperation.op === "delete"
                    ? "Delete operation to remove documents"
                    : selectedOperation.op === "command"
                      ? "Database command operation"
                      : "MongoDB operation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Tag className="h-4 w-4" /> Operation Type
                </h3>
                <p>{selectedOperation.op || "Unknown"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Timestamp
                </h3>
                <p>{formatTimestamp(selectedOperation.ts)}</p>
              </div>

              {selectedOperation.docsExamined !== undefined && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                    Documents Examined
                    <div className="group relative inline-block">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-xs rounded shadow-lg border z-50">
                        <p>
                          The total number of documents MongoDB had to scan to
                          complete this operation. A high number relative to
                          returned documents indicates an inefficient query or
                          missing index.
                        </p>
                      </div>
                    </div>
                  </h3>
                  <p>{selectedOperation.docsExamined.toLocaleString()}</p>
                </div>
              )}

              {selectedOperation.nreturned !== undefined && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                    Documents Returned
                    <div className="group relative inline-block">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-xs rounded shadow-lg border z-50">
                        <p>
                          The number of documents that matched the query
                          criteria and were returned to the client.
                        </p>
                      </div>
                    </div>
                  </h3>
                  <p>{selectedOperation.nreturned.toLocaleString()}</p>
                </div>
              )}

              {selectedOperation.keysExamined !== undefined && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                    Keys Examined
                    <div className="group relative inline-block">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-xs rounded shadow-lg border z-50">
                        <p>
                          The number of index keys scanned during the operation.
                          If this is close to 'Documents Examined', it suggests
                          good index usage.
                        </p>
                      </div>
                    </div>
                  </h3>
                  <p>{selectedOperation.keysExamined.toLocaleString()}</p>
                </div>
              )}

              {selectedOperation.planSummary && (
                <div>
                  <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                    Plan Summary
                    <div className="group relative inline-block">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-xs rounded shadow-lg border z-50">
                        <p>
                          <strong>IXSCAN</strong>: Uses an index, most efficient
                        </p>
                        <p>
                          <strong>COLLSCAN</strong>: Full collection scan,
                          inefficient for large collections
                        </p>
                        <p>
                          <strong>FETCH</strong>: Retrieves documents after
                          finding matches
                        </p>
                        <p>
                          <strong>SORT</strong>: In-memory sort, can be
                          expensive
                        </p>
                      </div>
                    </div>
                  </h3>
                  <Badge
                    variant={
                      selectedOperation.planSummary.includes("COLLSCAN")
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedOperation.planSummary}
                  </Badge>
                </div>
              )}
            </div>

            {/* Performance Analysis */}
            {selectedOperation.op === "command" &&
              selectedOperation.docsExamined !== undefined &&
              selectedOperation.nreturned !== undefined && (
                <PerformanceAnalysis
                  selectedOperation={selectedOperation}
                  formatTime={formatTime}
                />
              )}

            {/* Query */}
            {(selectedOperation.query || selectedOperation.command) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {selectedOperation.query ? "Query" : "Command"}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyQuery}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy Query"}
                  </Button>
                </div>

                {hasPipeline ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        Aggregation Pipeline
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {selectedOperation.command.pipeline.length} stage{selectedOperation.command.pipeline.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="relative">
                      <ThemeAwareShikiHighlighter
                        language="json"
                        delay={150}
                      >
                        {JSON.stringify(
                          selectedOperation.query || selectedOperation.command,
                          null,
                          2
                        )}
                      </ThemeAwareShikiHighlighter>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <ThemeAwareShikiHighlighter
                      language="json"
                      delay={150}
                    >
                      {JSON.stringify(
                        selectedOperation.query || selectedOperation.command,
                        null,
                        2
                      )}
                    </ThemeAwareShikiHighlighter>
                  </div>
                )}
              </div>
            )}

            {/* Raw Operation Data */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("raw-operation-data");
                  if (el) el.classList.toggle("hidden");
                }}
              >
                Show Raw Operation Data
              </Button>
              <div
                id="raw-operation-data"
                className="hidden mt-2"
              >
                <div className="relative">
                  <ThemeAwareShikiHighlighter
                    language="json"
                    delay={150}
                  >
                    {JSON.stringify(selectedOperation, null, 2)}
                  </ThemeAwareShikiHighlighter>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationDetails;
