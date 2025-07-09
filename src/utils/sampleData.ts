import type { SampleDataset } from '../types';

export const sampleDatasets: SampleDataset[] = [
  {
    id: 'social-media-performance',
    name: 'Social Media Performance',
    description: 'Monthly social media metrics across Instagram, TikTok, and LinkedIn',
    category: 'Marketing',
    csvData: `Platform,Date,Followers,Engagement Rate,Reach,Impressions,Content Type
Instagram,2024-01-01,12500,3.2,45000,125000,Post
Instagram,2024-01-15,12800,4.1,52000,140000,Story
Instagram,2024-02-01,13200,3.8,48000,135000,Post
Instagram,2024-02-15,13500,4.5,55000,150000,Reel
Instagram,2024-03-01,13800,3.9,50000,145000,Post
Instagram,2024-03-15,14200,4.8,58000,160000,Story
TikTok,2024-01-01,8500,8.5,120000,300000,Video
TikTok,2024-01-15,9200,9.2,140000,350000,Video
TikTok,2024-02-01,9800,8.8,135000,340000,Video
TikTok,2024-02-15,10500,9.5,150000,380000,Video
TikTok,2024-03-01,11200,8.9,145000,360000,Video
TikTok,2024-03-15,11800,9.8,160000,400000,Video
LinkedIn,2024-01-01,3200,2.1,15000,45000,Post
LinkedIn,2024-01-15,3250,2.3,16000,48000,Post
LinkedIn,2024-02-01,3300,2.0,15500,47000,Post
LinkedIn,2024-02-15,3350,2.4,16500,50000,Post
LinkedIn,2024-03-01,3400,2.2,16000,49000,Post
LinkedIn,2024-03-15,3450,2.5,17000,52000,Post`
  },
  {
    id: 'ecommerce-sales',
    name: 'E-commerce Sales Data',
    description: 'Daily sales data with product categories and customer segments',
    category: 'Business',
    csvData: `Date,Product Category,Customer Segment,Sales Amount,Units Sold,Conversion Rate
2024-01-01,Electronics,New Customer,1250.50,5,2.1
2024-01-02,Clothing,Returning Customer,890.25,12,3.5
2024-01-03,Home & Garden,New Customer,2100.75,8,1.8
2024-01-04,Electronics,Returning Customer,1750.00,4,4.2
2024-01-05,Clothing,New Customer,650.30,15,2.8
2024-01-06,Home & Garden,Returning Customer,3200.45,6,5.1
2024-01-07,Electronics,New Customer,980.20,3,1.9
2024-01-08,Clothing,Returning Customer,1450.60,18,4.0
2024-01-09,Home & Garden,New Customer,2800.90,7,2.3
2024-01-10,Electronics,Returning Customer,2200.15,5,3.8
2024-01-11,Clothing,New Customer,750.40,20,2.5
2024-01-12,Home & Garden,Returning Customer,4100.30,9,6.2
2024-01-13,Electronics,New Customer,1100.80,4,2.0
2024-01-14,Clothing,Returning Customer,1680.45,22,4.5
2024-01-15,Home & Garden,New Customer,3500.20,8,2.7`
  },
  {
    id: 'website-analytics',
    name: 'Website Analytics',
    description: 'Daily website traffic and conversion metrics',
    category: 'Analytics',
    csvData: `Date,Page Views,Unique Visitors,Bounce Rate,Avg Session Duration,Conversions,Traffic Source
2024-01-01,12500,8500,45.2,180,125,Organic Search
2024-01-02,11800,8200,42.8,195,118,Organic Search
2024-01-03,13200,9100,41.5,210,132,Social Media
2024-01-04,14100,9500,39.2,225,141,Direct
2024-01-05,12800,8800,43.1,190,128,Organic Search
2024-01-06,11500,7800,46.8,165,115,Social Media
2024-01-07,13800,9200,40.5,200,138,Direct
2024-01-08,15200,10200,38.1,240,152,Organic Search
2024-01-09,14500,9800,39.8,220,145,Social Media
2024-01-10,16200,10800,37.2,250,162,Direct
2024-01-11,13900,9400,41.1,205,139,Organic Search
2024-01-12,12800,8600,44.3,185,128,Social Media
2024-01-13,15500,10300,38.9,235,155,Direct
2024-01-14,14200,9600,40.2,215,142,Organic Search
2024-01-15,16800,11200,36.5,260,168,Social Media`
  }
];

export const getSampleDataset = (id: string): SampleDataset | undefined => {
  return sampleDatasets.find(dataset => dataset.id === id);
};

export const getAllSampleDatasets = (): SampleDataset[] => {
  return sampleDatasets;
}; 