"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,  CartesianGrid, Legend, Area, AreaChart } from "recharts";
import { getAnalytics,adminLogout } from "@/api/adminApi";
import { Users, UserCheck, Calendar, Activity,  Award, LayoutDashboard, UserPlus, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E1E9F1' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: '#5DC4C7' }}></div>
          <p className="text-lg font-medium" style={{ color: '#06434D' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E1E9F1' }}>
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5DC4C7' }}>
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: '#06434D' }}>Failed to load analytics</p>
          <p className="text-sm mt-2" style={{ color: '#06434D', opacity: 0.7 }}>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#5DC4C7", "#06434D", "#7DD4D6", "#0A5A65", "#98DFE1"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border" style={{ borderColor: '#E1E9F1' }}>
          <p className="font-semibold mb-2" style={{ color: '#06434D' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen  bg-gradient-to-br from-slate-50 to-blue-50 " >
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0  bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transform transition-all duration-300 ease-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5DC4C7] to-cyan-400 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="/admin/add-doctor" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Add Doctors</span>
          </a>
          <a href="/admin/analytics" className="flex items-center space-x-3 p-3 rounded-xl bg-[#5DC4C7] text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Insights</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={adminLogout}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg text-sm hover:scale-105 active:scale-95"
          >
            Sign Out
          </button>
        </div>
        <div className="p-4 border-t border-slate-700">
          <div className="text-center text-slate-400 text-sm">
            Healthcare Admin v2.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 w-full lg:w-auto overflow-x-hidden">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
              style={{ color: '#06434D' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#06434D' }}>
                Analytics & Insights
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#06434D', opacity: 0.6 }}>
                Track your platform's performance metrics
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow-md">
              <span className="text-sm" style={{ color: '#06434D', opacity: 0.7 }}>Welcome back, Admin</span>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Total Doctors */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 group cursor-pointer" style={{ borderColor: '#5DC4C7' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(93, 196, 199, 0.1)' }}>
                <Users className="w-7 h-7" style={{ color: '#5DC4C7' }} />
              </div>
              
            </div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#06434D', opacity: 0.7 }}>Total Doctors</h2>
            <p className="text-4xl font-bold mb-2" style={{ color: '#06434D' }}>{data.totalDoctors}</p>
            <p className="text-xs" style={{ color: '#06434D', opacity: 0.5 }}>Active healthcare providers</p>
          </div>

          {/* Total Patients */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 group cursor-pointer" style={{ borderColor: '#06434D' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(6, 67, 77, 0.1)' }}>
                <UserCheck className="w-7 h-7" style={{ color: '#06434D' }} />
              </div>
              
            </div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#06434D', opacity: 0.7 }}>Total Patients</h2>
            <p className="text-4xl font-bold mb-2" style={{ color: '#06434D' }}>{data.totalPatients}</p>
            <p className="text-xs" style={{ color: '#06434D', opacity: 0.5 }}>Registered users</p>
          </div>

          {/* Total Appointments */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 group cursor-pointer sm:col-span-2 lg:col-span-1" style={{ borderColor: '#5DC4C7' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(93, 196, 199, 0.1)' }}>
                <Calendar className="w-7 h-7" style={{ color: '#5DC4C7' }} />
              </div>
              
            </div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#06434D', opacity: 0.7 }}>Total Appointments</h2>
            <p className="text-4xl font-bold mb-2" style={{ color: '#06434D' }}>{data.totalAppointments}</p>
            <p className="text-xs" style={{ color: '#06434D', opacity: 0.5 }}>Scheduled consultations</p>
          </div>
        </div>

        {/* Monthly Appointments - Featured Chart */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(93, 196, 199, 0.1)' }}>
                <Activity className="w-6 h-6" style={{ color: '#5DC4C7' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#06434D' }}>Appointment Trends</h2>
                <p className="text-sm" style={{ color: '#06434D', opacity: 0.6 }}>Last 30 days performance</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(93, 196, 199, 0.1)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#5DC4C7' }}></div>
              <span className="text-sm font-medium" style={{ color: '#06434D' }}>Live Data</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.monthlyAppointments}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5DC4C7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5DC4C7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E9F1" />
              <XAxis 
                dataKey="_id" 
                stroke="#06434D" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#06434D' }}
              />
              <YAxis 
                stroke="#06434D" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#06434D' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#5DC4C7" 
                strokeWidth={3}
                fill="url(#colorCount)"
                dot={{ fill: '#5DC4C7', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Doctors */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(6, 67, 77, 0.1)' }}>
                <Award className="w-6 h-6" style={{ color: '#06434D' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#06434D' }}>Top Doctors</h2>
                <p className="text-sm" style={{ color: '#06434D', opacity: 0.6 }}>By patient count</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.popularDoctors} layout="vertical">
                <XAxis type="number" stroke="#06434D" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="name" stroke="#06434D" style={{ fontSize: '12px' }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="patientCount" fill="#5DC4C7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Specializations */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(93, 196, 199, 0.1)' }}>
                <span className="text-2xl">⚕️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#06434D' }}>Specializations</h2>
                <p className="text-sm" style={{ color: '#06434D', opacity: 0.6 }}>Distribution overview</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data.popularSpecializations.map((d: any) => ({
                    name: d._id,
                    value: d.totalPatients,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  label={false}
                >
                  {data.popularSpecializations.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold mb-1" style={{ color: '#5DC4C7' }}>
              {data.popularDoctors.length}
            </div>
            <div className="text-xs" style={{ color: '#06434D', opacity: 0.6 }}>Active Doctors</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold mb-1" style={{ color: '#06434D' }}>
              {data.popularSpecializations.length}
            </div>
            <div className="text-xs" style={{ color: '#06434D', opacity: 0.6 }}>Specializations</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold mb-1" style={{ color: '#5DC4C7' }}>
              {Math.round(data.totalAppointments / data.totalDoctors)}
            </div>
            <div className="text-xs" style={{ color: '#06434D', opacity: 0.6 }}>Avg per Doctor</div>
          </div>
          
        </div>
      </main>
    </div>
  );
}