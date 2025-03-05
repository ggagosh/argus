import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';

const Uploader = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [isFileReady, setIsFileReady] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = async (file) => {
    if (!file) return;
    
    setFileError(null);
    setIsFileReady(false);
    setSelectedFile(file);
    
    // Check file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setFileError('Please upload a JSON file');
      return;
    }
    
    // Validate file content
    setIsValidating(true);
    setValidationProgress(10);
    
    try {
      // Read the file
      const fileContent = await readFileAsync(file);
      setValidationProgress(40);
      
      // Parse JSON
      const jsonData = JSON.parse(fileContent);
      setValidationProgress(60);
      
      // Validate it's an array
      if (!Array.isArray(jsonData)) {
        setFileError('The file must contain a JSON array of MongoDB profiler data');
        setIsValidating(false);
        return;
      }
      
      // Validate it has some expected MongoDB profiler fields
      if (jsonData.length === 0) {
        setFileError('The MongoDB profiler data array is empty');
        setIsValidating(false);
        return;
      }
      
      // Check for at least some expected MongoDB profiler fields in the first few records
      const sampleSize = Math.min(5, jsonData.length);
      let validProfilerItems = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        const item = jsonData[i];
        // Check for common MongoDB profiler fields
        if (item.op || item.ns || item.command || item.millis) {
          validProfilerItems++;
        }
      }
      
      setValidationProgress(80);
      
      if (validProfilerItems === 0) {
        setFileError('The file does not appear to contain valid MongoDB profiler data');
        setIsValidating(false);
        return;
      }
      
      // Success - prepare the data for the parent component
      setValidationProgress(100);
      setTimeout(() => {
        setIsValidating(false);
        setIsFileReady(true);
        
        // Create custom event object with the jsonData
        const customEvent = { jsonData };
        onFileUpload(customEvent);
      }, 500);
      
    } catch (err) {
      console.error('Error validating file:', err);
      setFileError(`Error processing file: ${err.message}`);
      setIsValidating(false);
    }
  };
  
  const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  return (
    <div className="w-full">
      <div 
        className={`
          border-2 border-dashed rounded-lg p-10 text-center
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isFileReady ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-800' : ''}
          transition-colors duration-150 ease-in-out
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isFileReady ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
              File Ready for Analysis
            </h3>
            <p className="text-green-600 dark:text-green-500 mb-4">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          </div>
        ) : isValidating ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <FileJson className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Validating MongoDB Profiler Data
            </h3>
            <div className="w-full max-w-xs mb-2">
              <Progress value={validationProgress} className="h-2" />
            </div>
            <p className="text-muted-foreground text-sm">
              Checking file format and content...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Upload MongoDB Profiler Data
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Drag and drop your MongoDB profiler JSON file here, or click the button below to browse.
            </p>
            <Button onClick={handleBrowseClick} className="mb-2">
              Browse Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".json,application/json"
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Accepts JSON files exported from MongoDB profiler
            </p>
          </div>
        )}
      </div>
      
      {fileError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Uploader; 