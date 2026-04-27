import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { 
  LayoutDashboard, 
  ListTodo, 
  Sparkles, 
  LogOut, 
  LogIn, 
  ChevronRight
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import RAIDBoard from './components/RAIDBoard';
import AIHelper from './components/AIHelper';
import AIAgent from './components/AIAgent';
import { Bot } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'board' | 'ai' | 'agent'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const q = query(collection(db, 'raidItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(docs);
    }, (error) => {
      console.error("RAID Items Listener Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-natural-accent rounded-xl mb-4" />
          <div className="h-4 w-32 bg-natural-surface rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-10 border border-natural-line flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-natural-accent text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-natural-accent/20">
            <LayoutDashboard size={32} />
          </div>
          <h1 className="text-3xl font-bold text-natural-ink mb-2 tracking-tight text-center serif italic">RAID Dynamics</h1>
          <p className="text-natural-muted mb-8 leading-relaxed text-center font-medium">
            AI-powered project risk and action tracking. Log in to start managing your project's RAID logs with intelligent automation.
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-natural-accent text-white py-4 px-6 rounded-full font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-natural-line flex flex-col z-10 sticky top-0 md:h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-natural-accent rounded-lg shadow-md flex items-center justify-center text-white font-serif italic text-xl">
              R
            </div>
            <h2 className="font-bold text-xl tracking-tight text-natural-ink leading-tight">RAID Dynamics</h2>
          </div>

          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
            />
            <NavItem 
              active={activeTab === 'board'} 
              onClick={() => setActiveTab('board')}
              icon={<ListTodo size={20} />}
              label="RAID Board"
            />
            <NavItem 
              active={activeTab === 'ai'} 
              onClick={() => setActiveTab('ai')}
              icon={<Sparkles size={20} />}
              label="AI Extraction"
            />
            <NavItem 
              active={activeTab === 'agent'} 
              onClick={() => setActiveTab('agent')}
              icon={<Bot size={20} />}
              label="AI Raksha"
            />
          </nav>
        </div>

        <div className="mt-auto p-6 bg-natural-surface/30 border-t border-natural-line">
          <div className="flex items-center gap-3 mb-4 p-2">
            {user.photoURL && (
              <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-natural-ink truncate">{user.displayName}</p>
              <p className="text-xs text-natural-muted truncate font-medium">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-natural-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard items={items} />}
          {activeTab === 'board' && <RAIDBoard items={items} />}
          {activeTab === 'ai' && <AIHelper onItemsExtracted={() => setActiveTab('board')} />}
          {activeTab === 'agent' && <AIAgent items={items} />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-sm font-bold",
        active 
          ? "bg-natural-surface text-natural-accent shadow-sm" 
          : "text-natural-muted hover:bg-natural-bg hover:text-natural-ink"
      )}
    >
      <span className={cn("transition-colors", active ? "text-natural-accent" : "text-natural-muted group-hover:text-natural-accent")}>
        {icon}
      </span>
      {label}
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}
