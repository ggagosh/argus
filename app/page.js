"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HelpCircle, ArrowRight, Github, Upload, Database } from "lucide-react";
import Uploader from "@/components/analyzer/Uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from '@/components/ui/header';

export default function Home() {
  const router = useRouter();
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPreviousData, setIsPreviousData] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing data on component mount
  useEffect(() => {
    const existingData = localStorage.getItem("mongoProfileData");
    if (existingData) {
      try {
        const parsedData = JSON.parse(existingData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setUploadedData(parsedData);
          setUploadSuccess(true);
          setIsPreviousData(true);
          console.log(
            "Found existing MongoDB profile data with",
            parsedData.length,
            "operations"
          );
        } else {
          console.log("Invalid data format in localStorage");
          localStorage.removeItem("mongoProfileData");
        }
      } catch (error) {
        console.error("Error parsing stored data:", error);
        localStorage.removeItem("mongoProfileData");
      }
    }
  }, []);

  const handleFileUpload = (event) => {
    try {
      console.log("File upload event received");

      // For direct file data from Uploader component
      if (event.jsonData) {
        console.log("Received direct JSON data from uploader");
        setUploadedData(event.jsonData);
        setUploadSuccess(true);
        setIsPreviousData(false);
        localStorage.setItem(
          "mongoProfileData",
          JSON.stringify(event.jsonData)
        );
        return;
      }

      // For traditional file upload handling
      const file = event.target?.files?.[0];
      if (!file) {
        setError("No file found. Please select a file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data) && data.length > 0) {
            setUploadedData(data);
            setUploadSuccess(true);
            setIsPreviousData(false);
            localStorage.setItem("mongoProfileData", JSON.stringify(data));
            console.log("Data successfully loaded from file");
          } else {
            setError(
              "Invalid MongoDB profiler data format. Please upload valid JSON array data."
            );
          }
        } catch (err) {
          console.error("Error parsing JSON:", err);
          setError(`Error parsing JSON: ${err.message}`);
        }
      };

      reader.onerror = () => {
        setError("Error reading file");
      };

      reader.readAsText(file);
    } catch (err) {
      console.error("Error in handleFileUpload:", err);
      setError(`Error uploading file: ${err.message}`);
    }

    console.log("Upload success state:", uploadSuccess);
  };

  const handleClearData = () => {
    localStorage.removeItem("mongoProfileData");
    setUploadedData(null);
    setUploadSuccess(false);
    setIsPreviousData(false);
    setError(null);
  };

  const handleProceedToAnalysis = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="px-4 py-12 md:py-16 lg:py-20 max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              MongoDB Slow Query Analyzer
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload your MongoDB profiler data and get actionable insights to
              optimize performance.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              {uploadSuccess && !isPreviousData ? (
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mb-4">
                        <Database className="h-8 w-8 text-green-700 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        MongoDB Profile Data Uploaded
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {uploadedData?.length} operations loaded successfully.
                        You're ready to analyze your queries!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="gap-2"
                          size="lg"
                          onClick={handleProceedToAnalysis}
                        >
                          Analyze Queries <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          size="lg"
                          onClick={handleClearData}
                        >
                          Upload Different Data <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isPreviousData ? (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3 mb-4">
                        <Database className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Using Previously Uploaded Data
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {uploadedData?.length} operations from your previous
                        session are available for analysis.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="gap-2"
                          size="lg"
                          onClick={handleProceedToAnalysis}
                        >
                          Continue Analysis <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          size="lg"
                          onClick={handleClearData}
                        >
                          Upload New Data <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Uploader onFileUpload={handleFileUpload} />
              )}
            </div>

            <div className="md:col-span-1">
              <Card className="rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1.5">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-lg font-medium">Instructions</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium mb-2">
                        How to get MongoDB profiler data:
                      </h3>
                      <ol className="space-y-1.5">
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>1.</span>
                          <span>Enable profiling in MongoDB</span>
                        </li>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>2.</span>
                          <span>Run your application or queries</span>
                        </li>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>3.</span>
                          <span>Export profiler data using</span>
                        </li>
                        <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-0.5 rounded ml-4 mt-0.5 mb-1.5 block text-xs">
                          db.system.profile.find()
                        </code>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>4.</span>
                          <span>Save the JSON output and upload here</span>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-base font-medium mb-2">
                        What you'll get:
                      </h3>
                      <ul className="space-y-1.5">
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>•</span>
                          <span>Performance analysis of slow queries</span>
                        </li>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>•</span>
                          <span>Index usage statistics</span>
                        </li>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>•</span>
                          <span>Query optimization recommendations</span>
                        </li>
                        <li className="flex gap-2 text-gray-600 text-sm">
                          <span>•</span>
                          <span>Interactive visualizations</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
