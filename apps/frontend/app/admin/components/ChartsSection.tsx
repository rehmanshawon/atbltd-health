'use client';

import { TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const revenueData = [
  { month: 'Jan', collection: 45000, claims: 12000 },
  { month: 'Feb', collection: 52000, claims: 18000 },
  { month: 'Mar', collection: 48000, claims: 15000 },
  { month: 'Apr', collection: 61000, claims: 22000 },
  { month: 'May', collection: 55000, claims: 19000 },
  { month: 'Jun', collection: 67000, claims: 25000 },
  { month: 'Jul', collection: 72000, claims: 28000 },
  { month: 'Aug', collection: 68000, claims: 26000 },
];

const memberGrowthData = [
  { month: 'Jan', members: 1200 },
  { month: 'Feb', members: 1350 },
  { month: 'Mar', members: 1500 },
  { month: 'Apr', members: 1680 },
  { month: 'May', members: 1850 },
  { month: 'Jun', members: 2100 },
  { month: 'Jul', members: 2400 },
  { month: 'Aug', members: 2650 },
];

const claimStatusData = [
  { name: 'Approved', value: 65, color: '#22c55e' },
  { name: 'Pending', value: 20, color: '#eab308' },
  { name: 'Rejected', value: 10, color: '#ef4444' },
  { name: 'Under Review', value: 5, color: '#3b82f6' },
];

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '13px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function ChartsSection() {
  return (
    <>
      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#0A2A5E] font-semibold text-sm">Revenue vs Claims</h3>
              <p className="text-gray-400 text-xs mt-0.5">Monthly comparison</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0A2A5E]" />
                <span className="text-gray-500 text-xs">Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D32F2F]" />
                <span className="text-gray-500 text-xs">Claims Paid</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="collection" fill="#0A2A5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="claims" fill="#D32F2F" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-[#0A2A5E] font-semibold text-sm mb-6">Application Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={claimStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {claimStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {claimStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="text-gray-800 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Growth Line Chart */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#0A2A5E] font-semibold text-sm">Member Growth</h3>
            <p className="text-gray-400 text-xs mt-0.5">Cumulative members over time</p>
          </div>
          <TrendingUp size={16} className="text-green-600" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={memberGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="members"
              stroke="#0A2A5E"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0A2A5E', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
