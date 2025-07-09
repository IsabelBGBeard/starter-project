import React, { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { BarChart, LineChart, PieChart, ScatterChart, HistogramChart } from './components/Charts'
import { getCssVarValue } from './lib/utils'
import ChartSuggestionEngine from './utils/ChartSuggestionEngine';
import { Chart } from 'chart.js';
import { ColumnButton } from './components/MagicInsights/ColumnButton';

// --- Chart Types, Variants, and Compatibility ---
// For each chart type, define possible variants and a function to check compatibility with selected columns.

/*
Chart Type → Variants & Compatibility:

Bar:
  - Grouped Bar: 2 categorical, 1 numeric
  - Stacked Bar: 2 categorical, 1 numeric
  - Multicolor Bar: 1 categorical, 1 numeric
Line:
  - Simple Line: 1 date/numeric (x), 1 numeric (y)
  - Multi-series Line: 1 date/numeric (x), 1 numeric (y), 1 categorical (series)
  - Area Line: 1 date/numeric (x), 1 numeric (y)
Pie:
  - Standard Pie: 1 categorical, 1 numeric
  - Donut: 1 categorical, 1 numeric
  - Exploded Pie: 1 categorical, 1 numeric
Scatter:
  - Simple Scatter: 2 numeric
  - Bubble: 2 numeric, 1 numeric (size)
Histogram:
  - Standard Histogram: 1 numeric
  - Cumulative Histogram: 1 numeric
*/

type ChartVariant = {
  key: string
  label: string
  isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => boolean
}

type ChartVariantsMap = {
  [key: string]: ChartVariant[]
}

// Chart variant definitions
const CHART_VARIANTS: ChartVariantsMap = {
  Bar: [
    {
      key: 'count',
      label: 'Count Bar',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length !== 1) return false;
        const t = types[cols[0]];
        if (t !== 'categorical' && t !== 'date') return false;
        if (!rows) return true;
        const unique = Array.from(new Set(rows.map(r => r[cols[0]])));
        return unique.length <= 20;
      },
    },
    {
      key: 'count_horizontal',
      label: 'Count Horizontal Bar',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length !== 1) return false;
        const t = types[cols[0]];
        if (t !== 'categorical') return false;
        if (!rows) return true;
        const unique = Array.from(new Set(rows.map(r => r[cols[0]])));
        return unique.length <= 20;
      },
    },
    {
      key: 'single',
      label: 'Single Colour Bar',
      // 1 categorical + 1 numeric (order-agnostic)
      isCompatible: (cols: string[], types: Record<string, string>) =>
        cols.length === 2 &&
        ((types[cols[0]] === 'categorical' && types[cols[1]] === 'numeric') ||
         (types[cols[1]] === 'categorical' && types[cols[0]] === 'numeric') ||
         (types[cols[0]] === 'date' && types[cols[1]] === 'numeric') ||
         (types[cols[1]] === 'date' && types[cols[0]] === 'numeric')),
    },
    {
      key: 'single_horizontal',
      label: 'Single Colour Horizontal Bar',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        cols.length === 2 &&
        ((types[cols[0]] === 'categorical' && types[cols[1]] === 'numeric') ||
         (types[cols[1]] === 'categorical' && types[cols[0]] === 'numeric')),
    },
    {
      key: 'multi',
      label: 'Multi Colour Bar',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length !== 2) return false;
        // Accept either order
        const catIdx = types[cols[0]] === 'categorical' ? 0 : types[cols[1]] === 'categorical' ? 1 : -1;
        const numIdx = catIdx === 0 ? 1 : catIdx === 1 ? 0 : -1;
        if (catIdx === -1 || numIdx === -1) return false;
        if (types[cols[catIdx]] !== 'categorical' || types[cols[numIdx]] !== 'numeric') return false;
        if (!rows) return false;
        const unique = Array.from(new Set(rows.map(r => r[cols[catIdx]])));
        return unique.length <= 7;
      },
    },
    {
      key: 'multi_horizontal',
      label: 'Multi Colour Horizontal Bar',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length !== 2) return false;
        const catIdx = types[cols[0]] === 'categorical' ? 0 : types[cols[1]] === 'categorical' ? 1 : -1;
        const numIdx = catIdx === 0 ? 1 : catIdx === 1 ? 0 : -1;
        if (catIdx === -1 || numIdx === -1) return false;
        if (types[cols[catIdx]] !== 'categorical' || types[cols[numIdx]] !== 'numeric') return false;
        if (!rows) return false;
        const unique = Array.from(new Set(rows.map(r => r[cols[catIdx]])));
        return unique.length <= 7;
      },
    },
    {
      key: 'grouped',
      label: 'Grouped Bar',
      // Allow [date, categorical, numeric], [categorical, categorical, numeric], [date, numeric, numeric, ...], or [categorical, numeric, numeric, ...]
      isCompatible: (cols: string[], types: Record<string, string>) =>
        (cols.length === 3 &&
          ((types[cols[0]] === 'date' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric') ||
           (types[cols[0]] === 'categorical' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric')))
        || (cols.length >= 3 && (types[cols[0]] === 'categorical' || types[cols[0]] === 'date') && cols.slice(1).every(c => types[c] === 'numeric')),
    },
    {
      key: 'stacked',
      label: 'Stacked Bar',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        (cols.length === 3 &&
          ((types[cols[0]] === 'date' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric') ||
           (types[cols[0]] === 'categorical' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric')))
        || (cols.length >= 3 && (types[cols[0]] === 'categorical' || types[cols[0]] === 'date') && cols.slice(1).every(c => types[c] === 'numeric')),
    },
    {
      key: 'proportional',
      label: 'Proportional Stacked Bar',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        (cols.length === 3 &&
          ((types[cols[0]] === 'date' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric') ||
           (types[cols[0]] === 'categorical' && types[cols[1]] === 'categorical' && types[cols[2]] === 'numeric')))
        || (cols.length >= 3 && (types[cols[0]] === 'categorical' || types[cols[0]] === 'date') && cols.slice(1).every(c => types[c] === 'numeric')),
    },
  ],
  Line: [
    {
      key: 'simple',
      label: 'Simple Line',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length < 2) return false;
        const xType = types[cols[0]];
        if (xType === 'date') return true;
        if (xType === 'numeric' && rows && isNumericOrdinal(rows.map(r => r[cols[0]]))) return true;
        return false;
      },
    },
    {
      key: 'multi',
      label: 'Multi-series Line',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length < 3) return false;
        const xType = types[cols[0]];
        if (xType === 'date') return true;
        if (xType === 'numeric' && rows && isNumericOrdinal(rows.map(r => r[cols[0]]))) return true;
        return false;
      },
    },
    {
      key: 'area',
      label: 'Area Line',
      isCompatible: (cols: string[], types: Record<string, string>, rows?: any[]) => {
        if (cols.length < 2) return false;
        const xType = types[cols[0]];
        if (xType === 'date') return true;
        if (xType === 'numeric' && rows && isNumericOrdinal(rows.map(r => r[cols[0]]))) return true;
        return false;
      },
    },
  ],
  Pie: [
    {
      key: 'standard',
      label: 'Standard Pie',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        (cols.length === 2 &&
          ((types[cols[0]] === 'categorical' && types[cols[1]] === 'numeric') ||
            (types[cols[1]] === 'categorical' && types[cols[0]] === 'numeric')))
        || (cols.length === 1 && types[cols[0]] === 'categorical'),
    },
    {
      key: 'donut',
      label: 'Donut',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        (cols.length === 2 &&
          ((types[cols[0]] === 'categorical' && types[cols[1]] === 'numeric') ||
            (types[cols[1]] === 'categorical' && types[cols[0]] === 'numeric')))
        || (cols.length === 1 && types[cols[0]] === 'categorical'),
    },
    {
      key: 'count',
      label: 'Count Pie',
      // 1 categorical only
      isCompatible: (cols: string[], types: Record<string, string>) =>
        cols.length === 1 && types[cols[0]] === 'categorical',
    },
  ],
  Scatter: [
    {
      key: 'simple',
      label: 'Simple Scatter',
      isCompatible: (cols: string[], types: Record<string, string>) => {
        if (cols.length !== 2) return false;
        const t0 = types[cols[0]], t1 = types[cols[1]];
        // Allow numeric-numeric (classic scatter)
        if (t0 === 'numeric' && t1 === 'numeric') return true;
        // Allow dot plot: categorical-numeric or numeric-categorical
        if ((t0 === 'categorical' && t1 === 'numeric') || (t0 === 'numeric' && t1 === 'categorical')) return true;
        return false;
      },
    },
    {
      key: 'bubble',
      label: 'Bubble',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        cols.length === 3 && cols.every(c => types[c] === 'numeric'),
    },
  ],
  Histogram: [
    {
      key: 'standard',
      label: 'Standard Histogram',
      isCompatible: (cols: string[], types: Record<string, string>) =>
        cols.length === 1 && types[cols[0]] === 'numeric',
    },
  ],
}

// Chart types for filter buttons
const CHART_TYPES = ['All', ...Object.keys(CHART_VARIANTS)]

// Chart type requirements for guidance
const CHART_TYPE_REQUIREMENTS: Record<string, string> = {
  Bar: 'Select one categorical and one or more numeric columns.',
  Line: 'Select a date or ordinal column and one or more numeric columns.',
  Pie: 'Select one categorical and one numeric column.',
  Scatter: 'Select two numeric columns.',
  Histogram: 'Select one numeric column.',
  All: 'Select columns to see available chart types.'
};

// Canva core purple
const CANVA_PURPLE = '#8B3DFF'

const chartVarNames = [
  '--color-chart-1',
  '--color-chart-2',
  '--color-chart-3',
  '--color-chart-4',
  '--color-chart-5',
  '--color-chart-6',
  '--color-chart-7',
  '--color-chart-8',
]
const defaultPalette = ['#5C7CFA', '#FDA7DF', '#72026C', '#FF5E5B', '#2ECC71', '#FFD600', '#003049', '#00CFEA']

// Placeholder sample datasets (now with CSV data)
const SAMPLE_DATASETS = [
  {
    name: 'Top 200 Popular Movies Budget',
    description: 'Top 200 most popular movies with revenue, genres, runtime, and more',
    csv: `popularity,release_date,revenue,runtime,title,vote_average,vote_count,runtime_category,genres\n875.581305,2015-06-17,1156730962,91.0,Minions,6.4,4571,Standard Feature (1.5–2 hours),Adventure\n724.247784,2014-11-05,675120017,169.0,Interstellar,8.1,10867,Long Feature (2.5–3 hours),Adventure\n514.5699559999998,2016-02-09,783112979,108.0,Deadpool,7.4,10995,Standard Feature (1.5–2 hours),Action\n481.098624,2014-07-30,773328629,121.0,Guardians of the Galaxy,7.9,9742,Extended Feature (2–2.5 hours),Action\n434.278564,2015-05-13,378858340,120.0,Mad Max: Fury Road,7.2,9427,Extended Feature (2–2.5 hours),Action\n418.708552,2015-06-09,1513528810,124.0,Jurassic World,6.5,8662,Extended Feature (2–2.5 hours),Action\n271.972889,2003-07-09,655011224,143.0,Pirates of the Caribbean: The Curse of the Black Pearl,7.5,6985,Extended Feature (2–2.5 hours),Adventure\n243.79174300000005,2014-06-26,710644566,130.0,Dawn of the Planet of the Apes,7.3,4410,Extended Feature (2–2.5 hours),Science\n206.227151,2014-11-18,752100229,123.0,The Hunger Games: Mockingjay - Part 1,6.6,5584,Extended Feature (2–2.5 hours),Science\n203.73459,2014-10-24,652105443,102.0,Big Hero 6,7.8,6135,Standard Feature (1.5–2 hours),Adventure\n202.042635,2015-06-23,440603537,126.0,Terminator Genisys,5.8,3631,Extended Feature (2–2.5 hours),Science\n198.372395,2016-04-27,1153304495,147.0,Captain America: Civil War,7.1,7241,Extended Feature (2–2.5 hours),Adventure\n192.528841,2014-10-10,13092000,105.0,Whiplash,8.3,4254,Standard Feature (1.5–2 hours),Drama\n187.322927,2008-07-16,1004558444,152.0,The Dark Knight,8.2,12002,Long Feature (2.5–3 hours),Drama\n167.93287,2015-09-30,630161890,141.0,The Martian,7.6,7268,Extended Feature (2–2.5 hours),Drama\n167.58371,2010-07-14,825532764,148.0,Inception,8.1,13752,Extended Feature (2–2.5 hours),Action\n165.125366,2013-11-27,1274219009,102.0,Frozen,7.3,5295,Standard Feature (1.5–2 hours),Adventure\n155.790452,2016-03-23,873260194,151.0,Batman v Superman: Dawn of Justice,5.7,7004,Long Feature (2.5–3 hours),Action\n150.437577,2009-12-10,2787965087,162.0,Avatar,7.2,11800,Long Feature (2.5–3 hours),Action\n146.75739099999996,1999-10-15,100853753,139.0,Fight Club,8.3,9413,Extended Feature (2–2.5 hours),Drama\n145.84737900000005,2006-06-20,1065659812,151.0,Pirates of the Caribbean: Dead Man's Chest,7.0,5246,Long Feature (2.5–3 hours),Adventure\n145.364591,2014-11-14,233555708,113.0,The Imitation Game,8.0,5723,Standard Feature (1.5–2 hours),Drama\n144.448633,2012-04-25,1519557910,143.0,The Avengers,7.4,11776,Extended Feature (2–2.5 hours),Science\n143.659698,1972-03-14,245066411,175.0,The Godfather,8.4,5893,Long Feature (2.5–3 hours),Drama\n143.350376,2014-08-07,477200000,101.0,Teenage Mutant Ninja Turtles,5.8,2636,Standard Feature (1.5–2 hours),Science\n143.041543,2014-10-01,369330363,145.0,Gone Girl,7.9,5862,Extended Feature (2–2.5 hours),Thriller\n140.849495,2015-07-16,243637091,105.0,Pixels,5.6,2513,Standard Feature (1.5–2 hours),Action\n139.575085,2014-10-15,211817906,135.0,Fury,7.4,3946,Extended Feature (2–2.5 hours),Drama\n139.272042,2016-05-18,543934787,144.0,X-Men: Apocalypse,6.4,4721,Extended Feature (2–2.5 hours),Science\n139.082615,2007-05-19,961000000,169.0,Pirates of the Caribbean: At World's End,6.9,4500,Long Feature (2.5–3 hours),Adventure\n138.433168,2011-08-03,482860185,105.0,Rise of the Planet of the Apes,7.0,4347,Standard Feature (1.5–2 hours),Thriller\n138.133331,1994-07-06,677945399,142.0,Forrest Gump,8.2,7927,Extended Feature (2–2.5 hours),Drama\n138.049577,2001-12-18,871368364,178.0,The Lord of the Rings: The Fellowship of the Ring,8.0,8705,Long Feature (2.5–3 hours),Adventure\n136.886704,2013-06-25,970761885,98.0,Despicable Me 2,7.0,4637,Standard Feature (1.5–2 hours),Other\n136.747729,1994-09-23,28341469,142.0,The Shawshank Redemption,8.5,8205,Extended Feature (2–2.5 hours),Drama\n135.413856,2011-05-14,1045713802,136.0,Pirates of the Caribbean: On Stranger Tides,6.4,4948,Extended Feature (2–2.5 hours),Adventure\n134.27922900000002,2015-04-22,1405403694,141.0,Avengers: Age of Ultron,7.3,6767,Extended Feature (2–2.5 hours),Action\n132.397737,2002-11-13,876688482,161.0,Harry Potter and the Chamber of Secrets,7.4,5815,Long Feature (2.5–3 hours),Adventure\n131.815575,2014-09-10,348319861,113.0,The Maze Runner,7.0,5371,Standard Feature (1.5–2 hours),Action\n130.311355,2015-05-19,209154322,130.0,Tomorrowland,6.2,2846,Extended Feature (2–2.5 hours),Adventure\n128.65596399999998,2015-06-09,857611174,94.0,Inside Out,8.0,6560,Standard Feature (1.5–2 hours),Drama\n127.525581,1975-11-18,108981275,133.0,One Flew Over the Cuckoo's Nest,8.2,2919,Extended Feature (2–2.5 hours),Drama\n127.284427,2015-11-18,653428261,137.0,The Hunger Games: Mockingjay - Part 2,6.6,3984,Extended Feature (2–2.5 hours),Action\n127.084938,2008-11-20,392616625,122.0,Twilight,5.8,3561,Extended Feature (2–2.5 hours),Adventure\n126.393695,1977-05-25,775398007,121.0,Star Wars,8.1,6624,Extended Feature (2–2.5 hours),Adventure\n125.114374,2012-06-21,538983207,93.0,Brave,6.7,4641,Standard Feature (1.5–2 hours),Adventure\n123.630332,2003-12-01,1118888979,201.0,The Lord of the Rings: The Return of the King,8.1,8064,Epic (3+ hours),Adventure\n121.463076,1994-10-08,213928762,154.0,Pulp Fiction,8.3,8428,Long Feature (2.5–3 hours),Thriller\n120.965743,2014-12-10,956019788,144.0,The Hobbit: The Battle of the Five Armies,7.1,4760,Extended Feature (2–2.5 hours),Action\n120.725053,2008-04-30,585174222,126.0,Iron Man,7.4,8776,Extended Feature (2–2.5 hours),Action\n120.09361,2015-07-14,519311965,117.0,Ant-Man,7.0,5880,Standard Feature (1.5–2 hours),Science\n118.968562,2001-07-20,274925095,125.0,Spirited Away,8.3,3840,Extended Feature (2–2.5 hours),Adventure\n118.078691,2014-05-15,747862775,131.0,X-Men: Days of Future Past,7.5,6032,Extended Feature (2–2.5 hours),Action\n116.840296,2014-06-25,1091405097,165.0,Transformers: Age of Extinction,5.8,3095,Long Feature (2.5–3 hours),Science\n116.700319,2015-03-04,104399548,120.0,Chappie,6.6,3062,Extended Feature (2–2.5 hours),Action\n115.699814,2007-05-01,890871626,139.0,Spider-Man 3,5.9,3576,Extended Feature (2–2.5 hours),Action\n115.597753,2014-12-17,349424282,97.0,Night at the Museum: Secret of the Tomb,6.1,1851,Standard Feature (1.5–2 hours),Adventure\n115.241998,2014-07-14,126546825,89.0,Lucy,6.3,5878,Compact Feature (1–1.5 hours),Action\n115.040024,2005-06-10,374218673,140.0,Batman Begins,7.5,7359,Extended Feature (2–2.5 hours),Action\n114.52223700000002,2015-07-23,682330139,131.0,Mission: Impossible - Rogue Nation,7.1,3224,Extended Feature (2–2.5 hours),Action\n113.858273,2010-07-08,543513985,95.0,Despicable Me,7.1,6478,Standard Feature (1.5–2 hours),Other\n113.161483,2015-09-09,311256926,132.0,Maze Runner: The Scorch Trials,6.4,3040,Extended Feature (2–2.5 hours),Action\n112.31295,2012-07-16,1084939099,165.0,The Dark Knight Rises,7.6,9106,Long Feature (2.5–3 hours),Action\n110.620647,2014-05-28,758539785,97.0,Maleficent,7.0,4496,Standard Feature (1.5–2 hours),Adventure\n110.153618,2013-09-27,716392705,91.0,Gravity,7.3,5751,Standard Feature (1.5–2 hours),Science\n109.984351,2001-11-16,976475550,152.0,Harry Potter and the Philosopher's Stone,7.5,7006,Long Feature (2.5–3 hours),Adventure\n109.68478799999998,2003-05-23,484572835,101.0,Bruce Almighty,6.4,3012,Standard Feature (1.5–2 hours),Other\n109.528572,1997-05-07,263920180,126.0,The Fifth Element,7.3,3885,Extended Feature (2–2.5 hours),Adventure\n108.849621,2012-11-26,1021103568,169.0,The Hobbit: An Unexpected Journey,7.0,8297,Long Feature (2.5–3 hours),Adventure\n107.928811,2008-10-30,586090727,106.0,Quantum of Solace,6.1,2965,Standard Feature (1.5–2 hours),Adventure\n107.376788,2015-10-26,880674609,148.0,Spectre,6.3,4466,Extended Feature (2–2.5 hours),Action\n107.069763,2010-06-23,698491347,124.0,The Twilight Saga: Eclipse,5.8,2301,Extended Feature (2–2.5 hours),Adventure\n106.914973,2002-12-18,926287400,179.0,The Lord of the Rings: The Two Towers,8.0,7487,Long Feature (2.5–3 hours),Adventure\n106.815545,2001-11-01,562816256,92.0,"Monsters, Inc.",7.5,5996,Standard Feature (1.5–2 hours),Other\n105.792936,1974-12-20,47542841,200.0,The Godfather: Part II,8.3,3338,Epic (3+ hours),Drama\n104.469351,1993-11-29,321365567,195.0,Schindler's List,8.3,4329,Epic (3+ hours),Drama\n104.309993,1999-03-30,463517383,136.0,The Matrix,7.9,8907,Extended Feature (2–2.5 hours),Action\n104.121555,1997-07-02,589390539,98.0,Men in Black,6.9,4412,Standard Feature (1.5–2 hours),Action\n103.718387,2015-03-18,295238201,119.0,Insurgent,6.2,3829,Standard Feature (1.5–2 hours),Adventure\n103.698022,1999-12-10,284600000,189.0,The Green Mile,8.2,4048,Epic (3+ hours),Drama\n102.322217,2015-04-01,1506249360,137.0,Furious 7,7.3,4176,Extended Feature (2–2.5 hours),Action\n101.74155,1991-07-01,520000000,137.0,Terminator 2: Judgment Day,7.7,4185,Extended Feature (2–2.5 hours),Action\n101.599427,2014-12-03,268031828,150.0,Exodus: Gods and Kings,5.6,1921,Long Feature (2.5–3 hours),Adventure\n101.250416,2005-11-05,895921036,157.0,Harry Potter and the Goblet of Fire,7.5,5608,Long Feature (2.5–3 hours),Adventure\n101.187052,2015-03-12,543514353,105.0,Cinderella,6.7,2374,Standard Feature (1.5–2 hours),Drama\n100.876794,2015-02-04,14674076,100.0,It Follows,6.6,1832,Standard Feature (1.5–2 hours),Thriller\n100.635882,2015-12-25,532950503,156.0,The Revenant,7.3,6396,Long Feature (2.5–3 hours),Drama\n100.412364,2015-05-27,470490832,114.0,San Andreas,6.0,2968,Standard Feature (1.5–2 hours),Action\n100.348805,2013-08-07,269994119,110.0,We're the Millers,6.8,2972,Standard Feature (1.5–2 hours),Other\n100.21391,2014-06-12,609123048,102.0,How to Train Your Dragon 2,7.6,3106,Standard Feature (1.5–2 hours),Action\n100.025899,1997-11-18,1845034188,194.0,Titanic,7.5,7562,Epic (3+ hours),Drama\n99.687084,2012-11-13,829000000,115.0,The Twilight Saga: Breaking Dawn - Part 2,6.1,2553,Standard Feature (1.5–2 hours),Adventure\n99.561972,2002-03-10,383257136,81.0,Ice Age,7.1,3857,Compact Feature (1–1.5 hours),Adventure\n99.499595,2013-10-29,644571402,112.0,Thor: The Dark World,6.8,4755,Standard Feature (1.5–2 hours),Action\n99.398009,2013-06-12,662845518,143.0,Man of Steel,6.5,6359,Extended Feature (2–2.5 hours),Action\n98.885637,2009-07-07,933959197,153.0,Harry Potter and the Half-Blood Prince,7.4,5293,Long Feature (2.5–3 hours),Adventure\n98.755657,2015-02-11,571006128,125.0,Fifty Shades of Grey,5.2,3254,Extended Feature (2–2.5 hours),Drama\n95.9229,2013-10-18,187000000,134.0,12 Years a Slave,7.9,3674,Extended Feature (2–2.5 hours),Drama\n95.914473,2004-07-15,347234916,115.0,"I, Robot",6.7,3793,Standard Feature (1.5–2 hours),Action\n95.301296,2000-05-01,457640427,155.0,Gladiator,7.9,5439,Long Feature (2.5–3 hours),Action\n95.130041,2015-01-21,36869414,108.0,Ex Machina,7.6,4737,Standard Feature (1.5–2 hours),Drama\n95.007934,2013-12-25,392000694,180.0,The Wolf of Wall Street,7.9,6571,Epic (3+ hours),Drama\n94.815867,2009-03-15,709827462,130.0,The Twilight Saga: New Moon,5.6,2436,Extended Feature (2–2.5 hours),Adventure\n94.370564,2013-12-11,958400000,161.0,The Hobbit: The Desolation of Smaug,7.6,4524,Long Feature (2.5–3 hours),Adventure\n94.199316,2016-04-07,966550600,106.0,The Jungle Book,6.7,2892,Standard Feature (1.5–2 hours),Adventure\n94.184658,1979-05-25,104931801,117.0,Alien,7.9,4470,Standard Feature (1.5–2 hours),Action\n94.056131,1982-06-25,33139618,117.0,Blade Runner,7.9,3509,Standard Feature (1.5–2 hours),Science\n93.067866,1960-06-16,32000000,109.0,Psycho,8.2,2320,Standard Feature (1.5–2 hours),Drama\n93.004993,2012-10-25,1108561013,143.0,Skyfall,6.9,7604,Extended Feature (2–2.5 hours),Action\n92.982009,1992-11-25,504050219,90.0,Aladdin,7.4,3416,Standard Feature (1.5–2 hours),Adventure\n92.201962,2009-05-13,735099082,96.0,Up,7.7,6870,Standard Feature (1.5–2 hours),Adventure\n91.332849,2002-07-03,441818803,88.0,Men in Black II,6.0,3114,Compact Feature (1–1.5 hours),Action\n91.285683,2010-12-02,327803731,108.0,Black Swan,7.3,4430,Standard Feature (1.5–2 hours),Drama\n90.809408,2006-05-27,83258226,118.0,Pan's Labyrinth,7.6,3041,Standard Feature (1.5–2 hours),Drama\n90.457886,1994-06-23,788241776,89.0,The Lion King,8.0,5376,Compact Feature (1–1.5 hours),Drama\n90.33681,2012-08-08,276572938,120.0,The Bourne Legacy,6.0,2651,Extended Feature (2–2.5 hours),Action\n90.23792,2016-08-02,745000000,123.0,Suicide Squad,5.9,7458,Extended Feature (2–2.5 hours),Action\n89.938296,2011-10-25,371940071,107.0,The Adventures of Tintin,6.7,2061,Standard Feature (1.5–2 hours),Adventure\n89.866276,2012-06-27,752215857,136.0,The Amazing Spider-Man,6.5,6586,Extended Feature (2–2.5 hours),Action\n89.811154,2014-08-27,103215094,119.0,Birdman,7.4,4535,Standard Feature (1.5–2 hours),Drama\n89.270217,2014-04-16,705717432,142.0,The Amazing Spider-Man 2,6.5,4179,Extended Feature (2–2.5 hours),Action\n89.186492,2013-06-20,743559607,104.0,Monsters University,7.0,3528,Standard Feature (1.5–2 hours),Other\n89.095538,2014-10-23,38697217,117.0,Nightcrawler,7.6,3395,Standard Feature (1.5–2 hours),Drama\n88.935165,2006-11-14,599045960,144.0,Casino Royale,7.3,3855,Extended Feature (2–2.5 hours),Adventure\n88.84477700000002,2014-12-16,325771424,109.0,Taken 3,6.1,2200,Standard Feature (1.5–2 hours),Thriller\n88.496873,2013-09-18,122126687,153.0,Prisoners,7.9,3085,Long Feature (2.5–3 hours),Drama\n88.377076,1966-12-23,6000000,161.0,"The Good, the Bad and the Ugly",8.1,2311,Long Feature (2.5–3 hours),Other\n87.53437,2014-12-11,542307423,133.0,American Sniper,7.4,4469,Extended Feature (2–2.5 hours),Action\n87.350802,1998-11-25,363258859,95.0,A Bug's Life,6.8,2303,Standard Feature (1.5–2 hours),Adventure\n86.493424,2011-04-21,449326618,115.0,Thor,6.6,6525,Standard Feature (1.5–2 hours),Adventure\n86.47681700000004,2002-06-14,214034224,119.0,The Bourne Identity,7.3,3583,Standard Feature (1.5–2 hours),Action\n86.201184,1968-04-10,68700000,149.0,2001: A Space Odyssey,7.9,2998,Extended Feature (2–2.5 hours),Science\n86.105615,2016-03-09,179246868,121.0,Allegiant,5.9,1998,Extended Feature (2–2.5 hours),Adventure\n85.688789,2003-05-30,940335536,100.0,Finding Nemo,7.6,6122,Standard Feature (1.5–2 hours),Other\n85.428395,2014-08-20,39407616,102.0,Sin City: A Dame to Kill For,6.3,1286,Standard Feature (1.5–2 hours),Thriller\n85.36908000000003,2015-02-04,183987723,124.0,Jupiter Ascending,5.2,2768,Extended Feature (2–2.5 hours),Science\n85.30318,1994-07-29,351583407,101.0,The Mask,6.6,2472,Standard Feature (1.5–2 hours),Other\n85.11505799999998,2006-03-23,660940780,91.0,Ice Age: The Meltdown,6.5,2951,Standard Feature (1.5–2 hours),Adventure\n84.68964799999998,2008-06-04,631744560,90.0,Kung Fu Panda,6.9,3145,Standard Feature (1.5–2 hours),Adventure\n84.630969,2006-03-15,132511035,132.0,V for Vendetta,7.7,4442,Extended Feature (2–2.5 hours),Action\n84.366984,2014-11-22,373552094,92.0,Penguins of Madagascar,6.5,1346,Standard Feature (1.5–2 hours),Adventure\n83.89325699999998,2006-06-30,326551094,109.0,The Devil Wears Prada,7.0,3088,Standard Feature (1.5–2 hours),Drama\n83.295796,2014-01-26,222809600,106.0,Non-Stop,6.8,2268,Standard Feature (1.5–2 hours),Action\n82.975841,2014-07-17,108782847,104.0,The Purge: Anarchy,6.6,1954,Standard Feature (1.5–2 hours),Thriller\n82.643036,2006-06-08,461983149,117.0,Cars,6.6,3877,Standard Feature (1.5–2 hours),Adventure\n82.502566,2002-05-01,821708551,121.0,Spider-Man,6.8,5265,Extended Feature (2–2.5 hours),Action\n82.21166,2009-06-05,459270619,100.0,The Hangover,7.2,6173,Standard Feature (1.5–2 hours),Other\n82.185281,2014-11-26,107670357,108.0,Horrible Bosses 2,6.1,1536,Standard Feature (1.5–2 hours),Other\n82.121691,2012-12-25,425368238,165.0,Django Unchained,7.8,10099,Long Feature (2.5–3 hours),Drama\n82.05205600000002,2015-04-16,65663276,112.0,The Age of Adaline,7.4,1990,Standard Feature (1.5–2 hours),Drama\n81.91469599999998,2010-02-18,294804195,138.0,Shutter Island,7.8,6336,Extended Feature (2–2.5 hours),Drama\n81.834855,2013-06-20,531865000,116.0,World War Z,6.7,5560,Standard Feature (1.5–2 hours),Action\n81.829237,2003-09-19,95708457,121.0,Underworld,6.6,2512,Extended Feature (2–2.5 hours),Action\n81.781591,2009-05-20,413106170,105.0,Night at the Museum: Battle of the Smithsonian,5.9,1971,Standard Feature (1.5–2 hours),Adventure\n81.49962099999998,2011-11-22,334615000,129.0,Sherlock Holmes: A Game of Shadows,7.0,3886,Extended Feature (2–2.5 hours),Adventure\n81.487685,1992-11-19,358991681,120.0,Home Alone 2: Lost in New York,6.3,2395,Extended Feature (2–2.5 hours),Adventure\n80.972475,1989-05-24,474171806,127.0,Indiana Jones and the Last Crusade,7.6,3152,Extended Feature (2–2.5 hours),Adventure\n80.879032,2008-02-18,226830568,93.0,Taken,7.2,4369,Standard Feature (1.5–2 hours),Action\n80.87860500000002,1999-09-15,356296601,122.0,American Beauty,7.9,3313,Extended Feature (2–2.5 hours),Drama\n80.581367,2006-12-14,307077295,117.0,The Pursuit of Happyness,7.7,2525,Standard Feature (1.5–2 hours),Drama\n80.316463,2014-03-14,288747895,139.0,Divergent,6.9,4663,Extended Feature (2–2.5 hours),Adventure\n80.171283,1937-12-20,184925486,83.0,Snow White and the Seven Dwarfs,6.9,1914,Compact Feature (1–1.5 hours),Other\n79.92205899999998,2014-09-24,192330738,132.0,The Equalizer,7.1,2954,Extended Feature (2–2.5 hours),Thriller\n79.75496600000002,2003-10-10,180949000,111.0,Kill Bill: Vol. 1,7.7,4949,Standard Feature (1.5–2 hours),Action\n79.679601,2004-05-31,789804554,141.0,Harry Potter and the Prisoner of Azkaban,7.7,5877,Extended Feature (2–2.5 hours),Adventure\n79.579532,1995-09-22,327311859,127.0,Se7en,8.1,5765,Extended Feature (2–2.5 hours),Thriller\n79.456485,2014-05-27,370541256,113.0,Edge of Tomorrow,7.6,4858,Standard Feature (1.5–2 hours),Action\n78.699993,1980-05-22,44017374,144.0,The Shining,8.1,3757,Extended Feature (2–2.5 hours),Thriller\n78.530105,2010-03-03,1025491110,108.0,Alice in Wonderland,6.4,4645,Standard Feature (1.5–2 hours),Adventure\n78.51783,1980-05-17,538400000,124.0,The Empire Strikes Back,8.2,5879,Extended Feature (2–2.5 hours),Adventure\n78.29101800000002,2013-05-05,467365246,132.0,Star Trek Into Darkness,7.4,4418,Extended Feature (2–2.5 hours),Action\n78.14439499999997,2007-06-28,938212738,138.0,Harry Potter and the Order of the Phoenix,7.4,5494,Extended Feature (2–2.5 hours),Adventure\n77.817571,2004-11-05,631442092,115.0,The Incredibles,7.4,5152,Standard Feature (1.5–2 hours),Action\n77.77476999999998,2011-12-07,694713380,133.0,Mission: Impossible - Ghost Protocol,6.8,3972,Extended Feature (2–2.5 hours),Action\n77.68208,2013-04-18,1215439994,130.0,Iron Man 3,6.8,8806,Extended Feature (2–2.5 hours),Action\n77.58066099999998,2010-08-03,274470394,103.0,The Expendables,6.0,2926,Standard Feature (1.5–2 hours),Thriller\n77.30019399999998,2010-04-28,623933331,124.0,Iron Man 2,6.6,6849,Extended Feature (2–2.5 hours),Adventure\n77.178973,2012-05-30,396600000,127.0,Snow White and the Huntsman,5.8,3118,Extended Feature (2–2.5 hours),Adventure\n76.842247,2014-07-23,243400000,99.0,Hercules,5.6,1680,Standard Feature (1.5–2 hours),Action\n76.840712,2004-12-09,362744280,125.0,Ocean's Twelve,6.4,2124,Extended Feature (2–2.5 hours),Thriller\n76.60323299999997,1985-07-03,381109762,116.0,Back to the Future,8.0,6079,Standard Feature (1.5–2 hours),Adventure\n76.310119,2013-11-15,847423452,146.0,The Hunger Games: Catching Fire,7.4,6495,Extended Feature (2–2.5 hours),Adventure\n76.04186700000002,1998-07-24,481840909,169.0,Saving Private Ryan,7.9,5048,Long Feature (2.5–3 hours),Drama\n75.674458,2008-05-21,786636033,122.0,Indiana Jones and the Kingdom of the Crystal Skull,5.7,2495,Extended Feature (2–2.5 hours),Adventure\n75.290998,1996-05-22,457696359,110.0,Mission: Impossible,6.7,2631,Standard Feature (1.5–2 hours),Adventure\n74.64653,2015-03-11,71561644,114.0,Run All Night,6.3,1148,Standard Feature (1.5–2 hours),Action\n74.50624599999998,2011-07-22,370569774,124.0,Captain America: The First Avenger,6.6,7047,Extended Feature (2–2.5 hours),Action\n74.440708,2006-10-19,109676311,130.0,The Prestige,8.0,4391,Extended Feature (2–2.5 hours),Drama\n74.417456,2014-02-26,174600318,99.0,The Grand Budapest Hotel,8.0,4519,Standard Feature (1.5–2 hours),Drama\n74.358971,2014-05-16,307166834,125.0,The Fault in Our Stars,7.6,3759,Extended Feature (2–2.5 hours),Drama\n74.23479300000002,1984-10-26,78371200,108.0,The Terminator,7.3,4128,Standard Feature (1.5–2 hours),Action\n74.16801600000002,2014-12-25,12342632,112.0,The Interview,6.1,2304,Standard Feature (1.5–2 hours),Action\n73.987775,2012-04-12,66486080,95.0,The Cabin in the Woods,6.5,2263,Standard Feature (1.5–2 hours),Thriller\n73.94404899999998,2002-12-25,352114312,141.0,Catch Me If You Can,7.7,3795,Extended Feature (2–2.5 hours),Drama\n73.872343,2012-10-26,130482868,172.0,Cloud Atlas,6.6,2977,Long Feature (2.5–3 hours),Drama\n73.82289,2008-06-19,258270008,110.0,Wanted,6.4,2528,Standard Feature (1.5–2 hours),Action\n73.79505,2010-12-10,400062763,125.0,TRON: Legacy,6.3,2841,Extended Feature (2–2.5 hours),Adventure\n73.720244,2001-04-25,173921954,122.0,Amélie,7.8,3310,Extended Feature (2–2.5 hours),Other\n73.640445,1995-10-30,373554033,81.0,Toy Story,7.7,5269,Compact Feature (1–1.5 hours),Other`
  },
]

// Aggregation helpers
function aggregateByCategory(
  rows: any[],
  categoryCol: string,
  valueCol: string | null
): { labels: string[]; values: number[] } {
  const result: Record<string, number> = {}
  rows.forEach((row: any) => {
    const cat = row[categoryCol]
    if (valueCol) {
      const val = Number(row[valueCol])
      if (!isNaN(val)) {
        result[cat] = (result[cat] || 0) + val
      }
    } else {
      result[cat] = (result[cat] || 0) + 1
    }
  })
  return { labels: Object.keys(result), values: Object.values(result) }
}

// Helper to infer column type
function inferColumnType(values: any[]): 'numeric' | 'categorical' | 'date' {
  // Filter out empty/null/undefined
  const nonEmpty = values.filter(v => v !== undefined && v !== null && v !== '')
  if (nonEmpty.length === 0) return 'categorical'
  const numericCount = nonEmpty.filter(v => !isNaN(Number(v))).length
  const dateCount = nonEmpty.filter(v => !isNaN(Date.parse(v))).length
  if (numericCount / nonEmpty.length >= 0.8) return 'numeric'
  if (dateCount / nonEmpty.length >= 0.8) return 'date'
  return 'categorical'
}

// Helper to detect numeric ordinal (integer, small unique set)
function isNumericOrdinal(values: any[]): boolean {
  const nonEmpty = values.filter(v => v !== undefined && v !== null && v !== '')
  if (nonEmpty.length === 0) return false
  // All values are integers
  if (!nonEmpty.every(v => Number.isInteger(Number(v)))) return false
  // Small number of unique values (2-10)
  const unique = Array.from(new Set(nonEmpty.map(v => Number(v))))
  return unique.length >= 2 && unique.length <= 10
}

// Number formatting utility
function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

// Utility to determine the best unit for axis ticks
function getUnit(maxValue: number) {
  if (maxValue >= 1e9) return { divisor: 1e9, suffix: 'b' };
  if (maxValue >= 1e6) return { divisor: 1e6, suffix: 'm' };
  if (maxValue >= 1e3) return { divisor: 1e3, suffix: 'k' };
  return { divisor: 1, suffix: '' };
}

// Utility to truncate axis labels
function truncateLabel(label: string, maxLen = 7): string {
  if (typeof label !== 'string') label = String(label);
  return label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
}

// Helper to check if adding a column would result in any compatible chart
function isColumnAddable(col: string, selected: string[], columns: string[], types: Record<string, string>, rows: any[]): boolean {
  if (selected.includes(col)) return true;
  const newSelection = [...selected, col];
  // Try all chart types/variants
  for (const type of Object.keys(CHART_VARIANTS)) {
    const variants = CHART_VARIANTS[type];
    for (const variant of variants) {
      if (variant.isCompatible(newSelection, types, rows)) {
        return true;
      }
    }
  }
  return false;
}

// Helper to auto-select a valid set of columns for a chart type
function getAutoSelectColumns(chartType: string, columns: string[], types: Record<string, string>, rows: any[]): string[] | null {
  const variants = chartType === 'All' ? Object.values(CHART_VARIANTS).flat() : CHART_VARIANTS[chartType] || [];
  // Try all combinations of columns up to 3 (or 4 for bar)
  for (let k = 1; k <= Math.min(4, columns.length); k++) {
    const combos = combinations(columns, k);
    for (const combo of combos) {
      for (const variant of variants) {
        if (variant.isCompatible(combo, types, rows)) {
          return combo;
        }
      }
    }
  }
  return null;
}

// Helper to get all k-combinations of an array
function combinations(arr: string[], k: number): string[][] {
  if (k === 1) return arr.map(x => [x]);
  const result: string[][] = [];
  arr.forEach((v, i) => {
    combinations(arr.slice(i + 1), k - 1).forEach(tail => {
      result.push([v, ...tail]);
    });
  });
  return result;
}

// Utility to truncate legend labels
function truncateLegendLabel(label: string, maxLen = 10): string {
  if (typeof label !== 'string') label = String(label);
  return label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
}

// Helper to get all valid chart bindings for each chart type
function getSampleChartBindings(columns: string[], columnTypes: Record<string, string>, rows: any[]): { type: string, variant: ChartVariant, columns: string[] }[] {
  const result: { type: string, variant: ChartVariant, columns: string[] }[] = [];
  for (const type of Object.keys(CHART_VARIANTS)) {
    for (const variant of CHART_VARIANTS[type]) {
      // Try all combinations of columns up to 3 (for bubble/grouped/stacked)
      for (let k = 1; k <= 3; k++) {
        const combos = combinations(columns, k);
        for (const combo of combos) {
          if (variant.isCompatible(combo, columnTypes, rows)) {
            result.push({ type, variant, columns: combo });
            break; // Only need one valid binding per variant
          }
        }
        if (result.some(r => r.type === type)) break; // Only one per type
      }
      if (result.some(r => r.type === type)) break;
    }
  }
  return result.slice(0, 9); // Up to 9 charts
}

// Helper to generate a dynamic, descriptive chart title
function getChartTitle(type: string, variant: ChartVariant, binding: string[], columnTypes: Record<string, string>, rows: any[]): string {
  if (type === 'Pie') {
    if (binding.length === 1 && columnTypes[binding[0]] === 'categorical') {
      return `Distribution of ${binding[0]}`;
    } else if (binding.length === 2) {
      const cat = columnTypes[binding[0]] === 'categorical' ? binding[0] : binding[1];
      const num = columnTypes[binding[0]] === 'numeric' ? binding[0] : binding[1];
      return `Share of ${num} by ${cat}`;
    }
  }
  if (type === 'Bar') {
    if (binding.length === 1) {
      return `Count of ${binding[0]}`;
    } else if (binding.length === 2) {
      const cat = columnTypes[binding[0]] === 'categorical' || columnTypes[binding[0]] === 'date' ? binding[0] : binding[1];
      const num = cat === binding[0] ? binding[1] : binding[0];
      return `Sum of ${num} by ${cat}`;
    } else if (binding.length > 2) {
      const cat = binding.find(col => columnTypes[col] === 'categorical' || columnTypes[col] === 'date');
      const nums = binding.filter(col => columnTypes[col] === 'numeric');
      return `Comparison of ${nums.join(', ')} by ${cat}`;
    }
  }
  if (type === 'Line') {
    if (binding.length === 2) {
      const x = binding[0], y = binding[1];
      return `Trend of ${y} over ${x}`;
    } else if (binding.length === 3) {
      const date = binding.find(col => columnTypes[col] === 'date');
      const cat = binding.find(col => columnTypes[col] === 'categorical');
      const num = binding.find(col => columnTypes[col] === 'numeric');
      return `Trends of ${num} by ${cat} over ${date}`;
    }
  }
  if (type === 'Scatter') {
    if (binding.length === 2) {
      return `Relationship between ${binding[0]} and ${binding[1]}`;
    } else if (binding.length === 3) {
      return `Relationship between ${binding[0]} and ${binding[1]} (bubble size: ${binding[2]})`;
    }
  }
  if (type === 'Histogram') {
    return `Distribution of ${binding[0]}`;
  }
  return `${type} chart: ${binding.join(', ')}`;
}

// Icon components for column types
const CategoricalIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.32617 3.66669C3.32617 3.1144 3.77389 2.66669 4.32617 2.66669H11.6595C12.2118 2.66669 12.6595 3.1144 12.6595 3.66669V4.89993C12.6595 5.17607 12.4356 5.39993 12.1595 5.39993C11.8834 5.39993 11.6595 5.17607 11.6595 4.89993V4.0006C11.6595 3.81628 11.5099 3.66695 11.3256 3.66726L8.4983 3.67215L8.50563 11.6667C8.50563 12.0349 8.8041 12.3334 9.17229 12.3334H10.1101C10.3863 12.3334 10.6101 12.5572 10.6101 12.8334C10.6101 13.1095 10.3863 13.3334 10.1101 13.3334H5.9011C5.62496 13.3334 5.4011 13.1095 5.4011 12.8334C5.4011 12.5572 5.62496 12.3334 5.9011 12.3334H6.83896C7.20715 12.3334 7.50563 12.0349 7.50563 11.6667L7.4983 3.67215L4.66008 3.66726C4.47576 3.66694 4.32617 3.81628 4.32617 4.00059V4.91837C4.32617 5.19451 4.10231 5.41837 3.82617 5.41837C3.55003 5.41837 3.32617 5.19451 3.32617 4.91837V3.66669Z" fill="currentColor"/>
  </svg>
);
const NumericIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.29549 4.75541V11.2446H2.29181V5.73766H2.25296L0.666504 6.7516V5.81371L2.32095 4.75541H3.29549Z" fill="currentColor"/>
    <path d="M5.08916 11.2446V10.5349L7.33286 8.25984C7.57245 8.01269 7.76995 7.79618 7.92535 7.61029C8.08292 7.42228 8.20056 7.24379 8.27826 7.0748C8.35596 6.90581 8.39482 6.72626 8.39482 6.53614C8.39482 6.32068 8.34301 6.13479 8.23941 5.97847C8.1358 5.82005 7.99442 5.69858 7.81527 5.61409C7.63612 5.52748 7.43431 5.48418 7.20983 5.48418C6.9724 5.48418 6.76519 5.53171 6.5882 5.62676C6.41121 5.72182 6.27522 5.85596 6.18025 6.02917C6.08528 6.20239 6.03779 6.40517 6.03779 6.63754H5.08268C5.08268 6.24252 5.1755 5.89715 5.36112 5.60141C5.54675 5.30568 5.80144 5.07649 6.12521 4.91384C6.44898 4.74907 6.81699 4.66669 7.22926 4.66669C7.64584 4.66669 8.01277 4.74801 8.33006 4.91067C8.64951 5.07121 8.89881 5.29089 9.07796 5.56973C9.25711 5.84645 9.34669 6.15908 9.34669 6.50763C9.34669 6.74844 9.30028 6.98397 9.20747 7.21422C9.11682 7.44446 8.95817 7.70112 8.73153 7.98418C8.5049 8.26512 8.18976 8.60627 7.78613 9.00762L6.4684 10.3574V10.405H9.45353V11.2446H5.08916Z" fill="currentColor"/>
    <path d="M12.9891 11.3334C12.5444 11.3334 12.1473 11.2584 11.7976 11.1084C11.4501 10.9584 11.1749 10.7503 10.972 10.4842C10.7713 10.2159 10.6633 9.90539 10.6482 9.55262H11.6649C11.6778 9.74484 11.7436 9.91172 11.8624 10.0533C11.9832 10.1927 12.1408 10.3004 12.3351 10.3764C12.5293 10.4525 12.7452 10.4905 12.9826 10.4905C13.2438 10.4905 13.4747 10.4462 13.6755 10.3574C13.8783 10.2687 14.037 10.1451 14.1514 9.98671C14.2658 9.82617 14.323 9.64134 14.323 9.43221C14.323 9.21464 14.2658 9.02347 14.1514 8.8587C14.0392 8.69182 13.874 8.56086 13.656 8.4658C13.4402 8.37074 13.179 8.32321 12.8725 8.32321H12.3124V7.52473H12.8725C13.1186 7.52473 13.3344 7.48143 13.52 7.39482C13.7078 7.30822 13.8546 7.18781 13.9604 7.03361C14.0661 6.87729 14.119 6.69457 14.119 6.48544C14.119 6.28477 14.0726 6.1105 13.9798 5.96263C13.8891 5.81265 13.7596 5.69542 13.5913 5.61092C13.4251 5.52642 13.2287 5.48418 13.002 5.48418C12.7862 5.48418 12.5844 5.52326 12.3966 5.60141C12.2109 5.67746 12.0599 5.7873 11.9433 5.93095C11.8267 6.07247 11.7641 6.24252 11.7555 6.44108H10.7875C10.7982 6.09043 10.904 5.78202 11.1047 5.51586C11.3076 5.2497 11.5753 5.04163 11.9077 4.89166C12.2401 4.74168 12.6092 4.66669 13.015 4.66669C13.4402 4.66669 13.8071 4.74801 14.1158 4.91067C14.4266 5.07121 14.6662 5.28561 14.8345 5.55389C15.0051 5.82216 15.0892 6.11578 15.0871 6.43475C15.0892 6.79808 14.9856 7.10648 14.7763 7.35997C14.569 7.61346 14.2928 7.7835 13.9474 7.87011V7.92081C14.3877 7.98629 14.7288 8.15739 14.9705 8.43411C15.2144 8.71084 15.3353 9.0541 15.3331 9.4639C15.3353 9.82089 15.2338 10.1409 15.0288 10.424C14.8259 10.707 14.5485 10.9299 14.1967 11.0925C13.8449 11.2531 13.4423 11.3334 12.9891 11.3334Z" fill="currentColor"/>
  </svg>
);

// Utility to convert column names to user-friendly labels
function toFriendlyLabel(col: string): string {
  // Replace underscores with spaces
  let label = col.replace(/_/g, ' ');
  // Split camel case (e.g., VoteCount -> Vote Count)
  label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Lowercase all, then capitalize first letter
  label = label.toLowerCase();
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label;
}

export const MagicCharts = () => {
  // State for which screen is shown
  const [screen, setScreen] = useState<'data' | 'columns'>('data')
  // State for columns (real columns from data)
  const [columns, setColumns] = useState<string[]>([])
  // State for parsed data rows
  const [rows, setRows] = useState<any[]>([])
  // State for inferred column types
  const [columnTypes, setColumnTypes] = useState<Record<string, 'numeric' | 'categorical' | 'date'>>({})
  // State for selected columns and chart type filter
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [activeChartType, setActiveChartType] = useState<string>('All')
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [palette, setPalette] = useState<string[]>(defaultPalette)

  useEffect(() => {
    const resolved = chartVarNames.map(getCssVarValue)
    if (resolved.every(Boolean)) setPalette(resolved)
  }, [])

  // Chart.js options matching ChartGallery, now with number formatting
  const barOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            return label + ': ' + formatNumber(context.parsed.y ?? context.raw);
          },
        },
      },
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        ticks: {
          callback: function(value: any, index: number, values: any) {
            // Use the label from the values array if available (Chart.js v3+)
            if (Array.isArray(values) && values[index] && values[index].label) {
              return truncateLabel(values[index].label);
            }
            // Fallback: use value as label
            return truncateLabel(value);
          },
        },
      },
      y: {
        ticks: {
          callback: function(value: any) {
            // Truncate y axis labels (if categorical)
            return truncateLabel(value);
          },
        },
      },
    },
  }
  const legendOptions = {
    display: true,
    labels: {
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
      pointStyle: 'circle',
      font: { size: 11 },
      padding: 8,
      color: '#444',
      textAlign: 'left',
      generateLabels: function(chart: Chart) {
        // Chart.defaults.plugins.legend.labels.generateLabels is always available
        const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
        return original.map((item: any) => ({
          ...item,
          text: truncateLegendLabel(item.text, 10),
        }));
      },
    },
  };
  const lineOptions = {
    plugins: {
      legend: { ...legendOptions },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return label + ': ' + formatNumber(value);
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: function(value: any) {
            // Improved rounding: max 2 decimals, remove trailing zeros
            const num = Number(value);
            if (Math.abs(num) >= 1000) return formatNumber(num);
            return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.0+$/, '').replace(/(\.[1-9]*)0+$/, '$1');
          }
        }
      }
    },
  }
  const histogramOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return label + ': ' + formatNumber(value);
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: function(value: any) {
            return formatNumber(Number(value));
          }
        }
      }
    },
  }
  // For scatter, add formatting to tooltips and axes
  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { ...legendOptions },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const x = context.parsed.x;
            const y = context.parsed.y;
            return `${label}: (${formatNumber(x)}, ${formatNumber(y)})`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: function(value: any) {
            return formatNumber(Number(value));
          }
        }
      },
      y: {
        ticks: {
          callback: function(value: any) {
            return formatNumber(Number(value));
          }
        }
      }
    }
  }

  // Scatter/Line chart options with axis label truncation
  const scatterLineOptions = {
    plugins: {
      legend: { display: true },
      tooltip: {},
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          callback: function(value: any) {
            return truncateLabel(value);
          },
        },
      },
      y: {
        ticks: {
          callback: function(value: any) {
            return truncateLabel(value);
          },
        },
      },
    },
  };

  // Handler for column selection (multi-select for now)
  const handleColumnToggle = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  // Handle file upload and parse columns, rows, and infer types
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setColumns(results.meta.fields as string[])
            setRows(results.data as any[])
            // Infer types
            const types: Record<string, 'numeric' | 'categorical' | 'date'> = {}
            results.meta.fields.forEach(field => {
              const values = (results.data as any[]).map(row => row[field])
              types[field] = inferColumnType(values)
            })
            setColumnTypes(types)
            setSelectedColumns([])
            setScreen('columns')
          }
        },
      })
    }
  }

  // Handle sample dataset selection and parse columns, rows, and infer types
  const handleSampleSelect = (sampleName: string) => {
    const sample = SAMPLE_DATASETS.find(s => s.name === sampleName)
    if (sample) {
      Papa.parse(sample.csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setColumns(results.meta.fields as string[])
            setRows(results.data as any[])
            // Infer types
            const types: Record<string, 'numeric' | 'categorical' | 'date'> = {}
            results.meta.fields.forEach(field => {
              const values = (results.data as any[]).map(row => row[field])
              types[field] = inferColumnType(values)
            })
            setColumnTypes(types)
            setSelectedColumns([])
            setScreen('columns')
          }
        },
      })
    }
  }

  // Before rendering the column selector, sort columns by number of unique values (ascending)
  const columnsByUniqueness = [...columns].sort((a, b) => {
    const uniqueA = new Set(rows.map(r => r[a])).size;
    const uniqueB = new Set(rows.map(r => r[b])).size;
    return uniqueA - uniqueB;
  });

  // Data selection screen
  const renderDataScreen = () => (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">Get Started with Magic Charts</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">Upload your own data or try a sample dataset to explore different ways to visualize your information.</p>
      {/* Upload Section */}
      <button
        className="mb-4 px-8 py-3 rounded-full font-semibold text-white text-base shadow-md transition-colors"
        style={{ background: CANVA_PURPLE }}
        onClick={() => fileInputRef.current?.click()}
      >
        Upload CSV
      </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
        onChange={handleFileUpload}
      />
      {/* Divider */}
      <div className="flex items-center w-full max-w-xs my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="mx-4 text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {/* Sample Datasets */}
      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        {SAMPLE_DATASETS.map((sample) => (
          <div
            key={sample.name}
            className="bg-white rounded-2xl shadow flex items-center justify-between px-6 py-4 border border-gray-100 hover:shadow-lg transition cursor-pointer"
          >
            <div>
              <div className="font-semibold text-gray-900">{sample.name}</div>
              <div className="text-sm text-gray-500">{sample.description}</div>
          </div>
                <button
              className="ml-6 px-5 py-2 rounded-full font-medium text-white text-sm shadow-sm transition-colors"
              style={{ background: CANVA_PURPLE }}
              onClick={() => handleSampleSelect(sample.name)}
            >
              Use
                </button>
          </div>
              ))}
            </div>
          </div>
  )

  // Column selection and chart preview screen
  const renderColumnsScreen = () => {
    // Instantiate the suggestion engine
    const engine = new ChartSuggestionEngine();
    const selectedFields = selectedColumns;
    const data = rows;

    const suggestionResult = engine.suggestCharts(data, selectedFields);
    const suggestions = 'suggestions' in suggestionResult ? suggestionResult.suggestions : [];
    const fieldAnalysis = 'fieldAnalysis' in suggestionResult ? suggestionResult.fieldAnalysis : { dimensions: [], measures: [], dates: [] };
    const reason = 'reason' in suggestionResult ? suggestionResult.reason : undefined;

    // Use suggestions, fieldAnalysis, and reason as needed

    return (
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        {/* Back Button */}
        <div className="mb-6 w-fit flex items-center cursor-pointer select-none" onClick={() => setScreen('data')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2" style={{ display: 'inline', verticalAlign: 'middle' }}>
            <path d="M15 19l-7-7 7-7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-lg font-semibold text-black">Magic Charts</span>
        </div>
        {/* Column Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Columns</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {columnsByUniqueness.map(col => {
              const isSelected = selectedColumns.includes(col);
              const shouldDisable = selectedColumns.length > 0 && !isSelected && !isColumnAddable(col, selectedColumns, columns, columnTypes, rows);
              let state: 'default' | 'hover' | 'selected' | 'disabled' = 'default';
              if (isSelected) state = 'selected';
              else if (shouldDisable) state = 'disabled';
              let leftIcon: React.ReactNode = null;
              if (columnTypes[col] === 'categorical') leftIcon = CategoricalIcon;
              else if (columnTypes[col] === 'numeric') leftIcon = NumericIcon;
              return (
                <ColumnButton
                  key={col}
                  label={toFriendlyLabel(col)}
                  state={state}
                  onClick={() => !shouldDisable && handleColumnToggle(col)}
                  disabled={shouldDisable}
                  leftIcon={leftIcon}
                />
              );
            })}
        </div>
        </div>

        {/* Chart Type Filter Buttons */}
        <div className="w-full flex justify-center my-4">
          <div className="w-full max-w-2xl h-px bg-gray-200" />
        </div>
        <div className="mb-6 flex gap-3 justify-center">
          {CHART_TYPES.map(type => (
            <button
              key={type}
              className={`px-4 py-2 rounded-[8px] border font-semibold text-sm transition-colors
                ${activeChartType === type
                  ? 'bg-[var(--purple-06,#8B3DFF)] text-white border-[var(--purple-06,#8B3DFF)]'
                  : 'bg-white text-[var(--color-canva-text,#0E1318)] border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setActiveChartType(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>

        {/* Chart Preview Grid - now shows all compatible variants for the selected chart type(s) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            if (selectedColumns.length === 0) {
              const sampleCharts = getSampleChartBindings(columns, columnTypes, rows);
              return sampleCharts.map(({ type, variant, columns: binding }, idx) => {
                // Use the same chart rendering logic as for selected columns, but with binding
                let chartComponent = null;
                // --- PIE CHART LOGIC ---
                if (type === 'Pie') {
                  let agg: { labels: string[]; values: number[] } | null = null;
                  if (binding.length === 1 && columnTypes[binding[0]] === 'categorical') {
                    agg = aggregateByCategory(rows, binding[0], null);
                  } else if (binding.length === 2 && columnTypes[binding[0]] === 'categorical' && columnTypes[binding[1]] === 'numeric') {
                    agg = aggregateByCategory(rows, binding[0], binding[1]);
                  }
                  if (!agg || agg.labels.length > 20) return null;
                  let pieOptions: any = { responsive: true };
                  let pieDatasets: any[] = [
                    {
                      label: binding[1] || binding[0],
                      data: agg.values,
                      backgroundColor: palette,
                    },
                  ];
                  if (variant.key === 'donut') {
                    pieOptions.cutout = '60%';
                  }
                  chartComponent = (
                    <div className="flex justify-center items-center w-full h-56">
                      <div className="w-full h-full max-w-[200px] max-h-[200px] aspect-square flex items-center justify-center">
                        <PieChart
                          data={{
                            labels: agg.labels,
                            datasets: pieDatasets,
                          }}
                          options={{ ...pieOptions, maintainAspectRatio: true }}
                          width={200}
                          height={200}
                          className=""
                        />
                      </div>
                    </div>
                  );
                }
                // --- BAR CHART LOGIC ---
                else if (type === 'Bar') {
                  // Count Bar: single categorical or date (vertical)
                  if (variant.key === 'count' && binding.length === 1) {
                    const agg = aggregateByCategory(rows, binding[0], null);
                    const labels = agg.labels;
                    const yMax = Math.max(...agg.values);
                    const { divisor, suffix } = getUnit(yMax);
                    const options = {
                      ...barOptions,
                      maintainAspectRatio: false,
                      scales: {
                        ...barOptions.scales,
                        x: {
                          ...barOptions.scales.x,
                          type: 'category',
                          ticks: {
                            callback: function(value: any) {
                              return truncateLabel(labels[value] ?? value);
                            },
                          },
                        },
                        y: {
                          ...barOptions.scales.y,
                          ticks: {
                            callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                          },
                        },
                      },
                    };
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <BarChart
                            data={{
                              labels: agg.labels,
                              datasets: [
                                {
                                  label: selectedColumns[0],
                                  data: agg.values,
                                  backgroundColor: palette,
                                },
                              ],
                            }}
                            options={options}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Count Horizontal Bar: single categorical
                  else if (variant.key === 'count_horizontal' && binding.length === 1) {
                    const agg = aggregateByCategory(rows, binding[0], null);
                    const labels = agg.labels;
                    const yMax = Math.max(...agg.values);
                    const { divisor, suffix } = getUnit(yMax);
                    const options = {
                      ...barOptions,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      scales: {
                        ...barOptions.scales,
                        y: {
                          ...barOptions.scales.y,
                          type: 'category',
                          ticks: {
                            callback: function(value: any) {
                              // If value is a number, use as index into labels; else use value directly
                              if (typeof value === 'number' && labels[value] !== undefined) {
                                return truncateLabel(labels[value]);
                              }
                              return truncateLabel(value);
                            },
                          },
                        },
                        x: {
                          ...barOptions.scales.x,
                          ticks: {
                            callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                          },
                        },
                      },
                    };
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <BarChart
                            data={{
                              labels: agg.labels,
                              datasets: [
                                {
                                  label: selectedColumns[0],
                                  data: agg.values,
                                  backgroundColor: palette,
                                },
                              ],
                            }}
                            options={options}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Single Colour Bar
                  else if (variant.key === 'single' && binding.length === 2) {
                    const catIdx = columnTypes[binding[0]] === 'categorical' || columnTypes[binding[0]] === 'date' ? 0 : 1;
                    const numIdx = catIdx === 0 ? 1 : 0;
                    const agg = aggregateByCategory(rows, binding[catIdx], binding[numIdx]);
                    const labels = agg.labels;
                    const yMax = Math.max(...agg.values);
                    const { divisor, suffix } = getUnit(yMax);
                    const options = {
                      ...barOptions,
                      maintainAspectRatio: false,
                      scales: {
                        ...barOptions.scales,
                        x: {
                          ...barOptions.scales.x,
                          type: 'category',
                          ticks: {
                            callback: function(value: any) {
                              return truncateLabel(labels[value] ?? value);
                            },
                          },
                        },
                        y: {
                          ...barOptions.scales.y,
                          ticks: {
                            callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                          },
                        },
                      },
                    };
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <BarChart
                            data={{
                              labels: agg.labels,
                              datasets: [
                                {
                                  label: selectedColumns[numIdx],
                                  data: agg.values,
                                  backgroundColor: palette[0],
                                },
                              ],
                            }}
                            options={options}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Add more bar variants as needed (multi, grouped, stacked, etc.)
                }
                // --- LINE CHART LOGIC ---
                else if (type === 'Line') {
                  // [Date, Categorical, Numeric]: multi-line, colored by category, Y = numeric, X = date
                  if (binding.length === 3 && columnTypes[binding[0]] === 'date' && columnTypes[binding[1]] === 'categorical' && columnTypes[binding[2]] === 'numeric') {
                    const dateCol = binding[0];
                    const catCol = binding[1];
                    const valueCol = binding[2];
                    const dates = Array.from(new Set(rows.map(r => r[dateCol]))).sort();
                    const categories = Array.from(new Set(rows.map(r => r[catCol])));
                    const datasets = categories.map((cat, i) => ({
                      label: cat,
                      data: dates.map(date => {
                        const filtered = rows.filter(r => r[dateCol] === date && r[catCol] === cat);
                        if (filtered.length === 0) return null;
                        const sum = filtered.reduce((acc, r) => acc + Number(r[valueCol] || 0), 0);
                        return sum / filtered.length;
                      }),
                      borderColor: palette[i % palette.length],
                      backgroundColor: palette[i % palette.length] + '20',
                      pointBackgroundColor: palette[i % palette.length],
                      pointBorderColor: palette[i % palette.length],
                      pointRadius: 0,
                      pointHoverRadius: 0,
                      tension: 0.4,
                      borderWidth: 1,
                    }));
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <LineChart
                            data={{
                              labels: dates,
                              datasets,
                            }}
                            options={{ ...lineOptions, maintainAspectRatio: false }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Add more line variants as needed
                }
                // --- SCATTER CHART LOGIC ---
                else if (type === 'Scatter') {
                  // Bubble chart: numeric-numeric-numeric (third is size)
                  if (variant.key === 'bubble' && binding.length === 3 && binding.every(c => columnTypes[c] === 'numeric')) {
                    const sizeCol = binding[2];
                    const sizeVals = rows.map(r => Number(r[sizeCol])).filter(v => !isNaN(v));
                    const minSize = Math.min(...sizeVals);
                    const maxSize = Math.max(...sizeVals);
                    const scaleR = (v: number) => {
                      if (isNaN(v)) return 5;
                      if (maxSize === minSize) return 15;
                      return 5 + 20 * (v - minSize) / (maxSize - minSize);
                    };
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <ScatterChart
                            data={{
                              datasets: [
                                {
                                  label: `${binding[0]} vs ${binding[1]} (bubble: ${binding[2]})`,
                                  data: rows.map(r => ({
                                    x: Number(r[binding[0]]),
                                    y: Number(r[binding[1]]),
                                    r: scaleR(Number(r[binding[2]])),
                                  })),
                                  backgroundColor: palette[1] + '80',
                                },
                              ],
                            }}
                            options={{ ...scatterOptions, maintainAspectRatio: false, plugins: { ...scatterOptions.plugins, legend: { display: true } } }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Classic scatter: numeric-numeric
                  else if (variant.key === 'simple' && binding.length === 2 && columnTypes[binding[0]] === 'numeric' && columnTypes[binding[1]] === 'numeric') {
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <ScatterChart
                            data={{
                              datasets: [
                                {
                                  label: `${binding[0]} vs ${binding[1]}`,
                                  data: rows.map(r => ({ x: Number(r[binding[0]]), y: Number(r[binding[1]]) })),
                                  backgroundColor: palette[1] + '80',
                                },
                              ],
                            }}
                            options={{ ...scatterOptions, maintainAspectRatio: false }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  // Add more scatter variants as needed
                }
                // --- HISTOGRAM CHART LOGIC ---
                else if (type === 'Histogram') {
                  if (binding.length === 1 && columnTypes[binding[0]] === 'numeric') {
                    const col = binding[0];
                    const values = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
                    if (values.length === 0) return null;
                    // Auto-calculate bin count using Sturges' formula
                    const binCount = Math.max(5, Math.min(30, Math.ceil(Math.log2(values.length) + 1)));
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const binSize = (max - min) / binCount;
                    // Create bins
                    const bins = Array.from({ length: binCount }, (_, i) => min + i * binSize);
                    const counts = Array(binCount).fill(0);
                    values.forEach(v => {
                      let idx = Math.floor((v - min) / binSize);
                      if (idx === binCount) idx = binCount - 1; // include max value in last bin
                      counts[idx]++;
                    });
                    // Generate readable bin labels (e.g., 0–10k, 10k–20k, ...) with consistent and accurate units
                    const { divisor, suffix } = getUnit(max);
                    const formatBin = (start: number, end: number) => `${(start / divisor).toFixed(1).replace(/\.0$/, '')}–${(end / divisor).toFixed(1).replace(/\.0$/, '')}${suffix}`;
                    const binLabels = bins.map((b, i) => formatBin(b, i === bins.length - 1 ? max : bins[i + 1]));
                    const options = {
                      ...histogramOptions,
                      maintainAspectRatio: false,
                      scales: {
                        ...histogramOptions.scales,
                        x: {
                          ...histogramOptions.scales.x,
                          type: 'category',
                          ticks: {
                            callback: function(value: any, index: number) {
                              return truncateLabel(binLabels[index] ?? value, 12);
                            },
                          },
                        },
                      },
                    };
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="relative w-full h-full">
                          <HistogramChart
                            data={{
                              labels: binLabels,
                              datasets: [
                                {
                                  label: col,
                                  data: counts,
                                  backgroundColor: palette[2],
                                },
                              ],
                            }}
                            options={options}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                }
                // If no chart could be rendered, show a placeholder
                if (!chartComponent) {
                  chartComponent = (
                    <div className="flex items-center justify-center w-full h-56 text-gray-400 border border-dashed rounded-lg">
                      {type} ({variant.label}): {binding.join(', ')}
                    </div>
                  );
                }
                return (
                  <div key={type + '-' + variant.key} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[200px]">
                    <div className="font-semibold mb-1">{getChartTitle(type, variant, binding, columnTypes, rows)}</div>
                    <div className="w-full">{chartComponent}</div>
                  </div>
                );
              });
            }
            const typesToShow = activeChartType === 'All' ? Object.keys(CHART_VARIANTS) : [activeChartType]
            const variantCards: React.ReactNode[] = []
            typesToShow.forEach(type => {
              const variants = CHART_VARIANTS[type] || []
              variants.forEach((variant: ChartVariant) => {
                if (variant.isCompatible(selectedColumns, columnTypes, rows)) {
                  let chartComponent = null
                  // --- PIE CHART LOGIC ---
                  if (type === 'Pie') {
                    let agg: { labels: string[]; values: number[] } | null = null
                    if (
                      selectedColumns.length === 1 &&
                      columnTypes[selectedColumns[0]] === 'categorical'
                    ) {
                      agg = aggregateByCategory(rows, selectedColumns[0], null)
                    } else if (
                      selectedColumns.length === 2 &&
                      columnTypes[selectedColumns[0]] === 'categorical' &&
                      columnTypes[selectedColumns[1]] === 'numeric'
                    ) {
                      agg = aggregateByCategory(rows, selectedColumns[0], selectedColumns[1])
                    }
                    if (!agg || agg.labels.length > 20) return
                    let pieOptions: any = { responsive: true }
                    let pieDatasets: any[] = [
                      {
                        label: selectedColumns[1] || selectedColumns[0],
                        data: agg.values,
                        backgroundColor: palette,
                      },
                    ]
                    if (variant.key === 'donut') {
                      pieOptions.cutout = '60%'
                    }
                    chartComponent = (
                      <div className="flex justify-center items-center w-full h-56">
                        <div className="w-full h-full max-w-[200px] max-h-[200px] aspect-square flex items-center justify-center">
                          <PieChart
                            data={{
                              labels: agg.labels,
                              datasets: pieDatasets,
                            }}
                            options={{ ...pieOptions, maintainAspectRatio: true }}
                            width={200}
                            height={200}
                            className=""
                          />
                        </div>
                      </div>
                    )
                  }
                  // --- BAR CHART LOGIC ---
                  else if (type === 'Bar') {
                    // Count Bar: single categorical or date (vertical)
                    if (variant.key === 'count' && selectedColumns.length === 1) {
                      const agg = aggregateByCategory(rows, selectedColumns[0], null);
                      const labels = agg.labels;
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        scales: {
                          ...barOptions.scales,
                          x: {
                            ...barOptions.scales.x,
                            type: 'category',
                            ticks: {
                              callback: function(value: any) {
                                return truncateLabel(labels[value] ?? value);
                              },
                            },
                          },
                          y: {
                            ...barOptions.scales.y,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[0],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
            </div>
          </div>
                      );
                    }
                    // Count Horizontal Bar: single categorical
                    else if (variant.key === 'count_horizontal' && selectedColumns.length === 1) {
                      const agg = aggregateByCategory(rows, selectedColumns[0], null);
                      const labels = agg.labels;
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                          ...barOptions.scales,
                          y: {
                            ...barOptions.scales.y,
                            type: 'category',
                            ticks: {
                              callback: function(value: any) {
                                // If value is a number, use as index into labels; else use value directly
                                if (typeof value === 'number' && labels[value] !== undefined) {
                                  return truncateLabel(labels[value]);
                                }
                                return truncateLabel(value);
                              },
                            },
                          },
                          x: {
                            ...barOptions.scales.x,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[0],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
          </div>
          </div>
                      );
                    }
                    // Single Colour Bar
                    else if (variant.key === 'single' && selectedColumns.length === 2) {
                      const catIdx = columnTypes[selectedColumns[0]] === 'categorical' || columnTypes[selectedColumns[0]] === 'date' ? 0 : 1;
                      const numIdx = catIdx === 0 ? 1 : 0;
                      const agg = aggregateByCategory(rows, selectedColumns[catIdx], selectedColumns[numIdx]);
                      const labels = agg.labels;
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        scales: {
                          ...barOptions.scales,
                          x: {
                            ...barOptions.scales.x,
                            type: 'category',
                            ticks: {
                              callback: function(value: any) {
                                return truncateLabel(labels[value] ?? value);
                              },
                            },
                          },
                          y: {
                            ...barOptions.scales.y,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[numIdx],
                                    data: agg.values,
                                    backgroundColor: palette[0],
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                    // Multi Colour Bar
                    else if (variant.key === 'multi' && selectedColumns.length === 2) {
                      const catIdx = columnTypes[selectedColumns[0]] === 'categorical' ? 0 : 1;
                      const numIdx = catIdx === 0 ? 1 : 0;
                      const agg = aggregateByCategory(rows, selectedColumns[catIdx], selectedColumns[numIdx]);
                      const labels = agg.labels;
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        scales: {
                          ...barOptions.scales,
                          x: {
                            ...barOptions.scales.x,
                            type: 'category',
                            ticks: {
                              callback: function(value: any) {
                                return truncateLabel(labels[value] ?? value);
                              },
                            },
                          },
                          y: {
                            ...barOptions.scales.y,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[numIdx],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                    // Horizontal Bar
                    else if (variant.key === 'horizontal' && selectedColumns.length === 2) {
                      const catIdx = columnTypes[selectedColumns[0]] === 'categorical' ? 0 : 1;
                      const numIdx = catIdx === 0 ? 1 : 0;
                      const agg = aggregateByCategory(rows, selectedColumns[catIdx], selectedColumns[numIdx]);
                      const labels = agg.labels;
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                          ...barOptions.scales,
                          y: {
                            ...barOptions.scales.y,
                            type: 'category',
                            ticks: {
                              callback: function(value: any) {
                                return truncateLabel(labels[value] ?? value);
                              },
                            },
                          },
                          x: {
                            ...barOptions.scales.x,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[numIdx],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                    // Grouped, Stacked, Proportional
                    else if ((variant.key === 'grouped' || variant.key === 'stacked' || variant.key === 'proportional') && selectedColumns.length >= 3) {
                      // [categorical/date, numeric, numeric, ...]: group by categorical or date, each numeric is a series
                      if ((columnTypes[selectedColumns[0]] === 'categorical' || columnTypes[selectedColumns[0]] === 'date') && selectedColumns.slice(1).every(c => columnTypes[c] === 'numeric')) {
                        const groupCol = selectedColumns[0];
                        const valueCols = selectedColumns.slice(1);
                        const groups = Array.from(new Set(rows.map(r => r[groupCol])));
                        const datasets = valueCols.map((col, i) => ({
                          label: col,
                          data: groups.map(g => {
                            const filtered = rows.filter(r => r[groupCol] === g);
                            return filtered.reduce((acc, r) => acc + Number(r[col] || 0), 0);
                          }),
                          backgroundColor: palette[i % palette.length],
                        }));
                        // For proportional, normalize each group to 100%
                        if (variant.key === 'proportional') {
                          for (let g = 0; g < groups.length; g++) {
                            const groupTotal = datasets.reduce((acc, ds) => acc + (ds.data[g] || 0), 0);
                            if (groupTotal > 0) {
                              datasets.forEach(ds => {
                                ds.data[g] = +(100 * (ds.data[g] || 0) / groupTotal);
                              });
                            }
                          }
                        }
                        const yMax = Math.max(...datasets.flatMap(ds => ds.data));
                        const { divisor, suffix } = getUnit(yMax);
                        const options = {
                          ...barOptions,
                          maintainAspectRatio: false,
                          plugins: {
                            ...barOptions.plugins,
                            legend: { display: true },
                          },
                          scales: {
                            ...barOptions.scales,
                            y: {
                              ...barOptions.scales.y,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                              ticks: {
                                callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + (variant.key === 'proportional' ? '%' : suffix)),
                              },
                            },
                            x: {
                              ...barOptions.scales.x,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                            },
                          },
                        };
                        chartComponent = (
                          <div className="flex justify-center items-center w-full h-56">
                            <div className="relative w-full h-full">
                              <BarChart
                                data={{
                                  labels: groups,
                                  datasets,
                                }}
                                options={options}
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        );
                      }
                      // If [date, categorical, numeric]: group by date, color by category
                      else if (columnTypes[selectedColumns[0]] === 'date' && columnTypes[selectedColumns[1]] === 'categorical' && columnTypes[selectedColumns[2]] === 'numeric') {
                        const dateCol = selectedColumns[0];
                        const catCol = selectedColumns[1];
                        const valueCol = selectedColumns[2];
                        const groups = Array.from(new Set(rows.map(r => r[dateCol]))).sort();
                        const series = Array.from(new Set(rows.map(r => r[catCol])));
                        const datasets = series.map((s, i) => {
                          const data = groups.map(g => {
                            const filtered = rows.filter(r => r[dateCol] === g && r[catCol] === s);
                            const sum = filtered.reduce((acc, r) => acc + Number(r[valueCol] || 0), 0);
                            return sum;
                          });
                          return {
                            label: s,
                            data,
                            backgroundColor: palette[i % palette.length],
                          };
                        });
                        // For proportional, normalize each group to 100%
                        if (variant.key === 'proportional') {
                          for (let g = 0; g < groups.length; g++) {
                            const groupTotal = datasets.reduce((acc, ds) => acc + (ds.data[g] || 0), 0);
                            if (groupTotal > 0) {
                              datasets.forEach(ds => {
                                ds.data[g] = +(100 * (ds.data[g] || 0) / groupTotal);
                              });
                            }
                          }
                        }
                        const yMax = Math.max(...datasets.flatMap(ds => ds.data));
                        const { divisor, suffix } = getUnit(yMax);
                        const options = {
                          ...barOptions,
                          maintainAspectRatio: false,
                          plugins: {
                            ...barOptions.plugins,
                            legend: { display: true },
                          },
                          scales: {
                            ...barOptions.scales,
                            y: {
                              ...barOptions.scales.y,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                              ticks: {
                                callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + (variant.key === 'proportional' ? '%' : suffix)),
                              },
                            },
                            x: {
                              ...barOptions.scales.x,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                            },
                          },
                        };
                        chartComponent = (
                          <div className="flex justify-center items-center w-full h-56">
                            <div className="relative w-full h-full">
                              <BarChart
                                data={{
                                  labels: groups,
                                  datasets,
                                }}
                                options={options}
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        );
                      } else if (columnTypes[selectedColumns[0]] === 'categorical' && columnTypes[selectedColumns[1]] === 'categorical' && columnTypes[selectedColumns[2]] === 'numeric') {
                        // Existing logic for [categorical, categorical, numeric]
                        const groupCol = selectedColumns[0];
                        const valueCols = selectedColumns.slice(1); // all numeric columns
                        const groups = Array.from(new Set(rows.map(r => r[groupCol])));
                        const datasets = valueCols.map((col, i) => ({
                          label: col,
                          data: groups.map(g => {
                            const filtered = rows.filter(r => r[groupCol] === g);
                            return filtered.reduce((acc, r) => acc + Number(r[col] || 0), 0);
                          }),
                          backgroundColor: palette[i % palette.length],
                        }));
                        // For proportional, normalize each group to 100%
                        if (variant.key === 'proportional') {
                          for (let g = 0; g < groups.length; g++) {
                            const groupTotal = datasets.reduce((acc, ds) => acc + (ds.data[g] || 0), 0);
                            if (groupTotal > 0) {
                              datasets.forEach(ds => {
                                ds.data[g] = +(100 * (ds.data[g] || 0) / groupTotal);
                              });
                            }
                          }
                        }
                        // Find max for y axis
                        const yMax = Math.max(...datasets.flatMap(ds => ds.data));
                        const { divisor, suffix } = getUnit(yMax);
                        const options = {
                          ...barOptions,
                          maintainAspectRatio: false,
                          plugins: {
                            ...barOptions.plugins,
                            legend: { display: true },
                          },
                          scales: {
                            ...barOptions.scales,
                            y: {
                              ...barOptions.scales.y,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                              ticks: {
                                callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + (variant.key === 'proportional' ? '%' : suffix)),
                              },
                            },
                            x: {
                              ...barOptions.scales.x,
                              stacked: variant.key === 'stacked' || variant.key === 'proportional',
                            },
                          },
                        };
                        chartComponent = (
                          <div className="flex justify-center items-center w-full h-56">
                            <div className="relative w-full h-full">
                              <BarChart
                                data={{
                                  labels: groups,
                                  datasets,
                                }}
                                options={options}
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        );
                      }
                    }
                    // Horizontal Bar
                    else if (variant.key === 'horizontal' && selectedColumns.length === 2) {
                      const agg = aggregateByCategory(rows, selectedColumns[0], selectedColumns[1])
                      const yMax = Math.max(...agg.values)
                      const { divisor, suffix } = getUnit(yMax)
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                          ...barOptions.scales,
                          x: {
                            ...barOptions.scales.x,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      }
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[1],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
    </div>
  )
} 
                    // Count Bar: single categorical
                    else if (variant.key === 'count' && selectedColumns.length === 1) {
                      const agg = aggregateByCategory(rows, selectedColumns[0], null);
                      const yMax = Math.max(...agg.values);
                      const { divisor, suffix } = getUnit(yMax);
                      const options = {
                        ...barOptions,
                        maintainAspectRatio: false,
                        scales: {
                          ...barOptions.scales,
                          y: {
                            ...barOptions.scales.y,
                            ticks: {
                              callback: (value: any) => ((Number(value) / divisor).toFixed(1).replace(/\.0$/, '') + suffix),
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <BarChart
                              data={{
                                labels: agg.labels,
                                datasets: [
                                  {
                                    label: selectedColumns[0],
                                    data: agg.values,
                                    backgroundColor: palette,
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                  }
                  // --- LINE CHART LOGIC ---
                  else if (type === 'Line') {
                    // [Date, Categorical, Numeric]: multi-line, colored by category, Y = numeric, X = date
                    if (selectedColumns.length === 3 &&
                        columnTypes[selectedColumns[0]] === 'date' &&
                        columnTypes[selectedColumns[1]] === 'categorical' &&
                        columnTypes[selectedColumns[2]] === 'numeric') {
                      const dateCol = selectedColumns[0];
                      const catCol = selectedColumns[1];
                      const valueCol = selectedColumns[2];
                      const dates = Array.from(new Set(rows.map(r => r[dateCol]))).sort();
                      const categories = Array.from(new Set(rows.map(r => r[catCol])));
                      const datasets = categories.map((cat, i) => ({
                        label: cat,
                        data: dates.map(date => {
                          const filtered = rows.filter(r => r[dateCol] === date && r[catCol] === cat);
                          if (filtered.length === 0) return null;
                          // Use mean if multiple values
                          const sum = filtered.reduce((acc, r) => acc + Number(r[valueCol] || 0), 0);
                          return sum / filtered.length;
                        }),
                        borderColor: palette[i % palette.length],
                        backgroundColor: palette[i % palette.length] + '20',
                        pointBackgroundColor: palette[i % palette.length],
                        pointBorderColor: palette[i % palette.length],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0.4,
                        borderWidth: 1,
                      }));
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <LineChart
                              data={{
                                labels: dates,
                                datasets,
                              }}
                              options={{ ...lineOptions, maintainAspectRatio: false }}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                    // If date + categorical, aggregate by count for each date and split by category
                    else if (selectedColumns.length === 2 &&
                        ((columnTypes[selectedColumns[0]] === 'date' && columnTypes[selectedColumns[1]] === 'categorical') ||
                         (columnTypes[selectedColumns[0]] === 'categorical' && columnTypes[selectedColumns[1]] === 'date'))) {
                      const dateCol = columnTypes[selectedColumns[0]] === 'date' ? selectedColumns[0] : selectedColumns[1];
                      const catCol = columnTypes[selectedColumns[0]] === 'categorical' ? selectedColumns[0] : selectedColumns[1];
                      const dates = Array.from(new Set(rows.map(r => r[dateCol]))).sort();
                      const categories = Array.from(new Set(rows.map(r => r[catCol])));
                      const datasets = categories.map((cat, i) => ({
                        label: cat,
                        data: dates.map(date => rows.filter(r => r[dateCol] === date && r[catCol] === cat).length),
                        borderColor: palette[i % palette.length],
                        backgroundColor: palette[i % palette.length] + '20',
                        pointBackgroundColor: palette[i % palette.length],
                        pointBorderColor: palette[i % palette.length],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0.4,
                        borderWidth: 1,
                      }));
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <LineChart
                              data={{
                                labels: dates,
                                datasets,
                              }}
                              options={{ ...lineOptions, maintainAspectRatio: false }}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    } else {
                      // Default: numeric y
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <LineChart
                              data={{
                                labels: rows.map(r => r[selectedColumns[0]]),
                                datasets: [
                                  {
                                    label: selectedColumns[1] || selectedColumns[0],
                                    data: rows.map(r => Number(r[selectedColumns[1]])),
                                    borderColor: palette[0],
                                    backgroundColor: palette[0] + '20',
                                    pointBackgroundColor: palette[0],
                                    pointBorderColor: palette[0],
                                    pointRadius: 0,
                                    pointHoverRadius: 0,
                                    tension: 0.4,
                                    borderWidth: 1,
                                  },
                                ],
                              }}
                              options={{ ...lineOptions, maintainAspectRatio: false }}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                  } else if (type === 'Scatter') {
                    // Bubble chart: numeric-numeric-numeric (third is size)
                    if (variant.key === 'bubble' && selectedColumns.length === 3 && selectedColumns.every(c => columnTypes[c] === 'numeric')) {
                      const sizeCol = selectedColumns[2];
                      const sizeVals = rows.map(r => Number(r[sizeCol])).filter(v => !isNaN(v));
                      const minSize = Math.min(...sizeVals);
                      const maxSize = Math.max(...sizeVals);
                      const scaleR = (v: number) => {
                        if (isNaN(v)) return 5;
                        if (maxSize === minSize) return 15;
                        return 5 + 20 * (v - minSize) / (maxSize - minSize);
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <ScatterChart
                              data={{
                                datasets: [
                                  {
                                    label: `${selectedColumns[0]} vs ${selectedColumns[1]} (bubble: ${selectedColumns[2]})`,
                                    data: rows.map(r => ({
                                      x: Number(r[selectedColumns[0]]),
                                      y: Number(r[selectedColumns[1]]),
                                      r: scaleR(Number(r[selectedColumns[2]])),
                                    })),
                                    backgroundColor: palette[1] + '80', // Use same color as classic scatter, 50% opacity
                                  },
                                ],
                              }}
                              options={{ ...scatterOptions, maintainAspectRatio: false, plugins: { ...scatterOptions.plugins, legend: { display: true } } }}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                    // Classic scatter: numeric-numeric
                    else if (variant.key === 'simple' && selectedColumns.length === 2 && columnTypes[selectedColumns[0]] === 'numeric' && columnTypes[selectedColumns[1]] === 'numeric') {
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <ScatterChart
                              data={{
                                datasets: [
                                  {
                                    label: `${selectedColumns[0]} vs ${selectedColumns[1]}`,
                                    data: rows.map(r => ({ x: Number(r[selectedColumns[0]]), y: Number(r[selectedColumns[1]]) })),
                                    backgroundColor: palette[1] + '80', // 50% opacity
                                  },
                                ],
                              }}
                              options={{ ...scatterOptions, maintainAspectRatio: false }}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                  } else if (type === 'Histogram') {
                    // Only standard histogram remains
                    if (selectedColumns.length === 1 && columnTypes[selectedColumns[0]] === 'numeric') {
                      const col = selectedColumns[0];
                      const values = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
                      if (values.length === 0) return;
                      // Auto-calculate bin count using Sturges' formula
                      const binCount = Math.max(5, Math.min(30, Math.ceil(Math.log2(values.length) + 1)));
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      const binSize = (max - min) / binCount;
                      // Create bins
                      const bins = Array.from({ length: binCount }, (_, i) => min + i * binSize);
                      const counts = Array(binCount).fill(0);
                      values.forEach(v => {
                        let idx = Math.floor((v - min) / binSize);
                        if (idx === binCount) idx = binCount - 1; // include max value in last bin
                        counts[idx]++;
                      });
                      // Generate readable bin labels (e.g., 0–10k, 10k–20k, ...) with consistent and accurate units
                      const { divisor, suffix } = getUnit(max);
                      const formatBin = (start: number, end: number) => `${(start / divisor).toFixed(1).replace(/\.0$/, '')}–${(end / divisor).toFixed(1).replace(/\.0$/, '')}${suffix}`;
                      const binLabels = bins.map((b, i) => formatBin(b, i === bins.length - 1 ? max : bins[i + 1]));
                      const options = {
                        ...histogramOptions,
                        maintainAspectRatio: false,
                        scales: {
                          ...histogramOptions.scales,
                          x: {
                            ...histogramOptions.scales.x,
                            type: 'category',
                            ticks: {
                              callback: function(value: any, index: number) {
                                return truncateLabel(binLabels[index] ?? value, 12);
                              },
                            },
                          },
                        },
                      };
                      chartComponent = (
                        <div className="flex justify-center items-center w-full h-56">
                          <div className="relative w-full h-full">
                            <HistogramChart
                              data={{
                                labels: binLabels,
                                datasets: [
                                  {
                                    label: col,
                                    data: counts,
                                    backgroundColor: palette[2],
                                  },
                                ],
                              }}
                              options={options}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                  }
                  if (chartComponent) {
                    variantCards.push(
                      <div key={type + '-' + variant.key} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[200px]">
                        <div className="font-semibold mb-1">{getChartTitle(type, variant, selectedColumns, columnTypes, rows)}</div>
                        <div className="w-full">{chartComponent}</div>
                      </div>
                    )
                  }
                }
              })
            })
            if (variantCards.length === 0) {
              const reqMsg = CHART_TYPE_REQUIREMENTS[activeChartType] || CHART_TYPE_REQUIREMENTS['All'];
              const autoCols = getAutoSelectColumns(activeChartType, columns, columnTypes, rows);
                return (
                <div className="col-span-full text-center text-gray-500 py-12 flex flex-col items-center gap-4">
                  <div>{reqMsg}</div>
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${autoCols ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    disabled={!autoCols}
                    onClick={() => autoCols && setSelectedColumns(autoCols)}
                  >
                    Auto select
                  </button>
                </div>
              )
            }
            return variantCards
          })()}
            </div>
          </div>
    )
  }

  return (
    <div className="w-screen min-h-screen flex justify-center bg-gray-100">
      <div
        className="relative flex flex-col mx-8 mt-8 w-full max-w-[1024px] h-[1024px] bg-white rounded-[32px] shadow-lg overflow-hidden"
      >
        {screen === 'data' ? renderDataScreen() : renderColumnsScreen()}
          </div>
    </div>
  )
} 

export default MagicCharts 