import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Processing Data</AlertTitle>
      <AlertDescription>
        <div className="mt-2">{error}</div>
        <div className="mt-4">
          <p className="text-sm">Try these troubleshooting steps:</p>
          <ul className="text-sm list-disc ml-6 mt-2">
            <li>Check that the file is valid JSON format</li>
            <li>Verify the data follows MongoDB profiler format with fields like 'op', 'ns', and 'millis'</li>
            <li>Check the browser console for more detailed error information</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay; 