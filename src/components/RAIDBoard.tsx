import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Filter, 
  Search, 
  Bell, 
  AlertCircle,
  MoreVertical,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  X,
  Download,
  Database,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  Mail,
  Zap,
  Loader2
} from 'lucide-react';
import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { exportToCSV } from '../lib/exportUtils';
import { seedDemoData } from '../lib/demoService';

interface RAIDBoardProps {
  items: any[];
}

export default function RAIDBoard({ items }: RAIDBoardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'RISK' | 'ACTION' | 'ISSUE' | 'DEPENDENCY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    type: 'ACTION',
    status: 'OPEN',
    priority: 'MEDIUM',
    owner: '',
    ownerEmail: '',
    dueDate: '',
    probability: 3,
    impact: 3,
    mitigationPlan: '',
    contingencyPlan: '',
    rootCause: '',
    projectId: 'default'
  });

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'ALL' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    try {
      await addDoc(collection(db, 'raidItems'), {
        ...newItem,
        creatorId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsAdding(false);
      resetForm();
      showToast("RAID Item logged successfully", "success");
    } catch (error) {
      console.error("Failed to add item", error);
      showToast("Failed to add item", "error");
    }
  };

  const resetForm = () => {
    setNewItem({
      title: '',
      description: '',
      type: 'ACTION',
      status: 'OPEN',
      priority: 'MEDIUM',
      owner: '',
      ownerEmail: '',
      dueDate: '',
      probability: 3,
      impact: 3,
      mitigationPlan: '',
      contingencyPlan: '',
      rootCause: '',
      projectId: 'default'
    });
  };

  const handleToggleStatus = async (item: any) => {
    const nextStatus = {
      'OPEN': 'IN_PROGRESS',
      'IN_PROGRESS': 'CLOSED',
      'CLOSED': 'OPEN'
    }[item.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED'];

    await updateDoc(doc(db, 'raidItems', item.id), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteItem = async (id: string) => {
    // Switching to a direct delete for now to ensure reliability in the iframe environment
    try {
      await deleteDoc(doc(db, 'raidItems', id));
      showToast("Item deleted", "info");
    } catch (error) {
      console.error("Delete failed", error);
      showToast("Failed to delete item", "error");
    }
  };

  const handleNudge = (item: any) => {
    showToast(`Nudge sent to ${item.owner || 'Owner'} via simulation`, "success");
  };

  const handleExport = () => {
    const exportData = items.map(({ id, ...rest }) => rest);
    exportToCSV(exportData, `RAID_Log_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDemo = async () => {
    if (!auth.currentUser) return;
    setIsSeeding(true);
    try {
      await seedDemoData(auth.currentUser.uid);
      showToast("Demo RAID log seeded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to seed demo data", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-natural-ink tracking-tight italic serif">RAID Log</h1>
          <p className="text-[10px] text-natural-muted font-black uppercase tracking-[0.2em]">{filteredItems.length} items tracked • PMI Standards Active</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDemo}
            disabled={isSeeding}
            className="flex items-center gap-2 bg-white text-natural-accent border border-natural-line px-5 py-2.5 rounded-full font-bold hover:bg-natural-bg transition-all shadow-sm text-xs"
          >
            <Database size={16} />
            {isSeeding ? 'Seeding...' : 'Demo Data'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-natural-ink border border-natural-line px-5 py-2.5 rounded-full font-bold hover:bg-natural-bg transition-all shadow-sm text-xs"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-natural-accent text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition-all shadow-md active:scale-95 text-xs"
          >
            <Plus size={18} />
            Log New Item
          </button>
        </div>
      </header>

      {/* Sync Section */}
      <div className="bg-natural-surface/30 border border-natural-line rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-natural-accent">
          <RefreshCw size={20} className="animate-spin-slow" />
          <div className="text-left">
            <h4 className="text-xs font-bold uppercase tracking-widest text-natural-ink">Excel Live Sync</h4>
            <p className="text-[10px] font-medium text-natural-muted">Connect your RAID log to Microsoft Excel Online for real-time bidirectional dashboarding.</p>
          </div>
        </div>
        <button 
          onClick={() => showToast('Excel Sync requires Graph API initialization', 'info')}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-natural-accent border border-natural-line hover:shadow-sm transition-all"
        >
          <ExternalLink size={14} />
          Setup Excel Sync
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-natural-line shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={18} />
          <input
            type="text"
            placeholder="Search log entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-natural-bg rounded-xl text-sm border-none focus:ring-2 focus:ring-natural-surface transition-all font-medium text-natural-ink placeholder:text-natural-muted/50 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'RISK', 'ACTION', 'ISSUE', 'DEPENDENCY'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === t 
                  ? "bg-natural-accent text-white shadow-sm" 
                  : "bg-natural-surface text-natural-muted hover:bg-natural-bg hover:text-natural-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id}
              className="bg-white rounded-3xl border border-natural-line shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative flex flex-col"
            >
              <div className={cn(
                "h-2 w-full",
                item.type === 'RISK' && "bg-natural-signal",
                item.type === 'ACTION' && "bg-natural-accent",
                item.type === 'ISSUE' && "bg-natural-muted",
                item.type === 'DEPENDENCY' && "bg-stone-400",
              )} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                      item.type === 'RISK' && "bg-natural-warm text-natural-signal",
                      item.type === 'ACTION' && "bg-natural-surface text-natural-accent",
                      item.type === 'ISSUE' && "bg-natural-surface text-natural-muted",
                      item.type === 'DEPENDENCY' && "bg-stone-50 text-stone-500",
                    )}>
                      {item.type}
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                      item.priority === 'HIGH' ? "bg-natural-accent text-white" : "bg-natural-surface text-natural-muted"
                    )}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleNudge(item)}
                      title="Nudge Owner"
                      className="p-1.5 text-natural-muted hover:text-natural-accent hover:bg-natural-surface rounded-lg transition-colors"
                    >
                      <Bell size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-natural-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-natural-ink mb-2 leading-tight uppercase tracking-tight">{item.title}</h3>
                <p className="text-xs text-natural-muted mb-4 line-clamp-2 leading-relaxed font-medium">
                  {item.description || "No description provided."}
                </p>

                {/* PMI Details for Risks/Issues */}
                {(item.type === 'RISK' || item.type === 'ISSUE') && (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {item.probability && (
                      <div className="p-2 bg-natural-bg rounded-xl border border-natural-line">
                        <p className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Probability</p>
                        <p className="text-xs font-black text-natural-accent">{item.probability}/5</p>
                      </div>
                    )}
                    {item.impact && (
                      <div className="p-2 bg-natural-bg rounded-xl border border-natural-line">
                        <p className="text-[8px] font-black text-natural-muted uppercase tracking-widest">Impact Scale</p>
                        <p className="text-xs font-black text-natural-signal">{item.impact}/5</p>
                      </div>
                    )}
                  </div>
                )}

                {item.mitigationPlan && item.status !== 'CLOSED' && (
                  <div className="mb-4 p-3 bg-natural-warm/50 border border-natural-signal/20 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldAlert size={12} className="text-natural-signal" />
                      <p className="text-[8px] font-black text-natural-signal uppercase tracking-widest">Mitigation Plan</p>
                    </div>
                    <p className="text-[10px] text-natural-ink italic font-medium leading-tight">{item.mitigationPlan}</p>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-4 pt-4 border-t border-natural-line text-[10px] font-black uppercase tracking-widest text-natural-muted">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-natural-line" />
                    <span>{item.owner || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-natural-line" />
                    <span>{formatDate(item.dueDate) || 'No date'}</span>
                  </div>
                  <button 
                    onClick={() => handleToggleStatus(item)}
                    className={cn(
                      "ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px] transition-colors",
                      item.status === 'CLOSED' ? "bg-natural-accent text-white" : "bg-natural-surface text-natural-muted"
                    )}
                  >
                    {item.status === 'CLOSED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {item.status}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-natural-ink/40 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAddItem}
              className="bg-natural-bg w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto border border-natural-line"
            >
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 p-2 text-natural-muted hover:text-natural-ink rounded-full hover:bg-white transition-all shadow-sm"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-natural-ink italic serif">New RAID Entry</h2>
                <p className="text-natural-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1">PMI Standards Alignment: Risk & Action Tracking</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Title</label>
                  <input
                    required
                    value={newItem.title}
                    onChange={e => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Brief summary..."
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Type</label>
                  <select
                    value={newItem.type}
                    onChange={e => {
                      const type = e.target.value as any;
                      setNewItem({...newItem, type });
                    }}
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-bold outline-none"
                  >
                    <option value="RISK">Risk</option>
                    <option value="ACTION">Action</option>
                    <option value="ISSUE">Issue</option>
                    <option value="DEPENDENCY">Dependency</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Priority</label>
                  <select
                    value={newItem.priority}
                    onChange={e => setNewItem({...newItem, priority: e.target.value})}
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-bold outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    placeholder="PMI Context: Describe the impact on project objectives..."
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium min-h-[100px] outline-none"
                  />
                </div>

                {/* PMI Specific Fields for Risks/Issues */}
                {(newItem.type === 'RISK' || newItem.type === 'ISSUE') && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Probability (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={newItem.probability}
                        onChange={e => setNewItem({...newItem, probability: parseInt(e.target.value)})}
                        className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Impact (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={newItem.impact}
                        onChange={e => setNewItem({...newItem, impact: parseInt(e.target.value)})}
                        className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Mitigation Plan (PMI Standards)</label>
                      <textarea
                        value={newItem.mitigationPlan}
                        onChange={e => setNewItem({...newItem, mitigationPlan: e.target.value})}
                        placeholder="Steps to reduce probability or impact..."
                        className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium min-h-[80px] outline-none"
                      />
                    </div>
                  </>
                )}

                {newItem.type === 'ISSUE' && (
                  <div className="space-y-4 md:col-span-2">
                    <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Root Cause</label>
                    <textarea
                      value={newItem.rootCause}
                      onChange={e => setNewItem({...newItem, rootCause: e.target.value})}
                      placeholder="Why did this issue occur?"
                      className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium min-h-[80px] outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Owner Name</label>
                  <input
                    value={newItem.owner}
                    onChange={e => setNewItem({...newItem, owner: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Owner Email</label>
                  <input
                    type="email"
                    value={newItem.ownerEmail}
                    onChange={e => setNewItem({...newItem, ownerEmail: e.target.value})}
                    placeholder="e.g. john@example.com"
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-medium outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Due Date</label>
                  <input
                    type="date"
                    value={newItem.dueDate}
                    onChange={e => setNewItem({...newItem, dueDate: e.target.value})}
                    className="w-full px-5 py-4 bg-white border-2 border-natural-line rounded-2xl focus:border-natural-accent transition-colors font-bold outline-none uppercase text-xs"
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 px-6 rounded-full font-black uppercase tracking-widest text-xs bg-natural-surface text-natural-muted hover:bg-natural-line transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 rounded-full font-black uppercase tracking-widest text-xs bg-natural-accent text-white hover:opacity-90 transition-all shadow-md"
                >
                  Create Entry
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={cn(
              "px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border font-black uppercase tracking-widest text-[10px]",
              toast.type === 'success' && "bg-natural-accent text-white border-natural-accent",
              toast.type === 'error' && "bg-red-600 text-white border-red-600",
              toast.type === 'info' && "bg-natural-ink text-white border-natural-ink",
            )}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
