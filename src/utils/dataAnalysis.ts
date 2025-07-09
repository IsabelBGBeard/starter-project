import type { Dataset, Insight, UserPrompt } from '../types';

// Helper: Calculate mean
function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Helper: Calculate median
function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Helper: Calculate standard deviation
function stddev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map(v => (v - m) ** 2)));
}

// Helper: Calculate min/max
function min(values: number[]): number {
  return Math.min(...values);
}
function max(values: number[]): number {
  return Math.max(...values);
}

// Helper: Calculate sum
function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

// Helper: Calculate Pearson correlation
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  const mx = mean(x);
  const my = mean(y);
  const num = x.map((xi, i) => (xi - mx) * (y[i] - my)).reduce((a, b) => a + b, 0);
  const den = Math.sqrt(
    x.map(xi => (xi - mx) ** 2).reduce((a, b) => a + b, 0) *
    y.map(yi => (yi - my) ** 2).reduce((a, b) => a + b, 0)
  );
  return den === 0 ? 0 : num / den;
}

// Helper: Detect outliers using IQR
function findOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.floor((sorted.length * 3) / 4)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return values.filter(v => v < lower || v > upper);
}

// Main analysis function
export function analyzeDataset(dataset: Dataset, prompt: UserPrompt): Insight[] {
  const insights: Insight[] = [];
  const numericColumns = dataset.columns.filter(col => col.type === 'numeric');
  const dateColumns = dataset.columns.filter(col => col.type === 'date');
  const categoricalColumns = dataset.columns.filter(col => col.type === 'categorical');

  // Descriptive stats for numeric columns
  for (const col of numericColumns) {
    const values = col.values.map(Number).filter(v => !isNaN(v));
    if (!values.length) continue;
    insights.push({
      id: `stat-${col.name}`,
      type: 'statistic',
      title: `Average ${col.name}`,
      description: `The average ${col.name} is ${mean(values).toFixed(2)}.`,
      value: mean(values).toFixed(2),
      calculation: `mean([${values.slice(0, 5).join(', ')}...])`,
      importance: 'medium',
      relevantColumns: [col.name],
    });
    insights.push({
      id: `minmax-${col.name}`,
      type: 'statistic',
      title: `Min/Max ${col.name}`,
      description: `The minimum is ${min(values)}, the maximum is ${max(values)}.`,
      value: `${min(values)} / ${max(values)}`,
      calculation: `min/max([${values.slice(0, 5).join(', ')}...])`,
      importance: 'low',
      relevantColumns: [col.name],
    });
  }

  // Outlier detection
  for (const col of numericColumns) {
    const values = col.values.map(Number).filter(v => !isNaN(v));
    const outliers = findOutliers(values);
    if (outliers.length > 0) {
      insights.push({
        id: `outlier-${col.name}`,
        type: 'outlier',
        title: `Outliers in ${col.name}`,
        description: `Unusually high/low values detected: ${outliers.join(', ')}`,
        value: outliers.join(', '),
        calculation: 'IQR method',
        importance: 'high',
        relevantColumns: [col.name],
      });
    }
  }

  // Correlation between numeric columns
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const colA = numericColumns[i];
      const colB = numericColumns[j];
      const valuesA = colA.values.map(Number).filter(v => !isNaN(v));
      const valuesB = colB.values.map(Number).filter(v => !isNaN(v));
      if (valuesA.length !== valuesB.length || valuesA.length < 2) continue;
      const corr = pearson(valuesA, valuesB);
      if (Math.abs(corr) > 0.5) {
        insights.push({
          id: `corr-${colA.name}-${colB.name}`,
          type: 'correlation',
          title: `Correlation between ${colA.name} and ${colB.name}`,
          description: `There is a ${corr > 0 ? 'positive' : 'negative'} correlation (${corr.toFixed(2)}) between ${colA.name} and ${colB.name}.`,
          value: corr.toFixed(2),
          calculation: 'Pearson correlation',
          importance: 'medium',
          relevantColumns: [colA.name, colB.name],
        });
      }
    }
  }

  // Top/bottom performers for categorical columns
  for (const catCol of categoricalColumns) {
    for (const numCol of numericColumns) {
      const groupMap: Record<string, number[]> = {};
      dataset.rows.forEach(row => {
        const cat = row[dataset.columns.findIndex(c => c.name === catCol.name)];
        const num = Number(row[dataset.columns.findIndex(c => c.name === numCol.name)]);
        if (!isNaN(num)) {
          if (!groupMap[cat]) groupMap[cat] = [];
          groupMap[cat].push(num);
        }
      });
      const groupMeans = Object.entries(groupMap).map(([cat, nums]) => ({ cat, mean: mean(nums) }));
      if (groupMeans.length > 1) {
        const top = groupMeans.reduce((a, b) => (a.mean > b.mean ? a : b));
        const bottom = groupMeans.reduce((a, b) => (a.mean < b.mean ? a : b));
        insights.push({
          id: `top-${catCol.name}-${numCol.name}`,
          type: 'comparison',
          title: `Top ${catCol.name} by ${numCol.name}`,
          description: `${top.cat} has the highest average ${numCol.name} (${top.mean.toFixed(2)}).`,
          value: top.cat,
          calculation: `mean(${numCol.name} by ${catCol.name})`,
          importance: 'high',
          relevantColumns: [catCol.name, numCol.name],
        });
        insights.push({
          id: `bottom-${catCol.name}-${numCol.name}`,
          type: 'comparison',
          title: `Lowest ${catCol.name} by ${numCol.name}`,
          description: `${bottom.cat} has the lowest average ${numCol.name} (${bottom.mean.toFixed(2)}).`,
          value: bottom.cat,
          calculation: `mean(${numCol.name} by ${catCol.name})`,
          importance: 'medium',
          relevantColumns: [catCol.name, numCol.name],
        });
      }
    }
  }

  // Trend analysis for time series (if date column exists)
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const dateCol = dateColumns[0];
    for (const numCol of numericColumns) {
      // Assume rows are sorted by date
      const values = numCol.values.map(Number).filter(v => !isNaN(v));
      if (values.length < 2) continue;
      const first = values[0];
      const last = values[values.length - 1];
      const growth = ((last - first) / Math.abs(first || 1)) * 100;
      insights.push({
        id: `trend-${numCol.name}`,
        type: 'trend',
        title: `Trend in ${numCol.name}`,
        description: `${numCol.name} changed by ${growth.toFixed(1)}% from start to end of the dataset.`,
        value: growth.toFixed(1) + '%',
        calculation: `(${last} - ${first}) / ${first} * 100`,
        importance: 'high',
        relevantColumns: [dateCol.name, numCol.name],
      });
    }
  }

  return insights;
} 