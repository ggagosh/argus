import React from 'react';
import { Database, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LoadingSpinner } from './LoadingSpinner';
import { formatTime } from './utils';

// Green Pea color palette
const greenPea = {
  50: '#ebfef5',
  100: '#cefde5',
  200: '#a2f8cf',
  300: '#66efb8',
  400: '#29de9b',
  500: '#05c484',
  600: '#00a06c',
  700: '#008059',
  800: '#00684a',
  900: '#01533c',
  950: '#002f23',
};

// Chart configuration
const chartConfig = {
  operations: {
    label: "Operations",
    color: greenPea[500],
  },
  time: {
    label: "Time",
    color: greenPea[600],
  },
  query: {
    label: "Query",
    color: greenPea[400],
  },
  update: {
    label: "Update",
    color: greenPea[500],
  },
  insert: {
    label: "Insert",
    color: greenPea[600],
  },
  remove: {
    label: "Remove",
    color: greenPea[700],
  },
  command: {
    label: "Command",
    color: greenPea[800],
  },
};

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
              <div className="bg-[#ebfef5] p-3 rounded-full">
                <Database className="w-6 h-6 text-[#05c484]" />
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
              <div className="bg-[#cefde5] p-3 rounded-full">
                <Clock className="w-6 h-6 text-[#00a06c]" />
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
              <div className="bg-[#ebfef5] p-3 rounded-full">
                <Clock className="w-6 h-6 text-[#008059]" />
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
              <div className="bg-[#cefde5] p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-[#00684a]" />
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
          <div className="h-[300px]">
            {stats.byOpType?.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full">
                <PieChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                  <Pie
                    data={stats.byOpType}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {stats.byOpType.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(greenPea)[Math.min(4 + index, 9)]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
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
          <div className="h-[300px]">
            {stats.byCollection?.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full">
                <BarChart
                  data={stats.byCollection.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatTime(value)} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="totalTime" 
                    fill={greenPea[500]}
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
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