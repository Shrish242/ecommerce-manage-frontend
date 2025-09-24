// data.ts
// Contains mock data for the dashboard and product management sections.

import { DashboardData, Product } from './types';

/**
 * Mock data for the dashboard overview section.
 */
export const mockDashboardData: DashboardData = {
  totalRevenue: 1250000,
  totalOrders: 15800,
  averageOrderValue: 79.11,
  newCustomers: 1200,
  activeStores: 52345,
  gmvProcessed: 1234567890,
  uptime: '99.99%',
  globalReach: '180+ Countries',
  salesData: [
    { name: 'Jan', sales: 40000 },
    { name: 'Feb', sales: 30000 },
    { name: 'Mar', sales: 50000 },
    { name: 'Apr', sales: 45000 },
    { name: 'May', sales: 60000 },
    { name: 'Jun', sales: 55000 },
    { name: 'Jul', sales: 70000 },
    { name: 'Aug', sales: 65000 },
    { name: 'Sep', sales: 80000 },
    { name: 'Oct', sales: 75000 },
    { name: 'Nov', sales: 90000 },
    { name: 'Dec', sales: 100000 },
  ],
  topProducts: [
    { id: 1, name: 'Premium E-commerce Theme', sales: 1200, revenue: 96000 },
    { id: 2, name: 'AI Analytics Plugin', sales: 950, revenue: 76000 },
    { id: 3, name: 'Storefront SEO Booster', sales: 800, revenue: 64000 },
    { id: 4, name: 'Dropshipping Automation Tool', sales: 720, revenue: 57600 },
    { id: 5, name: 'Custom Payment Gateway', sales: 600, revenue: 48000 },
  ],
  recentOrders: [
    { id: '#SF001', customer: 'Alice Johnson', total: 120.50, status: 'Completed', date: '2025-07-24' },
    { id: '#SF002', customer: 'Bob Williams', total: 85.00, status: 'Processing', date: '2025-07-23' },
    { id: '#SF003', customer: 'Charlie Brown', total: 210.75, status: 'Shipped', date: '2025-07-23' },
    { id: '#SF004', customer: 'Diana Prince', total: 55.20, status: 'Completed', date: '2025-07-22' },
    { id: '#SF005', customer: 'Eve Adams', total: 150.00, status: 'Pending', date: '2025-07-22' },
  ],
  customerSegments: [
    { name: 'New Customers', value: 300 },
    { name: 'Repeat Customers', value: 700 },
    { name: 'High-Value Customers', value: 150 },
    { name: 'Inactive Customers', value: 200 },
  ]
};

/**
 * Initial mock product data for the product management section.
 */
export const initialProducts: Product[] = [
  { id: 'prod-001', name: 'StoreForge Pro Theme', description: 'A highly customizable e-commerce theme.', price: 49.99, stock: 150, ordersReceived: 250, imageUrl: 'https://placehold.co/100x100/a78bfa/ffffff?text=Theme' },
  { id: 'prod-002', name: 'AI Product Recommender', description: 'AI-powered product recommendation engine.', price: 29.00, stock: 75, ordersReceived: 180, imageUrl: 'https://placehold.co/100x100/fde047/000000?text=AI' },
  { id: 'prod-003', name: 'SEO Booster Plugin', description: 'Boost your store\'s search engine ranking.', price: 19.50, stock: 20, ordersReceived: 90, imageUrl: 'https://placehold.co/100x100/86efac/000000?text=SEO' },
  { id: 'prod-004', name: 'Inventory Management Tool', description: 'Automate your stock tracking and updates.', price: 35.00, stock: 5, ordersReceived: 120, imageUrl: 'https://placehold.co/100x100/fdba74/000000?text=Inv' },
  { id: 'prod-005', name: 'Multi-Currency Support', description: 'Enable multiple currencies for global sales.', price: 12.00, stock: 0, ordersReceived: 60, imageUrl: 'https://placehold.co/100x100/a5f3fc/000000?text=Curr' },
  { id: 'prod-006', name: 'Advanced Analytics Dashboard', description: 'Detailed insights into your store performance.', price: 59.99, stock: 100, ordersReceived: 200, imageUrl: 'https://placehold.co/100x100/fecaca/000000?text=Dash' },
  { id: 'prod-007', name: 'Customer Loyalty Program', description: 'Build customer loyalty with rewards and points.', price: 45.00, stock: 80, ordersReceived: 150, imageUrl: 'https://placehold.co/100x100/c7d2fe/000000?text=Loyalty' },
  { id: 'prod-008', name: 'Payment Gateway Integrator', description: 'Seamlessly integrate various payment options.', price: 25.00, stock: 30, ordersReceived: 110, imageUrl: 'https://placehold.co/100x100/d8b4fe/000000?text=Pay' },
  { id: 'prod-009', name: 'Email Marketing Automation', description: 'Automate your email campaigns for better engagement.', price: 39.00, stock: 60, ordersReceived: 130, imageUrl: 'https://placehold.co/100x100/fbcfe8/000000?text=Email' },
  { id: 'prod-010', name: 'Abandoned Cart Recovery', description: 'Recover lost sales with automated cart reminders.', price: 22.00, stock: 40, ordersReceived: 95, imageUrl: 'https://placehold.co/100x100/bae6fd/000000?text=Cart' },
];
