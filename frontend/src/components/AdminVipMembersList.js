import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Button } from './ui/Button';

const AdminVipMembersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vipMembers', page, search, activeOnly],
    queryFn: async () => {
      const resp = await adminAPI.getVipMembers({ page, limit: 20, search: search || undefined, activeOnly });
      return resp.data;
    }
  });

  const members = data?.data || [];
  const pagination = data?.pagination;

  const [selectedUser, setSelectedUser] = useState(null);
  const { data: refTree, isLoading: refLoading } = useQuery({
    queryKey: ['refTree', selectedUser?.user?.id],
    enabled: !!selectedUser?.user?.id,
    queryFn: async () => {
      const resp = await adminAPI.getReferralTree(selectedUser.user.id, 3);
      return resp.data?.data || resp.data;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">VIP Members</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, level"
            className="px-3 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
            Active only
          </label>
          <Button onClick={() => { setPage(1); refetch(); }} className="bg-blue-500 hover:bg-blue-600 text-white">Filter</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-300">No VIP members found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-white/10 rounded-lg overflow-hidden">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">VIP Level</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10" onClick={() => setSelectedUser(m)}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{m.user.fullName || m.user.email || m.user.phone || 'User'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.user.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.user.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{m.vipLevel?.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${m.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="bg-gray-500 hover:bg-gray-600 text-white">Prev</Button>
            <Button onClick={() => setPage((p) => p + 1)} disabled={pagination.currentPage >= pagination.totalPages} className="bg-gray-700 hover:bg-gray-800 text-white">Next</Button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="backdrop-blur-xl bg-white dark:bg-white/10 rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
                <button className="text-gray-500 dark:text-gray-300 text-2xl" onClick={() => setSelectedUser(null)}>×</button>
              </div>
              <div className="mb-4">
                <div className="text-gray-900 dark:text-white font-medium">{selectedUser.user.fullName || selectedUser.user.email || selectedUser.user.phone || 'User'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">VIP: {selectedUser.vipLevel?.name} • Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Referral Tree</h4>
                {refLoading ? (
                  <div className="text-gray-600 dark:text-gray-300">Loading referrals...</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {(Array.isArray(refTree) ? refTree : []).map((node) => (
                      <div key={node.id} className="pl-2">
                        <div className="text-gray-900 dark:text-white">
                          Level {node.level}: {node.fullName || node.email || node.phone || node.id}
                        </div>
                        {node.children && node.children.length > 0 && (
                          <div className="pl-4 border-l border-gray-200 dark:border-white/10 mt-1">
                            {node.children.map((child) => (
                              <div key={child.id} className="mb-1">
                                <div className="text-gray-800 dark:text-gray-200">
                                  Level {child.level}: {child.fullName || child.email || child.phone || child.id}
                                </div>
                                {child.children && child.children.length > 0 && (
                                  <div className="pl-4 border-l border-gray-200 dark:border-white/10 mt-1">
                                    {child.children.map((gchild) => (
                                      <div key={gchild.id} className="text-gray-700 dark:text-gray-300">
                                        Level {gchild.level}: {gchild.fullName || gchild.email || gchild.phone || gchild.id}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVipMembersList;


