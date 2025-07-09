import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import React from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export interface BarChartProps {
  data: any
  options?: any
  className?: string
  width?: number
  height?: number
}

export const BarChart: React.FC<BarChartProps> = ({ data, options, className, width, height }) => {
  return (
    <div className={className} data-component="BarChart">
      <Bar data={data} options={options} width={width} height={height} />
    </div>
  )
} 