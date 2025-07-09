// Tableau-inspired Chart Suggestion Algorithm
// Based on data types and cardinality analysis

class ChartSuggestionEngine {
  CARDINALITY_THRESHOLDS: { LOW: number; MEDIUM: number; HIGH: number };

  constructor() {
    this.CARDINALITY_THRESHOLDS = {
      LOW: 20,    // <= 20 unique values
      MEDIUM: 100, // 21-100 unique values
      HIGH: 1000   // > 100 unique values
    };
  }

  /**
   * Analyze field properties to determine data type and cardinality
   */
  analyzeField(data: any[], fieldName: string) {
    const values = data.map((row: any) => row[fieldName]).filter((v: any) => v != null);
    const uniqueValues = [...new Set(values)];
    
    return {
      name: fieldName,
      type: this.determineDataType(values),
      cardinality: uniqueValues.length,
      cardinalityLevel: this.getCardinalityLevel(uniqueValues.length),
      uniqueValues: uniqueValues.slice(0, 10), // Sample for inspection
      hasNulls: values.length < data.length,
      sampleValues: values.slice(0, 5)
    };
  }

  /**
   * Determine if field is Dimension (categorical/discrete) or Measure (numerical/continuous)
   */
  determineDataType(values: any[]) {
    // Check if all values are numbers (excluding null/undefined)
    const numericValues = values.filter((v: any) => typeof v === 'number' && !isNaN(v));
    const stringValues = values.filter((v: any) => typeof v === 'string');
    const dateValues = values.filter((v: any) => v instanceof Date || this.isDateString(v));

    if (dateValues.length > values.length * 0.8) {
      return 'DATE';
    }
    
    if (numericValues.length > values.length * 0.8) {
      // Check if it's really continuous or just numeric categorical
      const uniqueCount = new Set(numericValues).size;
      if (uniqueCount <= 20 && numericValues.every((v: any) => Number.isInteger(v))) {
        return 'DIMENSION'; // Likely categorical (like ratings 1-5)
      }
      return 'MEASURE';
    }
    
    return 'DIMENSION';
  }

  /**
   * Classify cardinality levels
   */
  getCardinalityLevel(count: number) {
    if (count <= this.CARDINALITY_THRESHOLDS.LOW) return 'LOW';
    if (count <= this.CARDINALITY_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Main chart suggestion function - mirrors Tableau's Show Me logic
   */
  suggestCharts(data: any[], selectedFields: string[]) {
    if (!selectedFields || selectedFields.length === 0) {
      return { suggestions: [], reason: 'No fields selected' };
    }

    const fieldAnalysis = selectedFields.map((field: string) => this.analyzeField(data, field));
    const dimensions = fieldAnalysis.filter((f: any) => f.type === 'DIMENSION');
    const measures = fieldAnalysis.filter((f: any) => f.type === 'MEASURE');
    const dates = fieldAnalysis.filter((f: any) => f.type === 'DATE');

    return this.applyTableauRules(dimensions, measures, dates, data.length);
  }

  /**
   * Core Tableau Show Me rules
   */
  applyTableauRules(dimensions: any[], measures: any[], dates: any[], recordCount: number) {
    const suggestions: any[] = [];
    const dimCount = dimensions.length;
    const measureCount = measures.length;
    const dateCount = dates.length;

    // Rule 1: Single Measure
    if (measureCount === 1 && dimCount === 0 && dateCount === 0) {
      suggestions.push({
        type: 'histogram',
        priority: 1,
        reason: 'Single continuous measure - show distribution'
      });
    }

    // Rule 2: Single Dimension
    if (dimCount === 1 && measureCount === 0 && dateCount === 0) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'bar',
          priority: 1,
          reason: 'Single categorical dimension - show frequency'
        });
      }
    }

    // Rule 3: One Dimension + One Measure
    if (dimCount === 1 && measureCount === 1 && dateCount === 0) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'bar',
          priority: 1,
          reason: 'Categorical dimension with measure - compare values across categories'
        });
        if (dim.cardinality <= 7) {
          suggestions.push({
            type: 'pie',
            priority: 2,
            reason: 'Few categories - can show parts of whole'
          });
        }
      }
    }

    // Rule 4: One Date + One Measure
    if (dateCount === 1 && measureCount === 1 && dimCount === 0) {
      suggestions.push({
        type: 'line',
        priority: 1,
        reason: 'Time series data - show trend over time'
      });
      suggestions.push({
        type: 'bar',
        priority: 2,
        reason: 'Time periods - compare values across time periods'
      });
    }

    // Rule 5: Two Measures
    if (measureCount === 2 && dimCount === 0 && dateCount === 0) {
      suggestions.push({
        type: 'scatter',
        priority: 1,
        reason: 'Two continuous measures - show correlation'
      });
    }

    // Rule 6: Multiple Measures + One Dimension
    if (measureCount >= 2 && dimCount === 1 && dateCount === 0) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'grouped_bar',
          priority: 1,
          reason: 'Multiple measures with categorical dimension - compare measures across categories'
        });
        suggestions.push({
          type: 'line',
          priority: 2,
          reason: 'Multiple measures over categories - show trends for each measure'
        });
      }
    }

    // Rule 7: Multiple Measures + One Date
    if (measureCount >= 2 && dimCount === 0 && dateCount === 1) {
      suggestions.push({
        type: 'line',
        priority: 1,
        reason: 'Multiple measures over time - show trends for each measure'
      });
      suggestions.push({
        type: 'stacked_area',
        priority: 2,
        reason: 'Multiple measures over time - show cumulative contribution'
      });
    }

    // Rule 8: Two Dimensions + One Measure
    if (dimCount === 2 && measureCount === 1 && dateCount === 0) {
      const lowCardDims = dimensions.filter(d => d.cardinalityLevel === 'LOW');
      if (lowCardDims.length === 2) {
        suggestions.push({
          type: 'grouped_bar',
          priority: 1,
          reason: 'Two categorical dimensions with measure - group by one dimension'
        });
        suggestions.push({
          type: 'stacked_bar',
          priority: 2,
          reason: 'Two categorical dimensions with measure - stack by secondary dimension'
        });
        suggestions.push({
          type: 'heatmap',
          priority: 3,
          reason: 'Two categorical dimensions with measure - show intensity across categories'
        });
      }
    }

    // Rule 9: One Date + One Dimension + One Measure
    if (dateCount === 1 && dimCount === 1 && measureCount === 1) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'line',
          priority: 1,
          reason: 'Time series by category - show trends for each group'
        });
        suggestions.push({
          type: 'stacked_area',
          priority: 2,
          reason: 'Stacked area - show contribution over time'
        });
        suggestions.push({
          type: 'grouped_bar',
          priority: 3,
          reason: 'Grouped bars over time - compare categories within time periods'
        });
      }
    }

    // Rule 10: One Date + One Dimension + Multiple Measures
    if (dateCount === 1 && dimCount === 1 && measureCount >= 2) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'line',
          priority: 1,
          reason: 'Multiple time series by category - show trends for each measure and group'
        });
        suggestions.push({
          type: 'stacked_area',
          priority: 2,
          reason: 'Stacked area by category - show measure contributions over time'
        });
      }
    }

    // Rule 11: Two Dimensions + Multiple Measures
    if (dimCount === 2 && measureCount >= 2 && dateCount === 0) {
      const lowCardDims = dimensions.filter(d => d.cardinalityLevel === 'LOW');
      if (lowCardDims.length === 2) {
        suggestions.push({
          type: 'grouped_bar',
          priority: 1,
          reason: 'Multiple measures with two dimensions - group and compare measures'
        });
        suggestions.push({
          type: 'heatmap',
          priority: 2,
          reason: 'Multiple measures - create separate heatmaps for each measure'
        });
      }
    }

    // Rule 12: Three or More Measures
    if (measureCount >= 3 && dimCount <= 1 && dateCount <= 1) {
      if (dateCount === 1) {
        suggestions.push({
          type: 'line',
          priority: 1,
          reason: 'Multiple measures over time - parallel time series'
        });
        suggestions.push({
          type: 'stacked_area',
          priority: 2,
          reason: 'Multiple measures over time - show cumulative values'
        });
      }
      
      if (dimCount === 1) {
        const dim = dimensions[0];
        if (dim.cardinalityLevel === 'LOW') {
          suggestions.push({
            type: 'radar',
            priority: 1,
            reason: 'Multiple measures by category - radar chart shows multidimensional comparison'
          });
          suggestions.push({
            type: 'grouped_bar',
            priority: 2,
            reason: 'Multiple measures by category - grouped bars for detailed comparison'
          });
        }
      }
      
      if (dimCount === 0 && dateCount === 0) {
        suggestions.push({
          type: 'parallel_coordinates',
          priority: 1,
          reason: 'Multiple measures only - parallel coordinates show relationships'
        });
      }
    }

    // Rule 13: Two Measures + One Dimension (Scatter + Grouping)
    if (measureCount === 2 && dimCount === 1 && dateCount === 0) {
      const dim = dimensions[0];
      if (dim.cardinalityLevel === 'LOW') {
        suggestions.push({
          type: 'scatter',
          priority: 1,
          reason: 'Two measures with categorical dimension - scatter plot colored by category'
        });
        suggestions.push({
          type: 'grouped_bar',
          priority: 2,
          reason: 'Two measures with categorical dimension - grouped bars to compare both measures'
        });
      }
    }

    // Rule 14: Advanced Stacking Logic
    const stackableScenarios = [
      // Scenario 1: Time + Category + Measure (classic stacked area/bar)
      { condition: dateCount === 1 && dimCount === 1 && measureCount === 1, type: 'stacked_area' },
      // Scenario 2: Multiple measures that represent parts of a whole
      { condition: measureCount >= 2 && this.measuresRepresentPartsOfWhole(measures), type: 'stacked_bar' },
      // Scenario 3: Category + subcategory + measure
      { condition: dimCount === 2 && measureCount === 1, type: 'stacked_bar' }
    ];

    stackableScenarios.forEach(scenario => {
      if (scenario.condition) {
        suggestions.push({
          type: scenario.type,
          priority: 2,
          reason: `Stackable data structure - ${scenario.type} shows composition`
        });
      }
    });
    dimensions.forEach(dim => {
      if (dim.cardinalityLevel === 'HIGH') {
        // High cardinality dimensions usually need aggregation
        if (measureCount >= 1) {
          suggestions.push({
            type: 'treemap',
            priority: 3,
            reason: 'High cardinality dimension - treemap shows hierarchy'
          });
        }
      }
    });

    // Rule 10: Large Dataset Rules
    if (recordCount > 10000) {
      if (measureCount >= 2) {
        suggestions.push({
          type: 'density',
          priority: 2,
          reason: 'Large dataset - density plot shows patterns better than individual points'
        });
      }
    }

    // Rule 11: Geographic Data Detection
    const geoFields = dimensions.filter(d => 
      this.isGeographicField(d.name) || 
      this.containsGeographicValues(d.uniqueValues)
    );
    
    if (geoFields.length > 0 && measureCount >= 1) {
      suggestions.push({
        type: 'map',
        priority: 1,
        reason: 'Geographic dimension detected - map visualization'
      });
    }

    // Fallback rules
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'table',
        priority: 1,
        reason: 'Complex data structure - tabular view recommended'
      });
    }

    return {
      suggestions: suggestions.sort((a, b) => a.priority - b.priority),
      fieldAnalysis: { dimensions, measures, dates }
    };
  }

  /**
   * Helper to detect if measures represent parts of a whole
   */
  measuresRepresentPartsOfWhole(measures: any[]) {
    // Check if measure names suggest parts of a whole
    const partOfWholeKeywords = ['percentage', 'percent', 'share', 'proportion', 'ratio'];
    return measures.some((measure: any) => 
      partOfWholeKeywords.some((keyword: string) => 
        measure.name.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Helper functions
   */
  isDateString(value: any) {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  isGeographicField(fieldName: string) {
    const geoKeywords = ['country', 'state', 'city', 'region', 'location', 'lat', 'lng', 'longitude', 'latitude'];
    return geoKeywords.some((keyword: string) => fieldName.toLowerCase().includes(keyword));
  }

  containsGeographicValues(values: any[]) {
    const geoValues = ['usa', 'uk', 'canada', 'australia', 'germany', 'france', 'japan', 'china'];
    return values.some((value: any) => 
      geoValues.includes(value.toString().toLowerCase())
    );
  }

  /**
   * Additional validation rules
   */
  validateChartSuggestion(chartType: string, fieldAnalysis: { dimensions: any[]; measures: any[]; dates: any[] }, recordCount: number) {
    const { dimensions, measures, dates } = fieldAnalysis;
    
    const validationRules: { [key: string]: () => boolean } = {
      pie: () => {
        if (measures.length !== 1) return false;
        if (dimensions.length !== 1) return false;
        if (dimensions[0].cardinality > 7) return false;
        return true;
      },
      
      histogram: () => {
        if (measures.length !== 1) return false;
        if (dimensions.length + dates.length > 0) return false;
        return true;
      },
      
      scatter: () => {
        if (measures.length < 2) return false;
        if (recordCount < 10) return false; // Need sufficient data points
        return true;
      },
      
      line: () => {
        if (measures.length !== 1) return false;
        if (dates.length !== 1) return false;
        return true;
      },
      
      heatmap: () => {
        if (dimensions.length !== 2) return false;
        if (measures.length !== 1) return false;
        if (dimensions.some((d: any) => d.cardinalityLevel === 'HIGH')) return false;
        return true;
      }
    };

    return validationRules[chartType] ? validationRules[chartType]() : true;
  }
}

// Usage example:
/*
const engine = new ChartSuggestionEngine();
const suggestions = engine.suggestCharts(data, ['sales', 'region', 'date']);

// Returns:
{
  suggestions: [
    {
      type: 'line',
      priority: 1,
      reason: 'Time series by category - show trends for each group'
    }
  ],
  fieldAnalysis: {
    dimensions: [{ name: 'region', type: 'DIMENSION', cardinality: 5 }],
    measures: [{ name: 'sales', type: 'MEASURE', cardinality: 1000 }],
    dates: [{ name: 'date', type: 'DATE', cardinality: 365 }]
  }
}
*/

export default ChartSuggestionEngine; 