import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import React from 'react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export interface LineChartProps {
  data: any
  options?: any
  className?: string
  width?: number
  height?: number
}

export const LineChart: React.FC<LineChartProps> = ({ data, options, className, width, height }) => {
  return (
    <div className={className} data-component="LineChart">
      <Line data={data} options={options} width={width} height={height} />
    </div>
  )
} 