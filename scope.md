# Magic Insights Simulator - Implementation Plan

## Project Overview
Build a web-based simulator for testing Magic Insights response generation. The tool will analyze uploaded data, generate insights and charts, then craft Magic Insights-style responses to simulate the full user experience.

## Core Requirements

### Input Interface
- CSV/Data Upload: File upload or paste area for tabular data
- Web dataset sourcing: Ability to source relevant datasets from the web
- User Prompt: Text input for questions like "What insights can you share about my social media performance?" or "Summarize my data"

### Data Analysis Engine
- Parse uploaded data and identify column types (numeric, categorical, dates)
- Generate key metrics like averages, totals, growth rates, top performers
- Create visualizations using Chart.js
- Identify patterns like trends, outliers, correlations between columns
- Organize insights by importance and relevance to the user prompt

### Response Generation
- Reference calculated metrics in Magic Insights format
- Include generated charts with appropriate context
- Use Magic Insights voice (conversational, encouraging, emoji headers)
- Structure responses appropriately for specific questions vs open-ended requests
- Always end with "What this means for you:" and actionable next steps

### Interactive Components
- **Expandable Stats**: Clickable stats within text that expand inline to reveal calculation details
- **Data Sources**: Embedded references to data sources within text
- **Design Suggestions**: Mockup/preview suggestions for Canva designs

## Development Phases

### Development Phase 1: Foundation & Setup
**Goal**: Get the basic infrastructure running with a working data upload

#### Week 1: Core Setup
1. **Dependencies & Project Structure**
   - Install Chart.js, react-chartjs-2, papaparse
   - Set up folder structure and TypeScript interfaces
   - Create basic routing and layout components

2. **Data Upload Interface**
   - Build CSV file upload component
   - Implement web dataset sourcing (placeholder)
   - Create data validation and error handling
   - Add sample datasets for testing

3. **Basic Data Processing**
   - CSV parsing with papaparse
   - Column type detection (numeric, categorical, dates)
   - Data structure validation

**Deliverable**: Working data upload with sample data display

---

### Development Phase 2: Analysis Engine
**Goal**: Build the core data analysis capabilities

#### Week 2: Statistical Analysis
1. **Basic Statistics Functions**
   - Mean, median, totals, min/max calculations
   - Growth rate calculations for time-series data
   - Top/bottom performer identification

2. **Pattern Recognition**
   - Trend detection in time-series data
   - Outlier identification
   - Correlation analysis between numeric columns

3. **Insight Generation**
   - Create insight objects with metadata
   - Prioritize insights by relevance and importance
   - Generate insight descriptions

**Deliverable**: Functional analysis engine that processes data and generates insights

---

### Development Phase 3: Visualization System
**Goal**: Create dynamic chart generation and interactive components

#### Week 3: Chart Generation
1. **Chart.js Integration**
   - Set up Chart.js with React
   - Create chart type selection logic
   - Build chart components for each type (line, bar, pie, scatter)

2. **Smart Chart Selection**
   - Implement logic to choose appropriate chart types
   - Handle different data structures and patterns
   - Create chart configuration system

3. **Interactive Components**
   - Build expandable stats component
   - Create data source reference component
   - Implement chart tooltips and interactions

**Deliverable**: Dynamic chart generation with interactive elements

---

### Development Phase 4: Magic Insights Response Engine
**Goal**: Build the narrative response generation system

#### Week 4: Response Generation
1. **Template System**
   - Create Magic Insights response templates
   - Implement conversational tone and voice
   - Build emoji header system

2. **Component Assembly**
   - Combine charts, text, stats, and sources
   - Create response structure logic
   - Implement context-aware responses

3. **Design Suggestion System**
   - Build mockup generation for Canva designs
   - Create design suggestion cards
   - Implement design preview system

**Deliverable**: Complete Magic Insights response generation

---

### Development Phase 5: UI/UX & Integration
**Goal**: Polish the interface and integrate all components

#### Week 5: Interface & Styling
1. **Main Interface**
   - Build main dashboard layout
   - Create prompt input system
   - Implement results display area

2. **Magic Insights Styling**
   - Apply conversational design patterns
   - Implement responsive design
   - Add loading and error states

3. **Export Functionality**
   - Copy response text feature
   - Download charts functionality
   - Save as markdown option

**Deliverable**: Complete, polished Magic Insights simulator

---

### Development Phase 6: Testing & Refinement
**Goal**: Test with various datasets and refine the experience

#### Week 6: Testing & Polish
1. **Dataset Testing**
   - Test with various data types and structures
   - Validate insight generation accuracy
   - Test response quality and relevance

2. **Performance Optimization**
   - Optimize chart rendering
   - Improve data processing speed
   - Add caching for repeated analyses

3. **Final Polish**
   - Bug fixes and edge case handling
   - Documentation and code cleanup
   - User experience refinements

**Deliverable**: Production-ready Magic Insights simulator

---

## Technical Architecture

```
src/
├── components/
│   ├── DataUpload/          # CSV upload + web datasets
│   ├── AnalysisEngine/      # Data processing & insights
│   ├── Charts/             # Chart.js components
│   ├── ResponseComponents/  # Stats, sources, text blocks
│   ├── DesignSuggestions/   # Canva mockup previews
│   └── MagicInsights/      # Main response generator
├── utils/
│   ├── dataAnalysis.ts     # Statistical functions
│   ├── chartGenerator.ts   # Chart type selection
│   ├── responseTemplates.ts # Magic Insights templates
│   └── sampleData.ts       # Test datasets
└── types/
    └── index.ts           # TypeScript interfaces
```

## Magic Insights Voice Guidelines

- **Tone**: Conversational and supportive, like a helpful friend
- **Language**: Use contractions, casual phrases, "you" and "your"
- **Structure**: Short headers with emojis, line breaks, bold key insights
- **Avoid**: Long paragraphs, formal language, technical jargon
- **Always**: End with encouraging, actionable next steps

## Analysis Framework

### Automatic Insights Generation
- **Descriptive Stats**: Calculate means, totals, min/max for numeric columns
- **Trend Analysis**: Identify growth patterns in time-series data
- **Comparative Analysis**: Find top/bottom performers across categories
- **Outlier Detection**: Identify unusual values or patterns
- **Correlation Discovery**: Find relationships between numeric columns

### Chart Selection Logic
- **Time-series data**: Line charts for trends over time
- **Categorical comparisons**: Bar charts for performance comparison
- **Distributions**: Histograms for value spreads
- **Relationships**: Scatter plots for correlations
- **Proportions**: Pie charts for market share/breakdowns

## Figma Design Integration Points

- **Phase 1**: Need designs for data upload interface and main layout
- **Phase 3**: Need designs for chart styling and interactive components
- **Phase 4**: Need designs for Magic Insights response layout and design suggestions
- **Phase 5**: Need designs for overall interface and responsive patterns

## Success Criteria

✅ Analyzes uploaded CSV data and identifies key patterns
✅ Generates relevant charts based on data structure and content
✅ Creates responses that match Magic Insights style guide
✅ Handles both specific questions and open-ended requests
✅ Provides actionable insights based on actual data analysis
✅ Easy to use for testing different datasets and scenarios
✅ Includes expandable stats and data source references
✅ Generates design suggestions with mockup previews 