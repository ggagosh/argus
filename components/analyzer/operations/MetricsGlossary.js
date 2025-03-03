import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const MetricsGlossary = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          MongoDB Performance Metrics Explained
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-1">Documents Examined</h3>
            <p className="text-xs text-muted-foreground">
              The total number of documents MongoDB had to inspect to fulfill the
              query. In an ideal scenario, this number should be close to the
              number of documents returned.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Keys Examined</h3>
            <p className="text-xs text-muted-foreground">
              The number of index entries MongoDB scanned. When an index is used
              efficiently, this number is typically close to the documents
              examined count.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Scan Ratio</h3>
            <p className="text-xs text-muted-foreground">
              The ratio between documents examined and documents returned. A high
              ratio (&gt;10:1) indicates inefficient queries that might benefit
              from better indexes.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">COLLSCAN vs IXSCAN</h3>
            <p className="text-xs text-muted-foreground">
              COLLSCAN means MongoDB scanned the entire collection, which is
              inefficient for large datasets. IXSCAN means an index was used,
              which is much faster for selective queries.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Query Duration</h3>
            <p className="text-xs text-muted-foreground">
              The time taken to execute the operation in milliseconds. Operations
              over 100ms are considered slow and may impact application
              performance.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Plan Summary</h3>
            <p className="text-xs text-muted-foreground">
              A high-level description of how MongoDB executed the query. It
              provides insights into whether indexes were used and how the data
              was accessed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsGlossary; 