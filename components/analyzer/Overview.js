import React from 'react';
import { Database, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LoadingSpinner } from './LoadingSpinner';
import { formatTime } from './utils';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Overview = ({ stats }) => {
  // Safety check - if stats aren't populated fully, show loading indicator
  if (!stats || stats.totalOperations === 0 || !stats.byOpType?.length) {
    return (
      <div className="p-4 text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Preparing visualizations...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Summary stats */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Operations</div>
                <div className="text-2xl font-bold">{stats.totalOperations?.toLocaleString() || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Duration</div>
                <div className="text-2xl font-bold">{formatTime(stats.totalDuration)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Average Duration</div>
                <div className="text-2xl font-bold">{formatTime(stats.avgDuration)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Max Duration</div>
                <div className="text-2xl font-bold">{formatTime(stats.maxDuration)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Operation Types Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Operations by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {stats.byOpType?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byOpType}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.byOpType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No operation types data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Collections Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Collections by Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {stats.byCollection?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.byCollection.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatTime(value)} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(value) => [formatTime(value), 'Total Time']} />
                  <Bar dataKey="totalTime" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No collections data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview; 