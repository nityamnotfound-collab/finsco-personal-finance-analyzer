import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, BarChart3, Bell, BrainCircuit,
  BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleDollarSign, Download,
  FileBarChart2, FileSpreadsheet, Filter, FolderOpen, Gauge, Landmark, LayoutDashboard,
  Menu, Pencil, PieChart, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles,
  Trash2, TrendingDown, TrendingUp, Upload, Wallet, X, Zap,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ClerkProvider, SignIn, SignUp, useClerk as useClerkOriginal, useUser as useUserOriginal } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

// LOCAL DEMO MODE: Clerk authentication is disabled for local development.
// To restore Clerk later, remove this local hook block and use the original
// useUser/useClerk hooks, then restore ClerkProviderWithRoutes in App().
const LOCAL_DEMO_MODE = true;

function useUser() {
  if (LOCAL_DEMO_MODE) {
    return {
      user: {
        id: 'local-demo-user',
        firstName: 'FinSco',
        primaryEmailAddress: { emailAddress: 'demo@finsco.local' },
      },
      isLoaded: true,
      isSignedIn: true,
    } as const;
  }
  return useUserOriginal();
}

function useClerk() {
  if (LOCAL_DEMO_MODE) return { signOut: async () => {} } as const;
  return useClerkOriginal();
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#874536',
    colorForeground: '#25313a',
    colorMutedForeground: '#6f7678',
    colorBackground: '#fbf8f1',
    colorInput: '#fffdf9',
    colorInputForeground: '#25313a',
    colorDanger: '#b24f3f',
    colorNeutral: '#d9d1c4',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'auth-clerk-root',
    cardBox: 'auth-card-box',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'auth-header-title',
    headerSubtitle: 'auth-header-subtitle',
    socialButtonsBlockButtonText: 'auth-social-text',
    formFieldLabel: 'auth-form-label',
    footerActionLink: 'auth-footer-link',
    footerActionText: 'auth-footer-text',
    dividerText: 'auth-divider-text',
    identityPreviewEditButton: 'auth-edit-button',
    formFieldSuccessText: 'auth-success-text',
    alertText: 'auth-alert-text',
    logoBox: 'auth-logo-box',
    logoImage: 'auth-logo-image',
    socialButtonsBlockButton: 'auth-social-button auth-social-hidden',
    formButtonPrimary: 'auth-form-button',
    formFieldInput: 'auth-form-input',
    footerAction: 'auth-footer-action',
    dividerLine: 'auth-divider-line',
    alert: 'auth-alert',
    otpCodeFieldInput: 'auth-otp-input',
    formFieldRow: 'auth-form-row',
    main: 'auth-main',
  },
};

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

type TransactionType = 'Income' | 'Expense';
type Category = 'Food' | 'Shopping' | 'Transportation' | 'Bills' | 'Entertainment' | 'Healthcare' | 'Education' | 'Investment' | 'Rent' | 'Salary' | 'Other';
type Transaction = { id: string; date: string; description: string; amount: number; type: TransactionType; category: Category };
type Holding = { id: string; symbol: string; name: string; shares: number; purchasePrice: number; currentPrice: number };

const categories: Category[] = ['Food', 'Shopping', 'Transportation', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Investment', 'Rent', 'Salary', 'Other'];
const money = (value: number) => `₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const money2 = (value: number) => `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const dateInput = (daysAgo = 0) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };
const signed = (transaction: Transaction) => transaction.type === 'Income' ? transaction.amount : -transaction.amount;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const keywordModel: Record<Category, string[]> = {
  Food: ['swiggy', 'zomato', 'food', 'canteen', 'grocery', 'groceries', 'dinner', 'lunch', 'restaurant', 'cafe'],
  Shopping: ['amazon', 'flipkart', 'shopping', 'clothing', 'shoes', 'laptop', 'monitor', 'headphones', 'mall'],
  Transportation: ['uber', 'ola', 'metro', 'bus', 'cab', 'fuel', 'petrol', 'ride', 'transport'],
  Bills: ['electricity', 'internet', 'mobile', 'recharge', 'broadband', 'bill', 'utility'],
  Entertainment: ['netflix', 'spotify', 'movie', 'concert', 'game', 'entertainment', 'ticket'],
  Healthcare: ['doctor', 'clinic', 'hospital', 'medicine', 'pharmacy', 'health'],
  Education: ['course', 'class', 'tuition', 'book', 'certification', 'education', 'college'],
  Investment: ['sip', 'mutual fund', 'stock', 'invest', 'index fund', 'etf'],
  Rent: ['rent', 'hostel', 'accommodation'],
  Salary: ['salary', 'stipend', 'freelance', 'income', 'payment received'],
  Other: [],
};
function inferCategory(description: string): { category: Category; confidence: number } {
  const text = description.toLowerCase();
  const scores = categories.map((category) => ({
    category,
    score: keywordModel[category].filter((keyword) => text.includes(keyword)).length,
  })).sort((a, b) => b.score - a.score);
  const winner = scores[0];
  if (!winner || winner.score === 0) return { category: 'Other', confidence: 42 };
  return { category: winner.category, confidence: Math.min(97, 73 + winner.score * 9) };
}

const demoTransactions: Transaction[] = [
  { id: 't-01', date: dateInput(3), description: 'Monthly stipend', amount: 28500, type: 'Income', category: 'Salary' },
  { id: 't-02', date: dateInput(4), description: 'Hostel accommodation', amount: 7200, type: 'Expense', category: 'Rent' },
  { id: 't-03', date: dateInput(5), description: 'Mutual fund SIP', amount: 3500, type: 'Expense', category: 'Investment' },
  { id: 't-04', date: dateInput(7), description: 'Campus canteen', amount: 280, type: 'Expense', category: 'Food' },
  { id: 't-05', date: dateInput(10), description: 'Cloud certification course', amount: 4800, type: 'Expense', category: 'Education' },
  { id: 't-06', date: dateInput(12), description: 'Metro and bus pass', amount: 950, type: 'Expense', category: 'Transportation' },
  { id: 't-07', date: dateInput(15), description: 'Freelance design work', amount: 6200, type: 'Income', category: 'Other' },
  { id: 't-08', date: dateInput(18), description: 'Groceries and essentials', amount: 2240, type: 'Expense', category: 'Shopping' },
  { id: 't-09', date: dateInput(23), description: 'Internet and mobile', amount: 1199, type: 'Expense', category: 'Bills' },
  { id: 't-10', date: dateInput(31), description: 'Monthly stipend', amount: 28500, type: 'Income', category: 'Salary' },
  { id: 't-11', date: dateInput(35), description: 'Concert tickets', amount: 2600, type: 'Expense', category: 'Entertainment' },
  { id: 't-12', date: dateInput(42), description: 'Hostel accommodation', amount: 7200, type: 'Expense', category: 'Rent' },
  { id: 't-13', date: dateInput(49), description: 'Index fund SIP', amount: 3500, type: 'Expense', category: 'Investment' },
  { id: 't-14', date: dateInput(56), description: 'Laptop repair and upgrade', amount: 9400, type: 'Expense', category: 'Education' },
  { id: 't-15', date: dateInput(63), description: 'Monthly stipend', amount: 28500, type: 'Income', category: 'Salary' },
  { id: 't-16', date: dateInput(67), description: 'Electricity and internet', amount: 1540, type: 'Expense', category: 'Bills' },
  { id: 't-17', date: dateInput(74), description: 'Weekend food delivery', amount: 1680, type: 'Expense', category: 'Food' },
  { id: 't-18', date: dateInput(81), description: 'Hostel accommodation', amount: 7200, type: 'Expense', category: 'Rent' },
  { id: 't-19', date: dateInput(88), description: 'Monthly stipend', amount: 28500, type: 'Income', category: 'Salary' },
  { id: 't-20', date: dateInput(94), description: 'Emergency clinic visit', amount: 3900, type: 'Expense', category: 'Healthcare' },
  { id: 't-21', date: dateInput(101), description: 'New monitor', amount: 14800, type: 'Expense', category: 'Shopping' },
  { id: 't-22', date: dateInput(110), description: 'Monthly stipend', amount: 28500, type: 'Income', category: 'Salary' },
  { id: 't-23', date: dateInput(116), description: 'Hostel accommodation', amount: 7200, type: 'Expense', category: 'Rent' },
  { id: 't-24', date: dateInput(123), description: 'Recurring investment', amount: 3500, type: 'Expense', category: 'Investment' },
];
const demoHoldings: Holding[] = [
  { id: 'h-1', symbol: 'INFY', name: 'Infosys Ltd.', shares: 6, purchasePrice: 1420, currentPrice: 1578.4 },
  { id: 'h-2', symbol: 'TCS', name: 'Tata Consultancy Services', shares: 2, purchasePrice: 3425, currentPrice: 3672.2 },
  { id: 'h-3', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', shares: 8, purchasePrice: 1460, currentPrice: 1591.8 },
  { id: 'h-4', symbol: 'ITBEES', name: 'Nippon India ETF IT', shares: 18, purchasePrice: 34.8, currentPrice: 38.1 },
];

type FinanceContextValue = {
  transactions: Transaction[];
  holdings: Holding[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addHolding: (holding: Omit<Holding, 'id'>) => void;
  updateHolding: (id: string, holding: Omit<Holding, 'id'>) => void;
  deleteHolding: (id: string) => void;
  resetDemo: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);
function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('Finance context is unavailable');
  return value;
}

function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);
  const userStorageKey = user?.id ? `:${user.id}` : '';
  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    try {
      setTransactions(JSON.parse(localStorage.getItem(`finai-transactions-v2${userStorageKey}`) || 'null') || []);
      setHoldings(JSON.parse(localStorage.getItem(`finai-holdings-v2${userStorageKey}`) || 'null') || []);
    } catch {
      setTransactions([]);
      setHoldings([]);
    }
    setLoadedForUser(user.id);
  }, [isLoaded, user?.id, userStorageKey]);
  useEffect(() => {
    if (loadedForUser !== user?.id) return;
    localStorage.setItem(`finai-transactions-v2${userStorageKey}`, JSON.stringify(transactions));
  }, [loadedForUser, transactions, user?.id, userStorageKey]);
  useEffect(() => {
    if (loadedForUser !== user?.id) return;
    localStorage.setItem(`finai-holdings-v2${userStorageKey}`, JSON.stringify(holdings));
  }, [loadedForUser, holdings, user?.id, userStorageKey]);
  const value: FinanceContextValue = {
    transactions, holdings,
    addTransaction: (transaction) => setTransactions((current) => [{ ...transaction, id: uid() }, ...current]),
    updateTransaction: (id, transaction) => setTransactions((current) => current.map((item) => item.id === id ? { ...transaction, id } : item)),
    deleteTransaction: (id) => setTransactions((current) => current.filter((item) => item.id !== id)),
    addHolding: (holding) => setHoldings((current) => [{ ...holding, id: uid() }, ...current]),
    updateHolding: (id, holding) => setHoldings((current) => current.map((item) => item.id === id ? { ...holding, id } : item)),
    deleteHolding: (id) => setHoldings((current) => current.filter((item) => item.id !== id)),
    resetDemo: () => { setTransactions(demoTransactions); setHoldings(demoHoldings); },
  };
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

const navItems = [
  { href: '/workspace', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Add Transactions', icon: FileSpreadsheet },
  { href: '/analyzer', label: 'Expense Analyzer', icon: BarChart3 },
  { href: '/ai-analysis', label: 'AI / ML Analysis', icon: BrainCircuit },
  { href: '/portfolio', label: 'Stock Portfolio', icon: BriefcaseBusiness },
  { href: '/insights', label: 'Financial Insights', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: FileBarChart2 },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const pageTitle = navItems.find((item) => item.href === location)?.label || 'Dashboard';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName = user?.firstName || email.split('@')[0] || 'FinAI user';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark">F</div><div className="brand-name">fin<span>ai</span></div></div>
        <div className="nav-label">Your command center</div>
        <nav className="nav-list">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${location === href ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-foot">
          <div className="nav-label" style={{ padding: 0 }}>Local workspace</div>
          <div className="student-chip"><div className="avatar">{initials}</div><p><strong>{displayName}</strong><span>{email || 'Personal finance workspace'}</span></p></div>
          <button className="sidebar-signout" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })}>Sign out</button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={17} /></button>
            <div><div className="topbar-kicker">FinAI / Workspace</div><div className="topbar-title">{pageTitle}</div></div>
          </div>
          <div className="topbar-actions">
            <span className="tag teal"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} /> Local data</span>
            <button className="icon-button" onClick={() => window.location.reload()} aria-label="Refresh analysis" data-testid="button-refresh-data"><RefreshCw size={15} /></button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function PageHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subhead">{description}</p></div>{action}</div>;
}

function MetricCard({ label, value, foot, tone = '' }: { label: string; value: string; foot: string; tone?: string }) {
  return <div className="card stat-card" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className={`stat-foot ${tone}`}>{foot}</div></div>;
}

function Dashboard() {
  const { transactions, holdings, resetDemo } = useFinance();
  const [toast, setToast] = useState('');
  const totalIncome = transactions.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const portfolioValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const months = useMemo(() => {
    const result: { month: string; income: number; expense: number; net: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthItems = transactions.filter((t) => t.date.startsWith(key));
      const income = monthItems.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
      const expense = monthItems.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
      result.push({ month: d.toLocaleDateString('en-IN', { month: 'short' }), income, expense, net: income - expense });
    }
    return result;
  }, [transactions]);
  const categoryData = useMemo(() => categories.map((category) => ({ name: category, value: transactions.filter((t) => t.category === category && t.type === 'Expense').reduce((s, t) => s + t.amount, 0) })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 5), [transactions]);
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  if (transactions.length === 0) return <main className="page">
    <PageHead eyebrow="Your personal finance lab" title="Welcome to FinAI" description="Understand your money with AI-powered financial analytics. Start with a single transaction, import a CSV, or load fictional demo data for a complete walkthrough." action={<Link href="/transactions" className="btn btn-primary" data-testid="link-add-transaction"><Plus size={15} /> Add transaction</Link>} />
    <section className="card welcome-card">
      <div className="welcome-orbit"><div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" /><div className="orbit-core"><BrainCircuit size={30} /></div></div>
      <div className="welcome-copy"><div className="eyebrow">A clear view of what moves</div><h2>Turn everyday money decisions into a signal you can explain.</h2><p>FinAI combines data preprocessing, visual analysis, NLP classification, and statistical anomaly detection in one local workspace. Your data stays in this browser.</p><div className="welcome-actions"><button className="btn btn-primary" onClick={() => { resetDemo(); showToast('Fictional demo data loaded'); }} data-testid="button-load-demo"><Sparkles size={14} /> Load demo data</button><Link href="/transactions" className="btn btn-quiet" data-testid="link-upload-csv"><Upload size={14} /> Upload CSV</Link></div><div className="welcome-meta"><span><ShieldCheck size={13} /> No bank credentials</span><span><Zap size={13} /> Updates instantly</span><span><BrainCircuit size={13} /> Explainable analysis</span></div></div>
    </section>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>;
  return <main className="page">
    <PageHead eyebrow={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })} · personal finance lab`} title="Good morning, Arjun." description="Your money has a signal. FinAI turns the daily noise into a clear view of what is moving, what is unusual, and what is worth your attention." action={<Link href="/transactions" className="btn btn-primary" data-testid="link-add-transaction"><Plus size={15} /> Add transaction</Link>} />
    <div className="stats-grid">
      <MetricCard label="Available balance" value={money(balance)} foot="Net across all tracked activity" tone="positive" />
      <MetricCard label="Income tracked" value={money(totalIncome)} foot={`${transactions.filter((t) => t.type === 'Income').length} deposits in the workspace`} />
      <MetricCard label="Outflow tracked" value={money(totalExpense)} foot={`Largest category: ${categoryData[0]?.name || '—'}`} />
      <MetricCard label="Portfolio value" value={money(portfolioValue)} foot={`${holdings.length} holdings · manual snapshot`} tone="positive" />
    </div>
    <div className="dashboard-grid">
      <section className="card wide">
        <div className="card-header"><div><h2>Cashflow, at a glance</h2><p>Income against expense across the last six months</p></div><span className="period-chip">6 month view</span></div>
        <div className="card-body"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={months} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f8c79" stopOpacity={.24} /><stop offset="100%" stopColor="#2f8c79" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9785f" stopOpacity={.18} /><stop offset="100%" stopColor="#e9785f" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7e1d6" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} /><Tooltip contentStyle={{ background: '#24343e', border: 0, borderRadius: 8, color: '#fbf7ed', fontSize: 11 }} formatter={(value: number) => [money(value), '']} /><Area type="monotone" dataKey="income" name="Income" stroke="#2f8c79" strokeWidth={2.5} fill="url(#incomeFill)" /><Area type="monotone" dataKey="expense" name="Expense" stroke="#e9785f" strokeWidth={2.2} fill="url(#expenseFill)" /></AreaChart></ResponsiveContainer></div></div>
      </section>
      <section className="card insight-card"><div className="card-body"><div className="eyebrow"><Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> FinAI read</div><div className="insight-copy">{totalIncome > totalExpense ? 'You are building a healthy buffer this cycle.' : 'Your outflow is asking for a closer look this cycle.'}</div><div className="accent-line" /><p style={{ color: 'hsl(211 12% 74%)', fontSize: 11, lineHeight: 1.5, margin: '14px 0 0' }}>{categoryData[0] ? `${categoryData[0].name} leads spending at ${money(categoryData[0].value)}. Open the insights view for the full story.` : 'Add a few transactions and the pattern engine will start working.'}</p></div></section>
      <section className="card"><div className="card-header"><div><h2>Spending shape</h2><p>Where your money is going</p></div><Link href="/analyzer" className="tag teal" data-testid="link-view-analyzer">Explore</Link></div><div className="card-body"><div style={{ height: 135 }}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={categoryData} dataKey="value" innerRadius={39} outerRadius={59} paddingAngle={3} stroke="none">{categoryData.map((_, index) => <Cell key={index} fill={['#2f8c79', '#e9785f', '#d4a843', '#718b9a', '#a6b5a4'][index % 5]} />)}</Pie><Tooltip formatter={(value: number) => money(value)} contentStyle={{ background: '#24343e', border: 0, borderRadius: 8, color: '#fbf7ed', fontSize: 10 }} /></RePieChart></ResponsiveContainer></div><div className="donut-legend">{categoryData.slice(0, 3).map((item, index) => <div className="legend-line" key={item.name}><span className={`category-dot ${index === 1 ? 'coral' : index === 2 ? 'gold' : ''}`} /><span style={{ width: 77 }}>{item.name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(10, item.value / (categoryData[0]?.value || 1) * 100)}%`, background: ['#2f8c79', '#e9785f', '#d4a843'][index] }} /></div></div>)}</div></div></section>
    </div>
    <section className="card" style={{ marginTop: 15 }}><div className="card-header"><div><h2>Latest movement</h2><p>The most recent entries in your ledger</p></div><Link href="/transactions" className="tag teal" data-testid="link-view-transactions">View all</Link></div><div className="card-body" style={{ paddingTop: 13 }}><TransactionTable transactions={latest} compact /></div></section>
    {transactions.length === 0 && <section className="card empty" style={{ marginTop: 15 }}><div className="empty-icon"><Wallet size={19} /></div><h2>Your command center is ready.</h2><p>Start with a manual entry or reload the considered demo dataset for tomorrow's presentation.</p><button className="btn btn-primary" onClick={() => { resetDemo(); showToast('Demo dataset restored'); }} data-testid="button-restore-demo"><RefreshCw size={14} /> Restore demo data</button></section>}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>;
}

function TransactionTable({ transactions, onEdit, onDelete, compact = false }: { transactions: Transaction[]; onEdit?: (transaction: Transaction) => void; onDelete?: (id: string) => void; compact?: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th>{!compact && <th />}</tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} data-testid={`row-transaction-${transaction.id}`}><td className="mono" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10 }}>{shortDate(transaction.date)}</td><td><strong>{transaction.description}</strong></td><td><span className="tag">{transaction.category}</span></td><td><span className={`tag ${transaction.type === 'Income' ? 'teal' : 'coral'}`}>{transaction.type}</span></td><td className={`amount ${transaction.type.toLowerCase()}`} style={{ textAlign: 'right' }}>{transaction.type === 'Income' ? '+' : '-'}{money2(transaction.amount)}</td>{!compact && <td><div className="actions"><button className="action-icon" onClick={() => onEdit?.(transaction)} aria-label={`Edit ${transaction.description}`} data-testid={`button-edit-${transaction.id}`}><Pencil size={14} /></button><button className="action-icon delete" onClick={() => onDelete?.(transaction.id)} aria-label={`Delete ${transaction.description}`} data-testid={`button-delete-${transaction.id}`}><Trash2 size={14} /></button></div></td>}</tr>)}</tbody></table>{transactions.length === 0 && <div className="empty"><div className="empty-icon"><FolderOpen size={18} /></div><h3>No transactions match.</h3><p>Try widening your filters or add a new entry to the ledger.</p></div>}</div>;
}

type TransactionDraft = Omit<Transaction, 'id'>;
const blankTransaction: TransactionDraft = { date: dateInput(), description: '', amount: 0, type: 'Expense', category: 'Other' };

function TransactionModal({ initial, onClose, onSave }: { initial?: Transaction; onClose: () => void; onSave: (draft: TransactionDraft) => void }) {
  const [form, setForm] = useState<TransactionDraft>(initial ? { date: initial.date, description: initial.description, amount: initial.amount, type: initial.type, category: initial.category } : blankTransaction);
  const set = (key: keyof TransactionDraft, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><div><div className="eyebrow">{initial ? 'Edit ledger entry' : 'New ledger entry'}</div><h2>{initial ? 'Tune the details' : 'Add a transaction'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close form" data-testid="button-close-transaction-form"><X size={16} /></button></div><div className="modal-body"><div className="form-grid"><div className="field"><label htmlFor="transaction-date">Date</label><input id="transaction-date" className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} data-testid="input-transaction-date" /></div><div className="field"><label htmlFor="transaction-type">Type</label><select id="transaction-type" className="select" value={form.type} onChange={(e) => set('type', e.target.value as TransactionType)} data-testid="select-transaction-type"><option>Expense</option><option>Income</option></select></div><div className="field full"><label htmlFor="transaction-description">Description</label><input id="transaction-description" className="input" placeholder="e.g. library book, stipend, metro pass" value={form.description} onChange={(e) => set('description', e.target.value)} data-testid="input-transaction-description" /></div><div className="field"><label htmlFor="transaction-amount">Amount</label><input id="transaction-amount" className="input" type="number" min="0" step="0.01" value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} data-testid="input-transaction-amount" /></div><div className="field"><label htmlFor="transaction-category">Category</label><select id="transaction-category" className="select" value={form.category} onChange={(e) => set('category', e.target.value as Category)} data-testid="select-transaction-category">{categories.map((category) => <option key={category}>{category}</option>)}</select></div></div><div className="modal-actions"><button className="btn btn-quiet" onClick={onClose} data-testid="button-cancel-transaction">Cancel</button><button className="btn btn-primary" disabled={!form.description.trim() || form.amount <= 0 || !form.date} onClick={() => onSave({ ...form, description: form.description.trim() })} data-testid="button-save-transaction"><Check size={14} /> {initial ? 'Save changes' : 'Add to ledger'}</button></div></div></div></div>;
}

type CsvRow = TransactionDraft & { valid: boolean; reason?: string };
function AddTransactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [modal, setModal] = useState<Transaction | 'new' | null>(null);
  const [toast, setToast] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const sorted = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)), [transactions]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2700); };
  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { notify('CSV needs a header and at least one row'); return; }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idx = (name: string) => headers.indexOf(name);
      const rows = lines.slice(1).map((line): CsvRow => {
        const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
        const date = values[idx('date')] || '';
        const description = values[idx('description')] || '';
        const amount = Number(values[idx('amount')]);
        const rawType = values[idx('type')] || 'Expense';
        const type: TransactionType = rawType.toLowerCase() === 'income' ? 'Income' : 'Expense';
         const rawCategory = values[idx('category')] as Category;
         const inferred = inferCategory(description);
         const category = categories.includes(rawCategory) ? rawCategory : inferred.category;
        const reason = !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ? 'Use YYYY-MM-DD date' : !description ? 'Description is required' : !amount || amount <= 0 ? 'Amount must be positive' : undefined;
        return { date, description, amount, type, category, valid: !reason, reason };
      });
      setCsvRows(rows); notify(`${rows.length} rows parsed — review before importing`);
    };
    reader.readAsText(file);
  };
  const importCsv = () => { csvRows.filter((row) => row.valid).forEach(({ valid: _valid, reason: _reason, ...row }) => addTransaction(row)); setCsvRows([]); notify('Valid rows added to your ledger'); };
  return <main className="page"><PageHead eyebrow="Ledger / manual or batch" title="Bring in the real picture." description="Capture the small daily decisions and the large one-offs. FinAI makes both legible without sending your data anywhere." action={<button className="btn btn-primary" onClick={() => setModal('new')} data-testid="button-new-transaction"><Plus size={15} /> New transaction</button>} />
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: 15, marginBottom: 15 }}>
      <section className="card"><div className="card-header"><div><h2>Import a CSV</h2><p>Expected columns: date, description, amount, type, category</p></div><FileSpreadsheet size={19} color="hsl(var(--primary))" /></div><div className="card-body"><label className="dropzone" htmlFor="csv-upload"><Upload size={22} /><strong>Drop your transaction file here</strong><p>We validate each row in your browser before import.</p><span className="btn btn-quiet btn-small"><FolderOpen size={13} /> Choose CSV</span><input id="csv-upload" ref={inputRef} type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0])} data-testid="input-csv-upload" /></label></div></section>
      <section className="card card-pad"><div className="eyebrow">Quick read</div><div className="kpi-row" style={{ marginTop: 14 }}><div className="kpi-big">{transactions.length}</div><span className="tag teal">ledger rows</span></div><p className="subhead" style={{ fontSize: 11, marginTop: 10 }}>Your local workspace is persisted automatically. Nothing leaves this browser.</p><button className="btn btn-quiet btn-small" onClick={() => { inputRef.current?.click(); }} data-testid="button-browse-csv"><Upload size={13} /> Browse files</button></section>
    </div>
    {csvRows.length > 0 && <section className="card" style={{ marginBottom: 15 }}><div className="card-header"><div><h2>Import preview</h2><p>{csvRows.filter((r) => r.valid).length} valid of {csvRows.length} rows</p></div><div style={{ display: 'flex', gap: 8 }}><button className="btn btn-quiet btn-small" onClick={() => setCsvRows([])} data-testid="button-cancel-csv">Discard</button><button className="btn btn-primary btn-small" disabled={!csvRows.some((row) => row.valid)} onClick={importCsv} data-testid="button-import-csv"><Check size={13} /> Import valid rows</button></div></div><div className="card-body"><div className="table-wrap"><table><thead><tr><th>Status</th><th>Date</th><th>Description</th><th>Amount</th><th>Category</th><th>Validation</th></tr></thead><tbody>{csvRows.map((row, index) => <tr key={index}><td>{row.valid ? <span className="tag teal">Ready</span> : <span className="tag coral">Review</span>}</td><td className="mono">{row.date}</td><td>{row.description || '—'}</td><td className="amount">{money2(row.amount)}</td><td><span className="tag">{row.category}</span></td><td style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10 }}>{row.reason || 'Category confidence: inferred'}</td></tr>)}</tbody></table></div></div></section>}
    <section className="card"><div className="card-header"><div><h2>Ledger</h2><p>{transactions.length} entries, newest first</p></div><span className="tag">{transactions.filter((t) => t.type === 'Expense').length} outflows</span></div><div className="card-body" style={{ paddingTop: 13 }}><TransactionTable transactions={sorted} onEdit={setModal} onDelete={(id) => { if (window.confirm('Delete this transaction?')) { deleteTransaction(id); notify('Transaction removed'); } }} /></div></section>
    {modal && <TransactionModal initial={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} onSave={(draft) => { modal === 'new' ? addTransaction(draft) : updateTransaction(modal.id, draft); setModal(null); notify(modal === 'new' ? 'Transaction added' : 'Changes saved'); }} />}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>;
}

function ExpenseAnalyzer() {
  const { transactions } = useFinance();
  const expenses = transactions.filter((t) => t.type === 'Expense');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [range, setRange] = useState('All time');
  const filtered = useMemo(() => expenses.filter((transaction) => {
    const matchesQuery = transaction.description.toLowerCase().includes(query.toLowerCase()) || transaction.category.toLowerCase().includes(query.toLowerCase());
    const days = range === '30 days' ? 30 : range === '90 days' ? 90 : Infinity;
    const matchesRange = (Date.now() - new Date(`${transaction.date}T00:00:00`).getTime()) / 86400000 <= days;
    return matchesQuery && (category === 'All' || transaction.category === category) && matchesRange;
  }), [expenses, query, category, range]);
  const byCategory = useMemo(() => categories.map((name) => ({ name, amount: filtered.filter((t) => t.category === name).reduce((s, t) => s + t.amount, 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount), [filtered]);
  const daily = useMemo(() => { const map = new Map<string, number>(); filtered.forEach((t) => map.set(t.date, (map.get(t.date) || 0) + t.amount)); return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: shortDate(date), amount })); }, [filtered]);
  const maxCategory = byCategory[0]?.amount || 1;
  return <main className="page"><PageHead eyebrow="Analyzer / patterns in the ledger" title="Make spending make sense." description="Slice the same live dataset by time, category, and search. Every visual below updates as your local ledger changes." action={<button className="btn btn-quiet" onClick={() => { setQuery(''); setCategory('All'); setRange('All time'); }} data-testid="button-reset-filters"><RefreshCw size={14} /> Reset filters</button>} />
    <section className="card card-pad" style={{ marginBottom: 15 }}><div className="filters"><div className="search-wrap"><Search size={14} /><input className="input" placeholder="Search descriptions or categories" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="input-search-expenses" /></div><select className="select" value={category} onChange={(e) => setCategory(e.target.value)} data-testid="select-filter-category"><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select className="select" value={range} onChange={(e) => setRange(e.target.value)} data-testid="select-filter-range"><option>All time</option><option>30 days</option><option>90 days</option></select><span className="tag">{filtered.length} matching</span></div></section>
    <div className="stats-grid"><MetricCard label="Filtered spend" value={money(filtered.reduce((s, t) => s + t.amount, 0))} foot={`${range.toLowerCase()} · ${category}`} /><MetricCard label="Average expense" value={money(filtered.length ? filtered.reduce((s, t) => s + t.amount, 0) / filtered.length : 0)} foot="Per matching transaction" /><MetricCard label="Largest category" value={byCategory[0]?.name || '—'} foot={byCategory[0] ? money(byCategory[0].amount) : 'No matches'} tone="positive" /><MetricCard label="Largest single outflow" value={money(Math.max(0, ...filtered.map((t) => t.amount)))} foot={filtered.length ? 'Review this item in the ledger' : 'No matches'} tone="warn" /></div>
    <div className="dashboard-grid"><section className="card wide"><div className="card-header"><div><h2>Spending pulse</h2><p>Daily outflow in the current filter</p></div><Activity size={17} color="hsl(var(--primary))" /></div><div className="card-body"><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e7e1d6" /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} /><Tooltip contentStyle={{ background: '#24343e', border: 0, borderRadius: 8, color: '#fbf7ed', fontSize: 11 }} formatter={(value: number) => [money(value), 'Spend']} /><Bar dataKey="amount" fill="#2f8c79" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div></section><section className="card"><div className="card-header"><div><h2>Category weight</h2><p>Relative share of selected spend</p></div><PieChart size={17} color="hsl(var(--primary))" /></div><div className="card-body"><div className="list">{byCategory.slice(0, 7).map((item, index) => <div key={item.name}><div className="list-row" style={{ marginBottom: 6 }}><div className="row-meta"><span className={`category-dot ${index === 1 ? 'coral' : index === 2 ? 'gold' : ''}`} /><span className="row-name">{item.name}</span></div><span className="row-value">{money(item.amount)}</span></div><div className="bar-track"><div className="bar-fill" style={{ width: `${item.amount / maxCategory * 100}%`, background: index === 1 ? 'hsl(var(--accent))' : index === 2 ? 'hsl(39 73% 54%)' : undefined }} /></div></div>)}{byCategory.length === 0 && <p className="subhead">No category data in this filter.</p>}</div></div></section></div>
    <section className="card" style={{ marginTop: 15 }}><div className="card-header"><div><h2>Searchable expense detail</h2><p>Showing {filtered.length} of {expenses.length} expense rows</p></div><Filter size={17} color="hsl(var(--muted-foreground))" /></div><div className="card-body" style={{ paddingTop: 13 }}><TransactionTable transactions={filtered} compact /></div></section>
  </main>;
}

function AIAnalysis() {
  const { transactions } = useFinance();
  const expenses = transactions.filter((t) => t.type === 'Expense');
  const [sampleDescription, setSampleDescription] = useState('Swiggy dinner');
  const mean = expenses.length ? expenses.reduce((s, t) => s + t.amount, 0) / expenses.length : 0;
  const anomalies = expenses.filter((t) => t.amount > mean * 2.5).sort((a, b) => b.amount - a.amount);
  const confidence = Math.min(97, 72 + Math.round(Math.min(20, transactions.length / 2)));
  const prediction = inferCategory(sampleDescription);
  const classification = useMemo(() => categories.map((category) => ({ category, count: transactions.filter((t) => t.category === category).length })).filter((x) => x.count).sort((a, b) => b.count - a.count), [transactions]);
  return <main className="page"><PageHead eyebrow="Intelligence / local inference" title="Let the pattern surface." description="This is an explainable front-end model: transparent heuristics over your own ledger, designed to show how a finance intelligence layer can feel useful." action={<span className="tag teal"><ShieldCheck size={12} /> Browser-only analysis</span>} />
    <div className="ai-grid"><section className="card feature-card"><div className="feature-icon"><BrainCircuit size={18} /></div><h2>Smart classification</h2><p>Categories are attached to every row, with a confidence signal derived from description keywords and your existing category mix.</p><div className="confidence"><div className="bar-track"><div className="bar-fill" style={{ width: `${confidence}%` }} /></div><span>{confidence}% confidence</span></div></section><section className="card feature-card"><div className="feature-icon" style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / .1)' }}><AlertTriangle size={18} /></div><h2>Anomaly detection</h2><p>{anomalies.length ? `${anomalies.length} large outflow${anomalies.length > 1 ? 's' : ''} stand apart from your typical expense of ${money(mean)}.` : 'No unusual outflows detected. Keep logging to make the baseline more intelligent.'}</p><div className="confidence"><div className="bar-track"><div className="bar-fill" style={{ width: anomalies.length ? '88%' : '42%', background: 'hsl(var(--accent))' }} /></div><span>{anomalies.length ? 'Review suggested' : 'Stable baseline'}</span></div></section></div>
    <div className="dashboard-grid" style={{ marginTop: 15 }}><section className="card wide"><div className="card-header"><div><h2>Detected outliers</h2><p>Transactions more than 2.5× the average expense</p></div><span className="tag coral">{anomalies.length} flagged</span></div><div className="card-body" style={{ paddingTop: 13 }}><TransactionTable transactions={anomalies} compact /></div></section><section className="card"><div className="card-header"><div><h2>Learned mix</h2><p>Category signals in this dataset</p></div><Zap size={17} color="hsl(var(--primary))" /></div><div className="card-body"><div className="list">{classification.slice(0, 7).map((item, index) => <div className="list-row" key={item.category}><div className="row-meta"><span className={`category-dot ${index === 1 ? 'coral' : index === 2 ? 'gold' : ''}`} /><span className="row-name">{item.category}</span></div><span className="tag">{item.count} rows</span></div>)}</div></div></section></div>
     <section className="card card-pad classification-card" style={{ marginTop: 15 }}><div><div className="eyebrow">Try the classifier</div><h2 style={{ marginTop: 8 }}>What would FinAI call this?</h2><p className="subhead">The live browser demo uses a transparent keyword model. The academic companion in <span className="mono">ml/finai_ml.py</span> uses TF-IDF + Logistic Regression on the same kind of labeled examples.</p></div><div className="classification-form"><input className="input" value={sampleDescription} onChange={(event) => setSampleDescription(event.target.value)} aria-label="Transaction description to classify" data-testid="input-classification-description" /><div className="classification-result"><span className="tag teal">Predicted category</span><strong>{prediction.category}</strong><span className="mono">{prediction.confidence}% confidence</span></div></div><div className="model-steps"><div><span className="tag teal">01 · TF-IDF</span><p>Convert description words into weighted language features.</p></div><div><span className="tag teal">02 · Logistic Regression</span><p>Estimate the most likely category from labeled examples.</p></div><div><span className="tag coral">03 · Isolation Forest</span><p>Separate unusual amount patterns from the normal baseline.</p></div></div></section>
  </main>;
}

type HoldingDraft = Omit<Holding, 'id'>;
function Portfolio() {
  const { holdings, addHolding, updateHolding, deleteHolding } = useFinance();
  const [editing, setEditing] = useState<Holding | 'new' | null>(null);
  const [draft, setDraft] = useState<HoldingDraft>({ symbol: '', name: '', shares: 1, purchasePrice: 0, currentPrice: 0 });
  const totalInvested = holdings.reduce((s, h) => s + h.shares * h.purchasePrice, 0);
  const currentValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
  const pnl = currentValue - totalInvested;
  const open = (holding?: Holding) => { setEditing(holding || 'new'); setDraft(holding ? { symbol: holding.symbol, name: holding.name, shares: holding.shares, purchasePrice: holding.purchasePrice, currentPrice: holding.currentPrice } : { symbol: '', name: '', shares: 1, purchasePrice: 0, currentPrice: 0 }); };
  const set = (key: keyof HoldingDraft, value: string | number) => setDraft((current) => ({ ...current, [key]: value }));
  return <main className="page"><PageHead eyebrow="Portfolio / manual market snapshot" title="See your ownership clearly." description="Keep a simple, honest record of what you hold. Prices are intentionally manual in this demo, so the calculations stay transparent and offline." action={<button className="btn btn-primary" onClick={() => open()} data-testid="button-new-holding"><Plus size={15} /> Add holding</button>} />
    <div className="stats-grid"><MetricCard label="Current value" value={money(currentValue)} foot={`${holdings.length} holdings tracked`} tone="positive" /><MetricCard label="Cost basis" value={money(totalInvested)} foot="Total purchase value" /><MetricCard label="Unrealized P&L" value={`${pnl >= 0 ? '+' : '-'}${money(pnl)}`} foot={totalInvested ? `${pnl / totalInvested * 100 >= 0 ? '+' : ''}${(pnl / totalInvested * 100).toFixed(1)}% since purchase` : 'Add a holding'} tone={pnl >= 0 ? 'positive' : 'warn'} /><MetricCard label="Largest position" value={holdings[0]?.symbol || '—'} foot={holdings[0] ? money(holdings[0].shares * holdings[0].currentPrice) : 'No holdings'} /></div>
    <div className="allocation-layout"><section className="card"><div className="card-header"><div><h2>Allocation</h2><p>Current value by holding</p></div><PieChart size={17} color="hsl(var(--primary))" /></div><div className="card-body"><div style={{ height: 190 }}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={holdings.map((h) => ({ name: h.symbol, value: h.shares * h.currentPrice }))} dataKey="value" innerRadius={52} outerRadius={75} paddingAngle={3} stroke="none">{holdings.map((h, i) => <Cell key={h.id} fill={['#2f8c79', '#e9785f', '#d4a843', '#718b9a'][i % 4]} />)}</Pie><Tooltip formatter={(value: number) => money(value)} contentStyle={{ background: '#24343e', border: 0, borderRadius: 8, color: '#fbf7ed', fontSize: 10 }} /></RePieChart></ResponsiveContainer></div><div className="list">{holdings.map((h, i) => <div className="list-row" key={h.id}><div className="row-meta"><span className="category-dot" style={{ background: ['#2f8c79', '#e9785f', '#d4a843', '#718b9a'][i % 4] }} /><span className="row-name">{h.symbol}</span></div><span className="row-value">{money(h.shares * h.currentPrice)}</span></div>)}</div>{holdings.length === 0 && <div className="empty"><div className="empty-icon"><BriefcaseBusiness size={18} /></div><p>Add your first holding to see allocation.</p></div>}</div></section><section className="card"><div className="card-header"><div><h2>Holdings</h2><p>Manual entry · no live market feed</p></div><span className="tag teal"><Landmark size={11} /> Offline</span></div><div className="card-body" style={{ paddingTop: 13 }}><div className="table-wrap"><table><thead><tr><th>Asset</th><th>Shares</th><th>Value</th><th>P&amp;L</th><th /></tr></thead><tbody>{holdings.map((h) => { const value = h.shares * h.currentPrice; const gain = value - h.shares * h.purchasePrice; return <tr key={h.id} data-testid={`row-holding-${h.id}`}><td><strong>{h.symbol}</strong><div className="row-caption">{h.name}</div></td><td className="mono">{h.shares}</td><td className="holding-value">{money(value)}</td><td className={gain >= 0 ? 'pnl-positive amount' : 'pnl-negative amount'}>{gain >= 0 ? '+' : '-'}{money(gain)}</td><td><div className="actions"><button className="action-icon" onClick={() => open(h)} aria-label={`Edit ${h.symbol}`} data-testid={`button-edit-holding-${h.id}`}><Pencil size={14} /></button><button className="action-icon delete" onClick={() => { if (window.confirm(`Delete ${h.symbol} holding?`)) deleteHolding(h.id); }} aria-label={`Delete ${h.symbol}`} data-testid={`button-delete-holding-${h.id}`}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div></div></section></div>
    {editing && <div className="modal-backdrop" role="dialog"><div className="modal"><div className="modal-head"><div><div className="eyebrow">Portfolio position</div><h2>{editing === 'new' ? 'Add a holding' : 'Edit a holding'}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close holding form" data-testid="button-close-holding-form"><X size={16} /></button></div><div className="modal-body"><div className="form-grid"><div className="field"><label>Symbol</label><input className="input" placeholder="INFY" value={draft.symbol} onChange={(e) => set('symbol', e.target.value.toUpperCase())} data-testid="input-holding-symbol" /></div><div className="field"><label>Company name</label><input className="input" placeholder="Infosys Ltd." value={draft.name} onChange={(e) => set('name', e.target.value)} data-testid="input-holding-name" /></div><div className="field"><label>Shares</label><input className="input" type="number" min="0.01" step="0.01" value={draft.shares || ''} onChange={(e) => set('shares', Number(e.target.value))} data-testid="input-holding-shares" /></div><div className="field"><label>Purchase price</label><input className="input" type="number" min="0" step="0.01" value={draft.purchasePrice || ''} onChange={(e) => set('purchasePrice', Number(e.target.value))} data-testid="input-holding-purchase-price" /></div><div className="field full"><label>Current price snapshot</label><input className="input" type="number" min="0" step="0.01" value={draft.currentPrice || ''} onChange={(e) => set('currentPrice', Number(e.target.value))} data-testid="input-holding-current-price" /></div></div><div className="modal-actions"><button className="btn btn-quiet" onClick={() => setEditing(null)} data-testid="button-cancel-holding">Cancel</button><button className="btn btn-primary" disabled={!draft.symbol || !draft.name || draft.shares <= 0 || draft.currentPrice <= 0} onClick={() => { editing === 'new' ? addHolding(draft) : updateHolding(editing.id, draft); setEditing(null); }} data-testid="button-save-holding"><Check size={14} /> Save position</button></div></div></div></div>}
  </main>;
}

function Insights() {
  const { transactions, holdings } = useFinance();
  const expenses = transactions.filter((t) => t.type === 'Expense');
  const income = transactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const spend = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = categories.map((category) => ({ category, value: expenses.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0) })).filter((x) => x.value).sort((a, b) => b.value - a.value);
  const recurringRent = expenses.filter((t) => t.category === 'Rent').reduce((s, t) => s + t.amount, 0);
  const unusual = expenses.filter((t) => t.amount > (expenses.length ? spend / expenses.length * 2.5 : Infinity)).sort((a, b) => b.amount - a.amount)[0];
  const savingsRate = income ? (income - spend) / income * 100 : 0;
  const narratives = [
    { icon: TrendingUp, tone: 'teal', eyebrow: 'Buffer', title: savingsRate > 25 ? 'Your buffer is doing real work.' : 'Your buffer has room to grow.', copy: income ? `Across ${transactions.length} entries, you retained ${savingsRate.toFixed(1)}% of tracked income. ${savingsRate > 25 ? 'That is a strong base for a student building optionality.' : 'A small category cap could make the next cycle feel lighter.'}` : 'Add income and expense entries to unlock a savings-rate narrative.' },
    { icon: CalendarDays, tone: 'gold', eyebrow: 'Recurring', title: 'The predictable bits are visible.', copy: recurringRent ? `${money(recurringRent)} is tagged as rent across the current dataset. That recurring commitment is your clearest planning anchor.` : 'No recurring rent pattern is visible yet. Tag regular costs consistently to reveal your baseline.' },
    { icon: AlertTriangle, tone: 'coral', eyebrow: 'Watchlist', title: unusual ? `${unusual.description} deserves context.` : 'No outlier needs your attention.', copy: unusual ? `At ${money(unusual.amount)}, this is larger than your typical outflow. Add a note in its description or keep it as a deliberate one-off.` : 'FinAI has not found a purchase far outside your normal expense range.' },
  ];
  return <main className="page"><PageHead eyebrow="Insights / narrative layer" title="A calmer view of your money." description="Not another dashboard. These are the few observations worth carrying into your next week, derived from the entries you have chosen to track." action={<Link href="/reports" className="btn btn-quiet" data-testid="link-open-reports"><FileBarChart2 size={14} /> Build a report</Link>} />
    <section className="card" style={{ marginBottom: 15 }}><div className="card-body"><div className="eyebrow">The current read</div><h2 style={{ fontSize: 25, marginTop: 9, maxWidth: 720 }}>{savingsRate >= 0 ? 'You have more control than the raw numbers suggest.' : 'The signal is asking for a reset, not a reaction.'}</h2><p className="subhead">{savingsRate >= 0 ? `A ${savingsRate.toFixed(1)}% retained-income rate and ${holdings.length} manual portfolio positions show a student building a financial system, not just recording transactions.` : 'Your tracked outflow is ahead of tracked income. Use the analyzer to locate the pressure point, then decide what deserves to change.'}</p></div></section>
    <div className="ai-grid">{narratives.map(({ icon: Icon, tone, eyebrow, title, copy }) => <section className="card feature-card" key={eyebrow}><div className="feature-icon" style={{ color: tone === 'coral' ? 'hsl(var(--accent))' : tone === 'gold' ? 'hsl(39 73% 45%)' : undefined, background: tone === 'coral' ? 'hsl(var(--accent) / .1)' : tone === 'gold' ? 'hsl(39 73% 54% / .12)' : undefined }}><Icon size={18} /></div><div className="eyebrow">{eyebrow}</div><h2 style={{ marginTop: 6 }}>{title}</h2><p>{copy}</p></section>)}</div>
    <section className="card" style={{ marginTop: 15 }}><div className="card-header"><div><h2>Category signal</h2><p>What proportion of expense is being claimed by each category</p></div><span className="tag">{money(spend)} total spend</span></div><div className="card-body">{byCategory.slice(0, 6).map((item) => <div key={item.category} style={{ marginBottom: 16 }}><div className="list-row" style={{ marginBottom: 7 }}><span className="row-name">{item.category}</span><span className="row-value">{money(item.value)} · {spend ? (item.value / spend * 100).toFixed(1) : '0.0'}%</span></div><div className="bar-track"><div className="bar-fill" style={{ width: `${spend ? item.value / spend * 100 : 0}%` }} /></div></div>)}</div></section>
  </main>;
}

function Reports() {
  const { transactions, holdings } = useFinance();
  const [toast, setToast] = useState('');
  const income = transactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const portfolio = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const download = (content: string, filename: string, type: string) => { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); };
  const downloadCsv = () => { const csv = ['date,description,amount,type,category', ...transactions.map((t) => [t.date, `"${t.description.replaceAll('"', '""')}"`, t.amount, t.type, t.category].join(','))].join('\n'); download(csv, 'finai-transactions.csv', 'text/csv'); notify('Transaction CSV downloaded'); };
  const print = () => { window.print(); };
  return <main className="page"><PageHead eyebrow="Reports / take it with you" title="Make the work presentable." description="Download the raw ledger, or open a concise printable report that turns your demo data into a story you can explain." action={<button className="btn btn-primary" onClick={print} data-testid="button-print-report"><Download size={14} /> Print report</button>} />
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 290px', gap: 15 }}><section className="card"><div className="report-cover"><div className="eyebrow" style={{ color: 'hsl(163 56% 68%)' }}>FinAI · personal finance lab</div><h2>Money, made legible.</h2><p>Prepared locally from {transactions.length} transaction entries and {holdings.length} portfolio positions.</p></div><div className="report-body"><div className="report-sections"><div className="report-section"><h3>Executive summary</h3><p>Tracked income totals {money(income)} against {money(expense)} of outflow, leaving a net balance of {money(income - expense)}. Portfolio value is currently {money(portfolio)} based on manually entered prices.</p></div><div className="report-section"><h3>Analysis note</h3><p>{expense ? `The strongest expense signal is ${categories.map((category) => ({ category, amount: transactions.filter((t) => t.category === category && t.type === 'Expense').reduce((s, t) => s + t.amount, 0) })).sort((a, b) => b.amount - a.amount)[0]?.category || 'your core costs'}. The report is a snapshot of local data, not investment advice.` : 'Add transactions to populate the analysis note.'}</p></div><div className="report-section"><h3>Method</h3><p>All totals, category summaries, anomaly flags, and charts are derived in the browser from the FinAI localStorage dataset. No account, feed, or network request is required.</p></div></div></div></section><aside className="grid" style={{ gap: 15, alignContent: 'start' }}><section className="card card-pad"><div className="feature-icon"><Download size={17} /></div><h2 style={{ fontSize: 17 }}>Raw transaction data</h2><p className="subhead" style={{ fontSize: 11 }}>Keep a portable copy of every row exactly as FinAI sees it.</p><button className="btn btn-primary btn-small" onClick={downloadCsv} data-testid="button-download-csv"><FileSpreadsheet size={13} /> Download CSV</button></section><section className="card card-pad"><div className="feature-icon" style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / .1)' }}><PrinterIcon /></div><h2 style={{ fontSize: 17 }}>Presentation view</h2><p className="subhead" style={{ fontSize: 11 }}>The printable layout keeps the summary, methodology, and totals together.</p><button className="btn btn-quiet btn-small" onClick={print} data-testid="button-print-report-secondary"><FileBarChart2 size={13} /> Open print dialog</button></section></aside></div>
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </main>;
}

function PrinterIcon() { return <FileBarChart2 size={17} />; }

function NotFound() { return <main className="page"><section className="card empty"><div className="empty-icon"><Gauge size={19} /></div><h2>That view is not on the map.</h2><p>Use the FinAI navigation to return to your command center.</p><Link className="btn btn-primary" href="/workspace" data-testid="link-return-dashboard"><LayoutDashboard size={14} /> Return to dashboard</Link></section></main>; }

function PublicLanding() {
  return <main className="auth-landing">
    <div className="auth-landing-nav">
      <Link href="/" className="brand auth-brand"><div className="brand-mark">F</div><div className="brand-name">fin<span>ai</span></div></Link>
      <div className="auth-landing-actions"><Link href="/sign-in" className="auth-text-link">Sign in</Link><Link href="/sign-up" className="btn btn-primary">Create account</Link></div>
    </div>
    <section className="auth-hero">
      <div className="auth-hero-copy">
        <div className="eyebrow">A private view of your money</div>
        <h1>Make your finances easier to understand.</h1>
        <p>FinAI turns your transaction history into clear patterns, explainable signals, and practical next steps. Create a workspace to keep your analysis in one place.</p>
        <div className="auth-hero-actions"><Link href="/sign-up" className="btn btn-primary">Start your workspace <ArrowUpRight size={15} /></Link><Link href="/sign-in" className="auth-text-link">Already have an account <ArrowUpRight size={14} /></Link></div>
        <div className="auth-hero-note"><ShieldCheck size={14} /><span>Local-first analysis · no bank credentials required</span></div>
      </div>
      <div className="auth-hero-panel">
        <div className="auth-panel-kicker">Your financial signal</div>
        <div className="auth-panel-number">₹28,500</div>
        <div className="auth-panel-caption">monthly income tracked</div>
        <div className="auth-panel-rule" />
        <div className="auth-panel-row"><span>Largest signal</span><strong>Rent · 31%</strong></div>
        <div className="auth-panel-row"><span>Buffer this month</span><strong className="auth-positive">+₹12,840</strong></div>
        <div className="auth-panel-bars"><span style={{ height: '45%' }} /><span style={{ height: '62%' }} /><span style={{ height: '54%' }} /><span style={{ height: '78%' }} /><span style={{ height: '69%' }} /><span style={{ height: '91%' }} /></div>
        <div className="auth-panel-footer"><span>Six month view</span><span>Updated locally</span></div>
      </div>
    </section>
  </main>;
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignIn = mode === 'sign-in';
  return <main className="auth-page">
    <div className="auth-page-header"><Link href="/" className="brand auth-brand"><div className="brand-mark">F</div><div className="brand-name">fin<span>ai</span></div></Link><Link href="/" className="auth-back-link">Back to FinAI</Link></div>
    <div className="auth-card-wrap">
      <div className="auth-card-intro"><div className="eyebrow">{isSignIn ? 'Welcome back' : 'Begin with FinAI'}</div><h1>{isSignIn ? 'Sign in to your workspace.' : 'Create your workspace.'}</h1><p>{isSignIn ? 'Continue where you left off with your financial analysis.' : 'A private, local-first space for making your money easier to read.'}</p></div>
      {isSignIn ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/workspace`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/workspace`} />}
    </div>
  </main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function WorkspaceRouter() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-loading"><div className="brand auth-brand"><div className="brand-mark">F</div><div className="brand-name">fin<span>ai</span></div></div><p>Preparing your workspace…</p></div>;
  if (!isSignedIn) return <Redirect to="/" />;
  return <FinanceProvider><RoutedErrorBoundary><Shell><Switch><Route path="/workspace" component={Dashboard} /><Route path="/transactions" component={AddTransactions} /><Route path="/analyzer" component={ExpenseAnalyzer} /><Route path="/ai-analysis" component={AIAnalysis} /><Route path="/portfolio" component={Portfolio} /><Route path="/insights" component={Insights} /><Route path="/reports" component={Reports} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary></FinanceProvider>;
}
function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-loading"><div className="brand auth-brand"><div className="brand-mark">F</div><div className="brand-name">fin<span>ai</span></div></div><p>Preparing FinAI…</p></div>;
  return isSignedIn ? <Redirect to="/workspace" /> : <PublicLanding />;
}
function AppRoutes() {
  return <Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={() => <AuthPage mode="sign-in" />} /><Route path="/sign-up/*?" component={() => <AuthPage mode="sign-up" />} /><Route component={WorkspaceRouter} /></Switch>;
}
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your workspace' } }, signUp: { start: { title: 'Create your workspace', subtitle: 'Keep your financial signal in one place' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}><AppRoutes /></QueryClientProvider>
  </ClerkProvider>;
}
function App() {
  // Local demo mode bypasses Clerk while keeping the full Clerk setup above
  // intact for later reactivation.
  if (LOCAL_DEMO_MODE) {
    return <WouterRouter base={basePath}><QueryClientProvider client={queryClient}><AppRoutes /></QueryClientProvider></WouterRouter>;
  }
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;