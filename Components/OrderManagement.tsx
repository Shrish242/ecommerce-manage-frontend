import React, { useState } from 'react';
import { Search, Bell, User, Calendar, Filter, Plus } from 'lucide-react';

export default function OrdersTrackingDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const stats = [
    { label: 'Total Orders', value: '1,250', color: 'text-gray-900' },
    { label: 'Delivered', value: '980', color: 'text-gray-900' },
    { label: 'In Transit', value: '220', color: 'text-gray-900' },
    { label: 'Cancelled', value: '50', color: 'text-gray-900' }
  ];

  const orders = [
    {
      id: '#12345',
      customer: 'Sophia Clark',
      item: 'Laptop',
      status: 'Delivered',
      payment: 'Paid',
      orderDate: '2023-08-15',
      deliveryDate: '2023-08-20',
      remarks: 'No remarks'
    },
    {
      id: '#12346',
      customer: 'Ethan Carter',
      item: 'Smartphone',
      status: 'Pending',
      payment: 'Unpaid',
      orderDate: '2023-08-16',
      deliveryDate: '2023-08-22',
      remarks: 'Urgent'
    },
    {
      id: '#12347',
      customer: 'Olivia Bennett',
      item: 'Tablet',
      status: 'Cancelled',
      payment: 'Refunded',
      orderDate: '2023-08-17',
      deliveryDate: '2023-08-23',
      remarks: 'Out of stock'
    },
    {
      id: '#12348',
      customer: 'Liam Harper',
      item: 'Headphones',
      status: 'Delivered',
      payment: 'Paid',
      orderDate: '2023-08-18',
      deliveryDate: '2023-08-24',
      remarks: 'No remarks'
    },
    {
      id: '#12349',
      customer: 'Ava Foster',
      item: 'Keyboard',
      status: 'Pending',
      payment: 'Unpaid',
      orderDate: '2023-08-19',
      deliveryDate: '2023-08-25',
      remarks: 'Delayed'
    },
    {
      id: '#12350',
      customer: 'Noah Turner',
      item: 'Mouse',
      status: 'Delivered',
      payment: 'Paid',
      orderDate: '2023-08-20',
      deliveryDate: '2023-08-26',
      remarks: 'No remarks'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters and Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedFilter('All')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                selectedFilter === 'All'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>All</span>
            </button>
            <button
              onClick={() => setSelectedFilter('Date')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                selectedFilter === 'Date'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Date</span>
            </button>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            <span>Add New Order</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">ORDER ID</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">CUSTOMER NAME</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">PURCHASED ITEMS</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">ORDER STATUS</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">PAYMENT STATUS</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">ORDER DATE</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">DELIVERY DATE</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">REMARKS</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{order.customer}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{order.item}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900">{order.payment}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{order.orderDate}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{order.deliveryDate}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{order.remarks}</td>
                  <td className="py-4 px-6">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}