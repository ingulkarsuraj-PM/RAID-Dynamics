import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Users, 
  Send, 
  Plus, 
  Trash2, 
  Mail, 
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateStakeholderReport, queryRAIDLog } from '../services/gemini';
import Markdown from 'react-markdown';

interface AIAgentProps {
  items: any[];
}

interface Message {
  role: 'user' | 'raksha';
  text: string;
  timestamp: Date;
}

export default function AIAgent({ items }: AIAgentProps) {
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ name: '', email: '', role: '' });
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [nudgeCount, setNudgeCount] = useState(0);

  // Auto-Scanner Logic
  useEffect(() => {
    if (items.length > 0 && !isNudging) {
      const scanForNudges = () => {
        const today = new Date();
        const atRisk = items.filter(item => {
          if (!item.dueDate || item.status === 'CLOSED') return false;
          const dueDate = new Date(item.dueDate);
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 2; // Overdue or due within 2 days
        });

        if (atRisk.length > 0) {
          setNudgeCount(atRisk.length);
        }
      };
      
      scanForNudges();
    }
  }, [items]);

  const handleAutoNudge = () => {
    setIsNudging(true);
    setTimeout(() => {
      setIsNudging(false);
      setToast(`Raksha has automatically nudged ${nudgeCount} owners with pending critical items.`);
      setTimeout(() => setToast(null), 5000);
      setNudgeCount(0);
    }, 2500);
  };
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'raksha', text: "Hello! I am **AI Raksha**, your RAID Dynamics Agent. How can I assist you with your project tracking today?", timestamp: new Date() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'stakeholders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStakeholders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Stakeholders Listener Error:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStakeholder.name || !newStakeholder.email) return;

    try {
      await addDoc(collection(db, 'stakeholders'), {
        ...newStakeholder,
        createdAt: new Date().toISOString()
      });
      setNewStakeholder({ name: '', email: '', role: '' });
      setIsAdding(false);
      setToast(`Stakeholder ${newStakeholder.name} has been added.`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    await deleteDoc(doc(db, 'stakeholders', id));
    setToast('Stakeholder removed from distribution list.');
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    const text = await generateStakeholderReport(items, stakeholders);
    setReport(text);
    setLoading(false);
  };

  const handleSendReport = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setToast('Raksha has shared the daily briefing with ' + stakeholders.length + ' stakeholders.');
      setTimeout(() => setToast(null), 4000);
      setReport(null);
    }, 2000);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const response = await queryRAIDLog(userMsg, items);
      setChatMessages(prev => [...prev, { role: 'raksha', text: response, timestamp: new Date() }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'raksha', text: "I'm sorry, I'm having trouble connecting to my knowledge base.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Hero / Header */}
      <header className="relative overflow-hidden p-10 bg-natural-ink rounded-[2.5rem] shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Bot size={240} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-natural-accent rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-natural-accent/40 ring-4 ring-white/10">
            <Bot size={56} />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-black text-white italic serif tracking-tight">Meet AI Raksha</h1>
              <span className="bg-white/10 text-white/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                Primary Agent
              </span>
            </div>
            <p className="text-stone-400 font-medium text-sm max-w-xl">
              Raksha is your autonomous project guardian. She monitors RAID logs, predicts potential bottlenecks, and ensures stakeholders are always in the loop.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
             <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Items Protected</p>
                <p className="text-2xl font-black text-white">{items.length}</p>
             </div>
             {nudgeCount > 0 && (
                <button 
                  onClick={handleAutoNudge}
                  disabled={isNudging}
                  className="bg-white px-6 py-4 rounded-3xl border border-natural-accent shadow-xl shadow-natural-accent/10 hover:scale-105 transition-all text-left flex flex-col justify-center animate-pulse"
                >
                  <p className="text-[10px] font-black text-natural-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Zap size={12} fill="currentColor" />
                    Smart Nudges Ready
                  </p>
                  <p className="text-2xl font-black text-natural-ink italic serif flex items-center gap-2">
                    {isNudging ? "Nudging..." : `${nudgeCount} Alerts`}
                  </p>
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Demo Section */}
      <section className="bg-natural-surface/30 p-8 rounded-[2rem] border-2 border-dashed border-natural-line">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-natural-accent" size={24} />
          <h2 className="text-xl font-bold text-natural-ink italic serif">How Raksha Works (Live Demo)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DemoStep 
            icon={<ShieldCheck className="text-green-600" />} 
            title="Monitoring" 
            desc="Raksha constantly scans your RAID board for high-impact risks and approaching deadlines." 
          />
          <DemoStep 
            icon={<Sparkles className="text-blue-600" />} 
            title="Analysis" 
            desc="She uses PMI methodology to calculate risk scores and suggests mitigation strategies." 
          />
          <DemoStep 
            icon={<Send className="text-natural-accent" />} 
            title="Reporting" 
            desc="She generates executive summaries and shares them with your stakeholder distribution list automatically." 
          />
        </div>
      </section>

      {/* Management Section: Stakeholders & Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stakeholders Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-natural-line shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-natural-ink italic serif flex items-center gap-2">
                <Users size={20} className="text-natural-accent" />
                Stakeholders
              </h2>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mt-1">Distribution List</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="w-10 h-10 bg-natural-surface text-natural-accent rounded-full flex items-center justify-center hover:bg-natural-accent hover:text-white transition-all shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="col-span-full overflow-hidden"
                >
                  <form 
                    onSubmit={handleAddStakeholder}
                    className="bg-natural-surface/50 p-6 rounded-2xl border border-natural-line space-y-4 mb-4"
                  >
                    <div className="space-y-3">
                      <input
                        autoFocus
                        placeholder="Name"
                        className="w-full bg-white px-4 py-3 rounded-xl border border-natural-line text-xs font-bold outline-none focus:ring-2 focus:ring-natural-accent/20 transition-all"
                        value={newStakeholder.name}
                        onChange={e => setNewStakeholder(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full bg-white px-4 py-3 rounded-xl border border-natural-line text-xs font-bold outline-none focus:ring-2 focus:ring-natural-accent/20 transition-all"
                        value={newStakeholder.email}
                        onChange={e => setNewStakeholder(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                      <input
                        placeholder="Role (e.g., Sponsor, Dev Lead)"
                        className="w-full bg-white px-4 py-3 rounded-xl border border-natural-line text-xs font-bold outline-none focus:ring-2 focus:ring-natural-accent/20 transition-all"
                        value={newStakeholder.role}
                        onChange={e => setNewStakeholder(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-white text-natural-muted rounded-xl border border-natural-line hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-[2] py-3 text-[10px] font-black uppercase tracking-widest bg-natural-accent text-white rounded-xl shadow-lg shadow-natural-accent/20 hover:scale-[1.02] transition-all"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              {stakeholders.map(s => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={s.id}
                  className="group bg-natural-bg p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-natural-line hover:bg-white transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-natural-ink truncate capitalize">{s.name}</p>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">{s.role || 'Stakeholder'}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteStakeholder(s.id)}
                    className="p-2 text-natural-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {stakeholders.length === 0 && !isAdding && (
              <div className="col-span-full text-center py-10 opacity-50">
                <Users size={32} className="mx-auto mb-3 text-natural-line" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Stakeholders Registered</p>
              </div>
            )}
          </div>
        </section>

        {/* Briefing Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-natural-line shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-natural-ink italic serif">Daily Briefing</h2>
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mt-1">AI Generated Summary</p>
            </div>
            <button 
              onClick={() => {
                setToast(`Current System Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
                setTimeout(() => setToast(null), 3000);
              }}
              className="bg-natural-surface p-3 rounded-xl text-natural-accent hover:bg-natural-accent hover:text-white transition-all shadow-sm"
              title="View System Calendar"
            >
              <Calendar size={20} />
            </button>
          </div>
          
          <div className="flex-1">
            {report ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-natural-bg p-6 rounded-2xl border border-natural-line prose prose-sm prose-stone max-h-[180px] overflow-auto">
                   <Markdown>{report}</Markdown>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setReport(null)}
                     className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-natural-surface text-natural-muted rounded-xl"
                   >
                     Redraft
                   </button>
                   <button 
                     onClick={handleSendReport}
                     className="flex-[2] py-3 text-[10px] font-black uppercase tracking-widest bg-natural-accent text-white rounded-xl shadow-lg shadow-natural-accent/20"
                   >
                     Send Daily
                   </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full h-full min-h-[150px] group relative overflow-hidden bg-natural-surface/50 text-natural-ink p-8 rounded-3xl text-left transition-all border border-natural-line hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-muted mb-2">Automated Governance</p>
                   <h3 className="text-xl font-bold mb-4 serif italic">Generate Executive Briefing</h3>
                   <div className="flex items-center gap-2 text-natural-accent font-bold text-xs">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                      <span>{loading ? 'Raksha is analyzing logs...' : 'Initiate Analysis'}</span>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Sparkles size={80} />
                </div>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Expanded Chat Section */}
      <div className="flex flex-col bg-white rounded-[2rem] border border-natural-line shadow-xl overflow-hidden h-[600px]">
          <div className="p-6 bg-natural-ink border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-natural-accent">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white italic serif leading-none">Chat with AI Raksha</h2>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Knowledge Base: Live RAID Log
                </p>
              </div>
            </div>
            <div className="flex -space-x-2">
               {items.slice(0, 3).map((_, i) => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-natural-ink bg-natural-surface flex items-center justify-center text-[8px] font-black text-natural-accent">
                    {['R', 'A', 'I', 'D'][i]}
                 </div>
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 space-y-6 bg-natural-bg/20">
            {chatMessages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={i}
                className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] p-5 rounded-3xl shadow-sm",
                  msg.role === 'user' 
                    ? "bg-natural-accent text-white rounded-tr-none" 
                    : "bg-white border border-natural-line text-natural-ink rounded-tl-none prose prose-sm prose-stone max-w-[90%]"
                )}>
                  {msg.role === 'raksha' ? (
                    <Markdown>{msg.text}</Markdown>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  )}
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest mt-2",
                    msg.role === 'user' ? "text-white/50" : "text-natural-muted"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                 <div className="bg-white border border-natural-line p-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-natural-accent" />
                    <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest">AI Raksha is thinking...</span>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} className="p-6 bg-white border-t border-natural-line">
            <div className="relative">
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Ask AI Raksha about risks, status, or specific task details..."
                className="w-full pl-6 pr-16 py-5 bg-natural-bg border-none rounded-3xl text-sm font-medium text-natural-ink focus:ring-4 focus:ring-natural-surface transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-natural-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-natural-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center mt-4 text-[9px] font-black text-natural-muted uppercase tracking-[0.2em]">
              Instant Insights via Gemini Intelligence
            </p>
          </form>
        </div>
      {/* Action Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-natural-accent text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-natural-accent/20 font-black uppercase tracking-widest text-[10px]">
              <CheckCircle2 size={16} />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DemoStep({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-natural-line shadow-sm flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-natural-bg rounded-xl flex items-center justify-center mb-4 bg-opacity-50">
        {icon}
      </div>
      <h3 className="font-black text-natural-ink text-sm mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-natural-muted leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
