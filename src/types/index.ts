// Data Types
export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  values: any[];
}

export interface Dataset {
  id: string;
  name: string;
  columns: DataColumn[];
  rows: any[][];
  source?: string;
}

// Analysis Types
export interface Insight {
  id: string;
  type: 'statistic' | 'trend' | 'comparison' | 'correlation' | 'outlier';
  title: string;
  description: string;
  value?: number | string;
  calculation?: string;
  importance: 'high' | 'medium' | 'low';
  relevantColumns: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'scatter';
  chartData?: any;
}

export interface AnalysisResult {
  dataset: Dataset;
  insights: Insight[];
  summary: string;
  generatedAt: Date;
}

// Response Components
export interface StatComponent {
  type: 'stat';
  value: number | string;
  label: string;
  calculation: string;
  isExpandable: boolean;
}

export interface SourceComponent {
  type: 'source';
  text: string;
  source: string;
}

export interface ChartComponent {
  type: 'chart';
  chartType: 'line' | 'bar' | 'pie' | 'scatter';
  data: any;
  title: string;
  description: string;
}

export interface TextComponent {
  type: 'text';
  content: string;
  isHeader?: boolean;
  emoji?: string;
}

export interface DesignSuggestionComponent {
  type: 'design';
  title: string;
  description: string;
  designType: 'presentation' | 'infographic' | 'dashboard';
  mockupUrl?: string;
}

export type ResponseComponent = 
  | StatComponent 
  | SourceComponent 
  | ChartComponent 
  | TextComponent 
  | DesignSuggestionComponent;

export interface MagicInsightsResponse {
  components: ResponseComponent[];
  summary: string;
  nextSteps: string[];
}

// User Input
export interface UserPrompt {
  text: string;
  type: 'specific' | 'open-ended';
  context?: string;
}

// Chart Configuration
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  data: any;
  options: any;
  responsive: boolean;
}

// Sample Data
export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  category: string;
  csvData: string;
} 