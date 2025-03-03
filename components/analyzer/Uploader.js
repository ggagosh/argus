import React from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '../ui/button';

const Uploader = ({ onFileUpload, onUseSampleData }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-10 flex flex-col items-center justify-center text-center">
      <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Upload MongoDB Profile Data</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Select a JSON file containing MongoDB profiler data to analyze slow queries and performance issues.
      </p>
      <div className="relative mb-6">
        <input
          type="file"
          accept=".json"
          onChange={onFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="default" size="lg">
          Select File
        </Button>
      </div>
      
      <div className="border-t border-gray-200 w-full pt-6 mt-2">
        <p className="text-gray-500 mb-4 text-sm">
          Don't have MongoDB profile data? Try our sample data to see how the tool works.
        </p>
        <Button 
          onClick={onUseSampleData}
          variant="outline"
          size="sm"
        >
          Use Sample Data
        </Button>
      </div>
    </div>
  );
};

export default Uploader; 