import { Scatter, Bubble } from 'react-chartjs-2'
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend, Title } from 'chart.js'
import React from 'react'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title)

export interface ScatterChartProps {
  data: any
  options?: any
  className?: string
  width?: number
  height?: number
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ data, options, className, width, height }) => {
  // If any data point has an 'r' property, use Bubble chart type
  const isBubble = data?.datasets?.some((ds: any) => ds.data?.some((pt: any) => typeof pt.r === 'number'));
  const ChartComponent = isBubble ? Bubble : Scatter;
  return (
    <div className={className} data-component="ScatterChart">
      <ChartComponent data={data} options={options} width={width} height={height} />
    </div>
  )
} 