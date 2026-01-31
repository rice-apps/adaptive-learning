'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  score: number;
}

// Function to determine bar color based on score
const getBarColor = (score: number): string => {
  if (score >= 75) return '#ABFF2C'; // Green for high performance
  if (score >= 50) return '#f29e5a'; // Orange for medium performance
  return '#f26b5a'; // Red for low performance
};

export default function StudentProficiencyChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProficiencyData = async () => {
      try {
        const response = await fetch('/api/educator/proficiency');
        const result = await response.json();
        
        if (result.data) {
          setChartData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch proficiency data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProficiencyData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}