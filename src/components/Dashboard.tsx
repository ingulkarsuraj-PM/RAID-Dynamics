import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  ShieldAlert, 
  Clock, 
  AlertCircle, 
  Link2, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface DashboardProps {
  items: any[];
}

export default function Dashboard({ items }: DashboardProps) {
  const typeStats = [
    { name: 'RISK', value: items.filter(i => i.type === 'RISK').length, color: '#F87171' }, // Soft Red
    { name: 'ACTION', value: items.filter(i => i.type === 'ACTION').length, color: '#A3E635' }, // Soft Lime
    { name: 'ISSUE', value: items.filter(i => i.type === 'ISSUE').length, color: '#FBBF24' }, // Soft Amber
    { name: 'DEPENDENCY', value: items.filter(i => i.type === 'DEPENDENCY').length, color: '#A8A29E' }, // Soft Stone
  ];

  const statusStats = [
    { name: 'OPEN', value: items.filter(i => i.status === 'OPEN').length, color: '#F87171' },
    { name: 'IN-PROGRESS', value: items.filter(i => i.status === 'IN_PROGRESS').length, color: '#FBBF24' },
    { name: 'CLOSED', value: items.filter(i => i.status === 'CLOSED').length, color: '#34D399' },
  ];

  const risks = items.filter(i => i.type === 'RISK');
  const avgRiskScore = risks.length > 0 
    ? (risks.reduce((acc, r) => acc + ((r.probability || 0) * (r.impact || 0)), 0) / risks.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-4xl font-black text-natural-ink tracking-tight mb-2 italic serif capitalize">
          Project Intelligence
        </h1>
        <p className="text-natural-muted font-bold text-sm uppercase tracking-widest">PMI Standard Metrics & RAID Analysis</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<ShieldAlert className="text-natural-signal" />} 
          label="Avg Risk Score" 
          value={Number(avgRiskScore)} 
          trend="Impact x Prob"
          trendValue={risks.filter(r => (r.probability || 0) * (r.impact || 0) >= 15).length}
        />
        <StatCard 
          icon={<TrendingUp className="text-natural-accent" />} 
          label="Risk Coverage" 
          value={Math.round((risks.filter(r => r.mitigationPlan).length / (risks.length || 1)) * 100)} 
          trend="Plan Ready"
          trendValue={risks.filter(r => r.mitigationPlan).length}
        />
        <StatCard 
          icon={<AlertCircle className="text-natural-muted" />} 
          label="P1 Issues" 
          value={items.filter(i => i.type === 'ISSUE' && i.priority === 'HIGH' && i.status !== 'CLOSED').length} 
          trend="Pending"
          trendValue={items.filter(i => i.type === 'ISSUE' && i.status !== 'CLOSED').length}
        />
        <StatCard 
          icon={<Link2 className="text-stone-400" />} 
          label="Blockers" 
          value={items.filter(i => i.type === 'DEPENDENCY' && i.priority === 'HIGH').length} 
          trend="Critical"
          trendValue={items.filter(i => i.type === 'DEPENDENCY').length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-natural-line shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif italic text-natural-accent font-bold">
               RAID Composition
            </h3>
            <div className="text-[10px] px-3 py-1 bg-natural-surface rounded-full font-black text-natural-muted uppercase tracking-widest">
              By Category
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeStats} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DA" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#A4907C' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#A4907C' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E5E2DA', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', backgroundColor: '#FDFCF8' }}
                  cursor={{ fill: '#FDFCF8' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-natural-line shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif italic text-natural-accent font-bold">Health Status</h3>
            <div className="text-[10px] px-3 py-1 bg-natural-surface rounded-full font-black text-natural-muted uppercase tracking-widest">
              Lifecycle
            </div>
          </div>
          <div className="h-64 flex items-center">
            <div className="w-full flex justify-center">
              <PieChart width={300} height={200}>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <div className="flex flex-col gap-4 ml-4">
              {statusStats.map(stat => (
                <div key={stat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <div>
                    <p className="text-[10px] font-black text-natural-ink leading-none uppercase tracking-widest">{stat.name}</p>
                    <p className="text-[10px] text-natural-muted font-bold">{stat.value} items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Risk Heat Map Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-[2.5rem] border border-natural-line shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h3 className="text-2xl font-serif italic text-natural-ink font-bold leading-tight">Risk Heat Map</h3>
            <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mt-1">PMI Probability / Impact Matrix (Scale 1-5)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-natural-signal" />
              <span className="text-[9px] font-black uppercase tracking-widest text-natural-muted">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-natural-muted" />
              <span className="text-[9px] font-black uppercase tracking-widest text-natural-muted">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-natural-line" />
              <span className="text-[9px] font-black uppercase tracking-widest text-natural-muted">Moderate</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-16 items-start">
          {/* Matrix Container */}
          <div className="relative flex-[1.4] w-full min-w-0 pr-4 lg:pl-10">
             {/* Y-Axis Label */}
             <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-black uppercase tracking-[0.3em] text-natural-ink/80 origin-left -translate-x-1/2 hidden xl:block whitespace-nowrap">
               Probability
             </div>

             <div className="grid grid-cols-5 gap-3">
               {Array.from({ length: 25 }).map((_, idx) => {
                 const prob = 5 - Math.floor(idx / 5);
                 const imp = (idx % 5) + 1;
                 const count = risks.filter(r => r.probability === prob && r.impact === imp).length;
                 const score = prob * imp;
                 
                 return (
                   <motion.div 
                     key={idx}
                     whileHover={{ scale: 1.02 }}
                     className={cn(
                       "aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all border-2",
                       score >= 15 ? "bg-natural-signal/30 border-natural-signal/50 text-natural-signal" :
                       score >= 8 ? "bg-natural-muted/30 border-natural-muted/50 text-natural-muted" :
                       "bg-natural-surface/80 border-natural-line text-stone-400",
                       count > 0 && "shadow-lg shadow-black/5 ring-2 ring-inset ring-white/30"
                     )}
                   >
                     {count > 0 ? (
                        <>
                          <span className="text-2xl font-black">{count}</span>
                          <span className="text-[9px] font-black opacity-70 uppercase tracking-widest mt-1">Items</span>
                        </>
                     ) : (
                       <span className="text-[8px] font-black opacity-30 tracking-tight">{prob}x{imp}</span>
                     )}
                     
                     {/* Tooltip Hover Overlay */}
                     {count > 0 && (
                       <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center p-2 z-10 backdrop-blur-md shadow-xl border border-natural-line">
                          <p className="text-[10px] font-black uppercase leading-tight text-center text-natural-ink">
                            {count} {count === 1 ? 'Risk' : 'Risks'} <br/> at {prob}x{imp}
                          </p>
                       </div>
                     )}
                   </motion.div>
                 );
               })}
             </div>

             {/* Scale Labels */}
             <div className="grid grid-cols-5 gap-2 mt-4">
                {[1, 2, 3, 4, 5].map(v => (
                  <div key={v} className="text-center text-[10px] font-black text-natural-ink/60">{v}</div>
                ))}
             </div>

             {/* X-Axis Label */}
             <div className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.3em] text-natural-ink/80">
               Impact Level
             </div>
          </div>

          {/* Critical Risks List */}
          <div className="flex-1 w-full lg:max-w-md space-y-5 min-w-[300px]">
             <h4 className="text-sm font-black uppercase tracking-[0.2em] text-natural-ink mb-6 flex items-center gap-3">
               <AlertCircle size={18} className="text-natural-signal" />
               Critical Exposure List
             </h4>
             <div className="space-y-4 max-h-[500px] overflow-auto pr-3 custom-scrollbar">
                {risks
                  .filter(r => (r.probability || 0) * (r.impact || 0) >= 15)
                  .sort((a, b) => ((b.probability || 0) * (b.impact || 0)) - ((a.probability || 0) * (a.impact || 0)))
                  .map(risk => (
                    <div key={risk.id} className="p-5 bg-white border border-natural-line rounded-2xl hover:border-natural-signal/30 hover:shadow-lg transition-all group relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-natural-signal" />
                       <div className="flex justify-between items-start mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-natural-signal">Impact: {risk.impact} | Prob: {risk.probability}</p>
                          <div className="bg-natural-signal/10 px-2 py-1 rounded-md">
                             <p className="text-[10px] font-black text-natural-signal">Score: {(risk.probability || 0) * (risk.impact || 0)}</p>
                          </div>
                       </div>
                       <p className="text-sm font-black text-natural-ink group-hover:text-natural-accent transition-colors mb-2 leading-tight">{risk.title}</p>
                       <div className="flex items-center justify-between">
                         <p className="text-[10px] text-natural-muted font-bold tracking-tight">{risk.owner || 'Unassigned'}</p>
                         <p className="text-[9px] font-black text-natural-accent uppercase tracking-widest">{risk.priority}</p>
                       </div>
                    </div>
                  ))}
                {risks.filter(r => (r.probability || 0) * (r.impact || 0) >= 15).length === 0 && (
                  <div className="text-center py-10 bg-natural-bg rounded-3xl border border-dashed border-natural-line">
                     <p className="text-[10px] font-black uppercase tracking-widest text-natural-line">No Critical Exposure Items</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, trendValue }: { 
  icon: React.ReactNode, 
  label: string, 
  value: number, 
  trend: string,
  trendValue: number 
}) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-natural-line shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-natural-bg rounded-xl">
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-natural-muted uppercase tracking-widest">
           {trend}
        </div>
      </div>
      <div>
        <h4 className="text-4xl font-serif italic font-bold text-natural-accent mb-1 leading-none">{value.toString().padStart(2, '0')}</h4>
        <p className="text-[10px] font-black text-natural-muted uppercase tracking-wider">{label}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-natural-bg flex items-center justify-between text-[10px]">
        <span className="text-natural-muted font-bold uppercase tracking-widest">Metric:</span>
        <span className="font-black text-natural-ink">{trendValue}</span>
      </div>
    </motion.div>
  );
}
