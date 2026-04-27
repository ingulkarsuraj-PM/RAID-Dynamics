import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractRAIDItems, ExtractedRAIDItem } from '../services/gemini';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface AIHelperProps {
  onItemsExtracted: () => void;
}

export default function AIHelper({ onItemsExtracted }: AIHelperProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ExtractedRAIDItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const items = await extractRAIDItems(text);
    setSuggestions(items);
    setSelectedIndices(items.map((_, i) => i));
    setLoading(false);
  };

  const handleSave = async () => {
    const itemsToSave = suggestions.filter((_, i) => selectedIndices.includes(i));
    
    try {
      for (const item of itemsToSave) {
        await addDoc(collection(db, 'raidItems'), {
          ...item,
          projectId: 'default',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      onItemsExtracted();
    } catch (error) {
      console.error("Failed to save suggested items", error);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-natural-surface rounded-2xl mb-4 text-natural-accent">
          <Sparkles size={32} />
        </div>
        <h1 className="text-4xl font-black text-natural-ink tracking-tight italic serif mb-4 capitalize">
          Intelligent RAID Extraction
        </h1>
        <p className="text-natural-muted max-w-lg mx-auto font-bold uppercase tracking-widest text-[10px] leading-relaxed">
          Paste your meeting notes, project transcripts, or stakeholder updates. RAID Dynamics will automatically identify potential Risks, Actions, Issues, and Dependencies.
        </p>
      </header>

      <section className="bg-white rounded-3xl border border-natural-line shadow-xl shadow-stone-200/10 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] pl-1">Input Text</label>
            <textarea
              className="w-full h-48 bg-natural-bg border-none rounded-2xl p-6 text-natural-ink font-medium leading-relaxed focus:ring-4 focus:ring-natural-surface transition-all outline-none resize-none"
              placeholder="Example: During our sync, we discussed the possible delay in API delivery which is a high risk. Sarah needs to follow up with the vendor by Friday. There's also an issue with the auth flow failing for certain users..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleExtract}
            disabled={loading || !text.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-5 px-8 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-md active:scale-95",
              loading || !text.trim()
                ? "bg-natural-surface text-natural-muted cursor-not-allowed"
                : "bg-natural-accent text-white hover:opacity-90 shadow-natural-accent/10"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Processing Analysis...
              </>
            ) : (
              <>
                <Sparkles size={20} className="text-natural-surface" />
                Extract RAID Items
              </>
            )}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-natural-ink italic serif tracking-tight">
                Identified Items ({suggestions.length})
              </h2>
              <p className="text-natural-muted text-[10px] font-black uppercase tracking-widest">Select items to import into your log</p>
            </div>

            <div className="grid gap-4">
              {suggestions.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  onClick={() => toggleSelect(idx)}
                  className={cn(
                    "group relative p-6 bg-white rounded-3xl border-2 transition-all cursor-pointer flex gap-6",
                    selectedIndices.includes(idx) 
                      ? "border-natural-accent shadow-lg shadow-natural-accent/5" 
                      : "border-natural-line hover:border-natural-muted shadow-sm"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs",
                    item.type === 'RISK' && "bg-natural-warm text-natural-signal",
                    item.type === 'ACTION' && "bg-natural-surface text-natural-accent",
                    item.type === 'ISSUE' && "bg-natural-surface text-natural-muted",
                    item.type === 'DEPENDENCY' && "bg-stone-50 text-stone-500",
                  )}>
                    {item.type[0]}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] font-black text-natural-muted uppercase tracking-[0.2em]">{item.type}</span>
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        item.priority === 'HIGH' ? "bg-natural-signal" : "bg-natural-line"
                      )} />
                      <span className="text-[9px] font-black text-natural-muted uppercase tracking-[0.2em]">{item.priority}</span>
                    </div>
                    <h3 className="font-bold text-natural-ink text-lg uppercase tracking-tight group-hover:text-natural-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-natural-muted text-sm leading-relaxed mt-2 font-medium">{item.description}</p>
                    {item.owner && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-natural-bg rounded-lg text-[10px] font-black uppercase tracking-widest text-natural-accent">
                        Assignee candidate: {item.owner}
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    selectedIndices.includes(idx)
                      ? "bg-natural-accent border-natural-accent text-white"
                      : "border-natural-line text-transparent group-hover:border-natural-muted"
                  )}>
                    <CheckCircle2 size={18} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-8">
              <button
                onClick={handleSave}
                disabled={selectedIndices.length === 0}
                className={cn(
                  "w-full py-6 px-8 rounded-full font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl active:scale-95",
                  selectedIndices.length === 0
                    ? "bg-natural-surface text-natural-muted cursor-not-allowed"
                    : "bg-natural-ink text-natural-bg hover:bg-black shadow-natural-ink/10"
                )}
              >
                Import {selectedIndices.length} Selected Items
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
