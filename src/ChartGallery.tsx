import React, { useEffect, useState } from 'react'
import { LineChart, BarChart, PieChart, ScatterChart, HistogramChart } from './components/Charts'
import { getCssVarValue } from './lib/utils'

const chartVarNames = [
  '--color-chart-1',
  '--color-chart-2',
  '--color-chart-3',
  '--color-chart-4',
  '--color-chart-5',
  '--color-chart-6',
  '--color-chart-7',
  '--color-chart-8',
]

export const ChartGallery: React.FC = () => {
  const [palette, setPalette] = useState<string[]>(['#0057FF', '#00B8D9', '#FFAB00', '#FF5630', '#36B37E', '#FFD600', '#003049', '#00CFEA'])

  useEffect(() => {
    const resolved = chartVarNames.map(getCssVarValue)
    if (resolved.every(Boolean)) setPalette(resolved)
  }, [])

  // Line chart with two lines, solid point markers
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [120, 190, 300, 500, 200, 300],
        borderColor: palette[0],
        backgroundColor: palette[0] + '20',
        pointBackgroundColor: palette[0],
        pointBorderColor: palette[0],
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
      {
        label: 'Profit',
        data: [100, 150, 250, 400, 180, 250],
        borderColor: palette[1],
        backgroundColor: palette[1] + '20',
        pointBackgroundColor: palette[1],
        pointBorderColor: palette[1],
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
    ],
  }
  const lineOptions = {
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { grid: { display: false } },
    },
  }

  // Bar chart: no x grid, no legend
  const barData = {
    labels: ['A', 'B', 'C', 'D', 'E'],
    datasets: [
      {
        label: 'Count',
        data: [12, 19, 3, 5, 2],
        backgroundColor: palette,
      },
    ],
  }
  const barOptions = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
    },
  }

  // Pie chart (unchanged)
  const pieData = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Orange'],
    datasets: [
      {
        label: 'Votes',
        data: [10, 20, 30, 15, 25],
        backgroundColor: palette,
      },
    ],
  }

  // Scatter chart (unchanged)
  const scatterData = {
    datasets: [
      {
        label: 'Scatter Dataset',
        data: [
          { x: -10, y: 0 },
          { x: 0, y: 10 },
          { x: 10, y: 5 },
          { x: 0.5, y: 5.5 },
        ],
        backgroundColor: palette[1],
      },
    ],
  }

  // Histogram: one color, no legend, no x grid
  const histogramData = {
    labels: ['0-10', '10-20', '20-30', '30-40', '40-50'],
    datasets: [
      {
        label: 'Frequency',
        data: [2, 5, 8, 3, 1],
        backgroundColor: palette[2],
      },
    ],
  }
  const histogramOptions = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
    },
  }

  return (
    <div className="p-8 max-w-5xl mx-auto" data-component="ChartGallery">
      <h1 className="text-2xl font-bold mb-2" data-component="ChartGalleryTitle">Chart Gallery</h1>
      <p className="text-gray-600 mb-8" data-component="ChartGalleryDescription">
        Preview all supported chart types styled with Canva design tokens and data viz palette.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div data-component="ChartCard">
          <h2 className="font-semibold mb-2">Line Chart (Multi-line)</h2>
          <LineChart data={lineData} options={lineOptions} />
        </div>
        <div data-component="ChartCard">
          <h2 className="font-semibold mb-2">Bar Chart</h2>
          <BarChart data={barData} options={barOptions} />
        </div>
        <div data-component="ChartCard">
          <h2 className="font-semibold mb-2">Pie Chart</h2>
          <PieChart data={pieData} />
        </div>
        <div data-component="ChartCard">
          <h2 className="font-semibold mb-2">Scatter Chart</h2>
          <ScatterChart data={scatterData} />
        </div>
        <div data-component="ChartCard">
          <h2 className="font-semibold mb-2">Histogram</h2>
          <HistogramChart data={histogramData} options={histogramOptions} />
        </div>
      </div>
    </div>
  )
} 