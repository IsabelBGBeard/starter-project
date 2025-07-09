import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { Dataset } from '../../types';
import { getAllSampleDatasets } from '../../utils/sampleData';

interface DataUploadProps {
  onDataUpload: (dataset: Dataset) => void;
  onError: (error: string) => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({ onDataUpload, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string>('');
  const sampleDatasets = getAllSampleDatasets();

  const detectColumnType = (values: any[]): 'numeric' | 'categorical' | 'date' | 'text' => {
    const sampleValues = values.slice(0, 10).filter(v => v !== null && v !== undefined && v !== '');
    
    if (sampleValues.length === 0) return 'text';

    // Check if it's a date
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (sampleValues.every(v => datePattern.test(String(v)))) {
      return 'date';
    }

    // Check if it's numeric
    const numericValues = sampleValues.filter(v => !isNaN(Number(v)) && v !== '');
    if (numericValues.length / sampleValues.length > 0.8) {
      return 'numeric';
    }

    // Check if it's categorical (limited unique values)
    const uniqueValues = new Set(sampleValues.map(v => String(v).toLowerCase()));
    if (uniqueValues.size <= Math.min(20, sampleValues.length * 0.5)) {
      return 'categorical';
    }

    return 'text';
  };

  const processCSVData = useCallback((csvText: string, source?: string): Dataset => {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim()
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('No data found in CSV file');
    }

    const headers = Object.keys(result.data[0] as any);
    const columns = headers.map(header => {
      const values = result.data.map((row: any) => row[header]);
      return {
        name: header,
        type: detectColumnType(values),
        values: values
      };
    });

    const rows = result.data.map((row: any) => Object.values(row));

    return {
      id: `dataset-${Date.now()}`,
      name: source || 'Uploaded Dataset',
      columns,
      rows,
      source
    };
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const dataset = processCSVData(csvText, file.name);
        onDataUpload(dataset);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Failed to process CSV file');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      onError('Failed to read file');
      setIsUploading(false);
    };

    reader.readAsText(file);
  }, [processCSVData, onDataUpload, onError]);

  const handleSampleDatasetSelect = useCallback((sampleId: string) => {
    const sample = sampleDatasets.find(d => d.id === sampleId);
    if (!sample) return;

    try {
      const dataset = processCSVData(sample.csvData, sample.name);
      onDataUpload(dataset);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load sample dataset');
    }
  }, [sampleDatasets, processCSVData, onDataUpload, onError]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600">Get started by uploading a CSV file or trying sample data</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">📁 Upload CSV File</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-600">
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-lg">Processing...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl mb-4">📄</div>
                    <p className="text-xl font-medium mb-2">Click to upload CSV file</p>
                    <p className="text-gray-500">or drag and drop</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Sample Datasets Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">🧪 Try Sample Data</h3>
          <div className="space-y-3">
            {sampleDatasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => handleSampleDatasetSelect(dataset.id)}
                disabled={isUploading}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-gray-800">{dataset.name}</div>
                <div className="text-sm text-gray-600 mt-1">{dataset.description}</div>
                <div className="text-xs text-gray-500 mt-2">Category: {dataset.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Web Dataset Sourcing Placeholder */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">🌐 Web Dataset Sourcing</h3>
        <p className="text-gray-600">
          Coming soon: Source relevant datasets directly from the web
        </p>
      </div>
    </div>
  );
}; 