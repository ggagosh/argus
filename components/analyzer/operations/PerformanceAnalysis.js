import React, { useState, useEffect } from "react";
import { Info, AlertCircle, Brain, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import ShikiHighlighter from "react-shiki";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

const PerformanceAnalysis = ({ selectedOperation, formatTime }) => {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiEnabled, setAIEnabled] = useState(false);
  const [checkingAI, setCheckingAI] = useState(true);

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await fetch('/api/check-ai-status');
        const data = await response.json();
        setAIEnabled(data.enabled);
      } catch (error) {
        console.error('Failed to check AI status:', error);
        setAIEnabled(false);
      } finally {
        setCheckingAI(false);
      }
    };

    checkAIStatus();
  }, []);

  const {
    object: aiAnalysis,
    isLoading,
    error,
    submit,
    stop,
  } = useObject({
    api: "/api/analyze-operation",
    schema: z.object({
      performanceAnalysis: z.array(
        z.object({
          type: z.enum(["info", "warning", "danger"]),
          message: z.string(),
        })
      ),
      suggestedIndexes: z.array(
        z.object({
          index: z.string(),
          message: z.string(),
        })
      ),
      suggestedQuery: z.string(),
    }),
    onError: (error) => {
      console.error("Error during analysis:", error);
    },
  });

  const analyzeOperation = async () => {
    try {
      setShowAIAnalysis(true);
      stop(); // Stop any ongoing analysis
      await submit({ operation: selectedOperation });
    } catch (err) {
      console.error("Error during analysis:", err);
    }
  };

  const renderDefaultAnalysis = () => (
    <div className="space-y-3">
      {/* Scan Ratio Analysis */}
      {selectedOperation.docsExamined > 0 &&
        selectedOperation.nreturned > 0 && (
          <div className="flex items-start gap-2">
            {selectedOperation.docsExamined /
              Math.max(1, selectedOperation.nreturned) >
            10 ? (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            ) : selectedOperation.docsExamined /
                Math.max(1, selectedOperation.nreturned) >
              3 ? (
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-medium">
                Scan Ratio:{" "}
                {(
                  selectedOperation.docsExamined /
                  Math.max(1, selectedOperation.nreturned)
                ).toFixed(1)}
                :1
              </h4>
              <p className="text-xs text-muted-foreground">
                {selectedOperation.docsExamined /
                  Math.max(1, selectedOperation.nreturned) >
                10
                  ? `High scan ratio: MongoDB had to examine ${selectedOperation.docsExamined.toLocaleString()} documents to return only ${selectedOperation.nreturned.toLocaleString()} results. Consider creating an index on the fields used in your query filters.`
                  : selectedOperation.docsExamined /
                      Math.max(1, selectedOperation.nreturned) >
                    3
                  ? `Moderate scan ratio: Examining ${selectedOperation.docsExamined.toLocaleString()} documents for ${selectedOperation.nreturned.toLocaleString()} results could be improved with better indexes.`
                  : `Good scan ratio: MongoDB only needed to examine ${selectedOperation.docsExamined.toLocaleString()} documents to return ${selectedOperation.nreturned.toLocaleString()} results.`}
              </p>
            </div>
          </div>
        )}

      {/* Plan Summary Analysis */}
      {selectedOperation.planSummary && (
        <div className="flex items-start gap-2">
          {selectedOperation.planSummary.includes("COLLSCAN") ? (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-medium">Query Execution Plan</h4>
            <p className="text-xs text-muted-foreground">
              {selectedOperation.planSummary.includes("COLLSCAN")
                ? `Collection scan detected (${selectedOperation.planSummary}): MongoDB had to scan the entire collection to find matching documents. This is inefficient for large collections and will get slower as the collection grows. Consider adding an appropriate index for this query pattern.`
                : selectedOperation.planSummary.includes("IXSCAN")
                ? `Using index scan (${selectedOperation.planSummary}): Your query is using an index efficiently.`
                : `Execution plan: ${selectedOperation.planSummary}`}
            </p>
          </div>
        </div>
      )}

      {/* Duration Analysis */}
      <div className="flex items-start gap-2">
        {selectedOperation.millis > 100 ? (
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : selectedOperation.millis > 50 ? (
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        )}
        <div>
          <h4 className="text-sm font-medium">
            Query Duration: {formatTime(selectedOperation.millis)}
          </h4>
          <p className="text-xs text-muted-foreground">
            {selectedOperation.millis > 100
              ? `Slow operation: This query took longer than 100ms to execute, which could impact application performance, especially under load.`
              : selectedOperation.millis > 50
              ? `Moderate duration: This query completed in ${formatTime(
                  selectedOperation.millis
                )}, which is acceptable but could be improved.`
              : `Fast operation: This query completed quickly in ${formatTime(
                  selectedOperation.millis
                )}.`}
          </p>
        </div>
      </div>

      {/* Overall Assessment */}
      {(!selectedOperation.planSummary ||
        !selectedOperation.planSummary.includes("COLLSCAN")) &&
        selectedOperation.docsExamined /
          Math.max(1, selectedOperation.nreturned) <=
          3 &&
        selectedOperation.millis <= 50 && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded text-green-800 dark:text-green-400 text-xs">
            <p className="font-medium">
              ✓ This query is performing well with the current indexes and
              configuration.
            </p>
          </div>
        )}

      {/* Improvement Suggestions */}
      {(selectedOperation.planSummary &&
        selectedOperation.planSummary.includes("COLLSCAN")) ||
      selectedOperation.docsExamined /
        Math.max(1, selectedOperation.nreturned) >
        10 ||
      selectedOperation.millis > 100 ? (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">
            Suggestions for Improvement:
          </h4>
          <ul className="text-xs space-y-1 list-disc pl-4">
            {selectedOperation.planSummary &&
              selectedOperation.planSummary.includes("COLLSCAN") && (
                <li>
                  Create an index on the fields used in the query filter to
                  avoid full collection scans
                </li>
              )}
            {selectedOperation.docsExamined /
              Math.max(1, selectedOperation.nreturned) >
              10 && (
              <li>
                Improve index selection to reduce the number of documents that
                need to be examined
              </li>
            )}
            {selectedOperation.millis > 100 && (
              <li>
                Consider adding more specific indexes or refining your query to
                improve execution time
              </li>
            )}
            {selectedOperation.planSummary &&
              selectedOperation.planSummary.includes("SORT") && (
                <li>
                  Add an index with the appropriate sort order to avoid
                  in-memory sorting
                </li>
              )}
            <li>
              Review your query pattern to see if it can be optimized or
              restructured
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );

  const renderAIAnalysis = () => (
    <div className="space-y-3">
      {/* Performance Analysis Items */}
      {aiAnalysis?.performanceAnalysis?.map((analysis, index) => {
        if (!analysis?.type || !analysis?.message) return null;
        
        return (
          <div key={index} className="flex items-start gap-2">
            {analysis.type === "danger" ? (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            ) : analysis.type === "warning" ? (
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-medium">Performance {analysis.type === "danger" ? "Issue" : analysis.type === "warning" ? "Warning" : "Info"}</h4>
              <p className="text-xs text-muted-foreground">{analysis.message}</p>
            </div>
          </div>
        );
      })}

      {/* Overall Assessment for good performance */}
      {aiAnalysis?.performanceAnalysis?.length > 0 && 
       aiAnalysis.performanceAnalysis.every((a) => a?.type === "info") && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded text-green-800 dark:text-green-400 text-xs">
          <p className="font-medium">
            ✓ This query is performing well according to AI analysis.
          </p>
        </div>
      )}

      {/* Suggested Improvements Section */}
      {(aiAnalysis?.suggestedIndexes?.length > 0 ||
        aiAnalysis?.suggestedQuery) && (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">
            Suggestions for Improvement:
          </h4>
          <ul className="text-xs space-y-3 list-disc pl-4">
            {aiAnalysis?.suggestedIndexes?.map((index, i) => (
              <li key={i}>
                <div className="text-muted-foreground mb-1">{index.message}</div>
                <div className="relative">
                  <ShikiHighlighter
                    language="javascript"
                    theme="houston"
                    delay={150}
                  >
                    {index.index}
                  </ShikiHighlighter>
                </div>
              </li>
            ))}
            {aiAnalysis?.suggestedQuery && (
              <li>
                <div>Optimize query structure:</div>
                <div className="mt-1 relative">
                  <ShikiHighlighter
                    language="javascript"
                    theme="houston"
                    delay={150}
                  >
                    {aiAnalysis.suggestedQuery}
                  </ShikiHighlighter>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 rounded-md bg-muted">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium flex items-center gap-1">
          Performance Analysis
          <div className="group relative inline-block">
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-xs rounded shadow-lg border z-50">
              <p>
                This analysis identifies potential performance issues based on
                MongoDB best practices and performance metrics.
              </p>
            </div>
          </div>
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeOperation}
                  disabled={isLoading || checkingAI || !aiEnabled}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!aiEnabled && !checkingAI && (
              <TooltipContent>
                <p>AI analysis is not available. Please configure your Anthropic API key.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
          Error analyzing operation. Please try again.
        </div>
      )}

      {showAIAnalysis && aiAnalysis
        ? renderAIAnalysis()
        : renderDefaultAnalysis()}
    </div>
  );
};

export default PerformanceAnalysis;
