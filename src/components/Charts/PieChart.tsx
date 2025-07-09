import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import React from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

export interface PieChartProps {
  data: any
  options?: any
  className?: string
  width?: number
  height?: number
}

export const PieChart: React.FC<PieChartProps> = ({ data, options, className, width, height }) => {
  return (
    <div className={className} data-component="PieChart">
      <Pie data={data} options={options} width={width} height={height} />
    </div>
  )
} 