import { useState } from 'react'
import './App.css'
import { DataUpload } from './components/DataUpload/DataUpload'
import { PromptInput } from './components/MagicInsights/PromptInput'
import type { Dataset, UserPrompt, Insight } from './types'
import { analyzeDataset } from './utils/dataAnalysis'
import { ChartGallery } from './ChartGallery'
import { MagicCharts } from './MagicCharts'

function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [showChartGallery, setShowChartGallery] = useState(false)
  const [nav, setNav] = useState<'insights' | 'gallery' | 'magiccharts'>('insights')

  const currentDataset = datasets.find(d => d.id === currentDatasetId) || null

  const handleDataUpload = (dataset: Dataset) => {
    setDatasets(prev => [...prev, dataset])
    setCurrentDatasetId(dataset.id)
    setError(null)
    setShowUpload(false)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handlePromptSubmit = (prompt: UserPrompt) => {
    if (!currentDataset) return
    setIsProcessing(true)
    setInsights([])
    // Simulate processing time
    setTimeout(() => {
      const generatedInsights = analyzeDataset(currentDataset, prompt)
      setInsights(generatedInsights)
      setIsProcessing(false)
    }, 1200)
  }

  const removeDataset = (datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId))
    if (currentDatasetId === datasetId) {
      setCurrentDatasetId(datasets.length > 1 ? datasets[0]?.id || null : null)
    }
  }

  const handleStartAgain = () => {
    setDatasets([])
    setCurrentDatasetId(null)
    setShowUpload(true)
    setError(null)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-component="AppRoot">
      {/* Top Navigation */}
      <nav className="w-full flex items-center px-8 h-16" data-component="TopNav" style={{ background: 'var(--color-chart-3)' }}>
        <button
          className={`mr-6 text-lg font-semibold py-2 px-3 rounded transition-colors ${nav === 'insights' ? 'bg-white/20' : ''}`}
          style={{ color: 'white' }}
          onClick={() => setNav('insights')}
          data-component="NavMagicInsights"
        >
          Magic Insights
        </button>
        <button
          className={`mr-6 text-lg font-semibold py-2 px-3 rounded transition-colors ${nav === 'gallery' ? 'bg-white/20' : ''}`}
          style={{ color: 'white' }}
          onClick={() => setNav('gallery')}
          data-component="NavChartGallery"
        >
          Chart Gallery
        </button>
        <button
          className={`text-lg font-semibold py-2 px-3 rounded transition-colors ${nav === 'magiccharts' ? 'bg-white/20' : ''}`}
          style={{ color: 'white' }}
          onClick={() => setNav('magiccharts')}
          data-component="NavMagicCharts"
        >
          Magic Charts
        </button>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {nav === 'insights' && (
          <div className="w-full h-full flex">
            {/* Left Sidebar - Magic Insights Simulator */}
            <div className="w-[368px] bg-white border-r border-gray-200 flex flex-col" data-component="Sidebar">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 text-left" data-component="SidebarHeader">
                <h1 className="text-lg font-bold text-gray-900">Magic Insights</h1>
                <p className="text-sm text-gray-600">Data analysis simulator</p>
              </div>
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto" data-component="SidebarContent">
                {/* Error Display */}
                {error && (
                  <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg" data-component="SidebarError">
                    <div className="flex items-center">
                      <div className="text-red-500 mr-2">⚠️</div>
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                {!currentDataset ? (
                  <div className="p-4" data-component="SidebarNoData">
                    <div className="text-center text-gray-500">
                      <div className="text-3xl mb-3">📊</div>
                      <h3 className="text-lg font-medium mb-2">No Data Loaded</h3>
                      <p className="text-sm">Upload data on the right to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-4" data-component="PromptSection">
                    {/* Prompt Input */}
                    <PromptInput onSubmit={handlePromptSubmit} isProcessing={isProcessing} insightsGenerated={insights.length > 0} />

                    {/* Results Area - Placeholder for Phase 2 */}
                    {isProcessing && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg text-center" data-component="LoadingState">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Analyzing your data...</h3>
                        <p className="text-xs text-gray-600">Magic Insights is processing your request</p>
                      </div>
                    )}
                    {/* Insights List */}
                    {!isProcessing && insights.length > 0 && (
                      <div className="space-y-3 mt-2" data-component="InsightsList">
                        <h3 className="text-base font-semibold text-gray-800 mb-2">Insights</h3>
                        <ul className="space-y-2">
                          {insights.map(insight => (
                            <li key={insight.id} className="bg-blue-50 border border-blue-100 rounded p-3">
                              <div className="font-medium text-blue-900 mb-1">{insight.title}</div>
                              <div className="text-sm text-blue-800 mb-1">{insight.description}</div>
                              {insight.value && (
                                <div className="text-xs text-blue-700">Value: <span className="font-semibold">{insight.value}</span></div>
                              )}
                              {insight.calculation && (
                                <div className="text-xs text-gray-500 mt-1">Calculation: {insight.calculation}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Right Canvas - File Upload & Preview */}
            <div className="flex-1 bg-white flex flex-col" data-component="Canvas">
              {/* Canvas Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2 text-left" data-component="CanvasHeader">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Canvas</h2>
                  <p className="text-sm text-gray-600">Upload data and preview your workspace</p>
                </div>
                <div className="flex items-center gap-2">
                  {datasets.length > 0 && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      data-component="AddFileButton"
                    >
                      + Add File
                    </button>
                  )}
                  <button
                    onClick={handleStartAgain}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 text-sm"
                    data-component="StartAgainButton"
                  >
                    Start Again
                  </button>
                </div>
              </div>
              {/* Canvas Content */}
              <div className="flex-1 p-4 overflow-y-auto" data-component="CanvasContent">
                {showUpload ? (
                  <div className="h-full" data-component="UploadSection">
                    {datasets.length > 0 && (
                      <div className="flex items-center justify-between mb-6" data-component="UploadHeader">
                        <h3 className="text-lg font-semibold text-gray-800">Upload New File</h3>
                        <button
                          onClick={() => setShowUpload(false)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          data-component="CancelUploadButton"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <DataUpload onDataUpload={handleDataUpload} onError={handleError} />
                  </div>
                ) : (
                  <div className="space-y-4" data-component="YourFilesSection">
                    {/* Files Management */}
                    <div className="bg-gray-50 rounded-lg p-4" data-component="FilesList">
                      <h3 className="font-semibold text-gray-800 mb-3">📁 Your Files</h3>
                      <div className="space-y-2">
                        {datasets.map((dataset) => (
                          <div key={dataset.id} data-component="FileCard">
                            <div
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                                currentDatasetId === dataset.id
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-gray-200'
                              }`}
                              onClick={() => setCurrentDatasetId(dataset.id)}
                              data-component="FileCardHeader"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-lg">📊</div>
                                <div>
                                  <div className="font-medium text-sm">{dataset.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {dataset.columns.length} columns, {dataset.rows.length} rows
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {currentDatasetId === dataset.id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => removeDataset(dataset.id)}
                                className="text-xs text-red-500 hover:underline"
                                data-component="RemoveFileButton"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {nav === 'gallery' && <ChartGallery />}
        {nav === 'magiccharts' && <MagicCharts />}
      </div>
    </div>
  )
}

export default App
