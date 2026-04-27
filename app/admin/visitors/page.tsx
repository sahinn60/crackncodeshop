'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/axios';
import {
  Users, Monitor, Smartphone, Globe, Shield, ShieldOff,
  Clock, RefreshCw, Wifi, WifiOff, Search, Ban,
} from 'lucide-react';

interface VisitorData {
  ip: string;
  country: string;
  device: string;
  browser: string;
  currentPage: string;
  entryTime: number;
  lastActivity: number;
  timeOnline: number;
  isBanned: boolean;
}

interface BannedIp {
  id: string;
  ip: string;
  reason: string;
  bannedAt: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'banned'>('active');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/visitors?mode=active');
      setVisitors(data.visitors);
      setActiveCount(data.activeCount);
    } catch {}
  }, []);

  const fetchBanned = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/visitors/ban');
      setBannedIps(data);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchVisitors(), fetchBanned()]).finally(() => setLoading(false));
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, [fetchVisitors, fetchBanned]);

  const handleBan = async (ip: string) => {
    setActionLoading(ip);
    try {
      await apiClient.post('/admin/visitors/ban', { ip, reason: 'Banned by admin' });
      await Promise.all([fetchVisitors(), fetchBanned()]);
    } catch {}
    setActionLoading(null);
  };

  const handleUnban = async (ip: string) => {
    setActionLoading(ip);
    try {
      await apiClient.delete('/admin/visitors/ban', { data: { ip } });
      await Promise.all([fetchVisitors(), fetchBanned()]);
    } catch {}
    setActionLoading(null);
  };

  const filtered = visitors.filter(v =>
    !search || v.ip.includes(search) || v.country.toLowerCase().includes(search.toLowerCase()) || v.currentPage.includes(search)
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-green-100 p-4 flex items-center gap-3">
          <div className="bg-green-50 rounded-xl p-2.5"><Wifi className="h-5 w-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Active Now</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5"><Users className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Total Tracked</p>
            <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-4 flex items-center gap-3">
          <div className="bg-purple-50 rounded-xl p-2.5"><Monitor className="h-5 w-5 text-purple-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Desktop</p>
            <p className="text-2xl font-bold text-gray-900">{visitors.filter(v => v.device === 'Desktop').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 flex items-center gap-3">
          <div className="bg-red-50 rounded-xl p-2.5"><Ban className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Banned IPs</p>
            <p className="text-2xl font-bold text-gray-900">{bannedIps.length}</p>
          </div>
        </div>
      </div>

      {/* Live indicator + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-gray-600">Live — updates every 5s</span>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active Visitors
            </button>
            <button
              onClick={() => setTab('banned')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${tab === 'banned' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Banned IPs ({bannedIps.length})
            </button>
          </div>
        </div>
        {tab === 'active' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search IP, country, page..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* Active Visitors Table */}
      {tab === 'active' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Country</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Device</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Browser</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Current Page</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Time Online</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <WifiOff className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="font-medium">No active visitors</p>
                      <p className="text-xs mt-1">Visitors will appear here when they browse your store</p>
                    </td>
                  </tr>
                ) : filtered.map(v => (
                  <tr key={v.ip} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{v.ip}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-700">{v.country || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {v.device === 'Mobile' ? <Smartphone className="h-3.5 w-3.5 text-orange-500" /> : <Monitor className="h-3.5 w-3.5 text-blue-500" />}
                        <span className="text-gray-700">{v.device}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.browser}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium truncate max-w-[200px] inline-block">
                        {v.currentPage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDuration(v.timeOnline)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleBan(v.ip)}
                        disabled={actionLoading === v.ip}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === v.ip ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banned IPs Table */}
      {tab === 'banned' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Banned At</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bannedIps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      <Shield className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="font-medium">No banned IPs</p>
                    </td>
                  </tr>
                ) : bannedIps.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-1 rounded">{b.ip}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(b.bannedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUnban(b.ip)}
                        disabled={actionLoading === b.ip}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === b.ip ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
