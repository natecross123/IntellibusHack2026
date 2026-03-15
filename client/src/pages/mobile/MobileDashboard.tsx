import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Image, Mail, Link as LinkIcon, ShieldAlert,
  AlertTriangle, CheckCircle, ArrowRight, Plus, Sparkles, Bell,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMonitoredAccounts } from "@/contexts/MonitoredAccountsContext";
import { useToast } from "@/hooks/use-toast";

const pieColors = [
  "hsl(var(--cyber-light-blue))",
  "hsl(var(--cyber-blue))",
  "hsl(var(--cyber-teal))",
  "hsl(var(--cyber-yellow))",
  "hsl(var(--cyber-green))",
];

const serviceCards = [
  { title: "Video", description: "Deepfake detection", icon: Video, path: "/video-detection", tone: "video" },
  { title: "Image", description: "AI artifact scan", icon: Image, path: "/image-detection", tone: "image" },
  { title: "Email", description: "Phishing analysis", icon: Mail, path: "/email-analysis", tone: "email" },
  { title: "Links", description: "URL scanner", icon: LinkIcon, path: "/link-scanner", tone: "link" },
  { title: "Breach", description: "Credential check", icon: ShieldAlert, path: "/breach-check", tone: "breach" },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const gradeFromScore = (score: number): string => {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  return "D";
};

const timeAgo = (iso: string): string => {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "recent";
  const diffMinutes = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};

const sourceCategory = (source: string): string => {
  const s = source.toLowerCase();
  if (s.includes("mail") || s.includes("email")) return "Email";
  if (s.includes("bank") || s.includes("finance") || s.includes("wallet")) return "Finance";
  if (s.includes("shop") || s.includes("store") || s.includes("commerce")) return "Shopping";
  if (s.includes("social") || s.includes("discord") || s.includes("instagram") || s.includes("facebook")) return "Social Media";
  return "Other";
};

const MobileDashboard: React.FC = () => {
  const { accounts, addMonitoredAccount } = useMonitoredAccounts();
  const { toast } = useToast();
  const [newAccount, setNewAccount] = useState("");
  const hasAccounts = accounts.length > 0;
  const overallScore = hasAccounts
    ? Math.round(accounts.reduce((sum, account) => sum + account.score, 0) / accounts.length)
    : 0;
  const overallGrade = gradeFromScore(overallScore);
  const totalBreaches = accounts.reduce((sum, account) => sum + account.breaches, 0);

  const recentNotifications = hasAccounts
    ? accounts
      .filter((account) => account.breaches > 0)
      .slice(0, 3)
      .map((account, index) => ({
        id: index + 1,
        type: account.score < 40 ? "danger" : account.score < 70 ? "warning" : "info",
        message: `${account.email} appears in ${account.breaches} breach${account.breaches === 1 ? "" : "es"}.`,
        time: timeAgo(account.lastCheckedAt),
      }))
    : [];

  const sourceBuckets = accounts.flatMap((account) => account.recentBreaches).reduce<Record<string, number>>((acc, breach) => {
    const category = sourceCategory(breach.source);
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, { "Social Media": 0, Email: 0, Shopping: 0, Finance: 0, Other: 0 });

  const sourceTotal = Object.values(sourceBuckets).reduce((sum, value) => sum + value, 0);
  const breachSourceData = Object.entries(sourceBuckets).map(([name, count]) => ({
    name,
    value: sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0,
  }));

  const handleAddAccount = async () => {
    const trimmed = newAccount.trim();
    if (!trimmed) return;

    const result = await addMonitoredAccount(trimmed);
    if (!result.ok) {
      toast({
        title: "Unable to add account",
        description: result.error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setNewAccount("");
    toast({
      title: "Account monitored",
      description: `${trimmed} was added to monitored accounts.`,
    });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pb-24">
      {/* Greeting row */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-xl font-bold text-foreground">CyberShield Dashboard</h1>
        </div>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </motion.div>

      {/* Score card OR Welcome card */}
      <AnimatePresence mode="wait">
        {!hasAccounts ? (
          <motion.div
            key="welcome"
            variants={item}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="mobile-score-card overflow-hidden rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-white">Welcome to CyberShield!</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">
                    Add accounts to start monitoring for breaches and threats.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <Input
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="email or @handle"
                  className="h-10 rounded-xl border-white/20 bg-white/15 text-sm text-white placeholder:text-white/50"
                />
                <Button size="sm" onClick={handleAddAccount} className="w-full gap-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30">
                  <Plus className="h-3.5 w-3.5" /> Add Account
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="score"
            variants={item}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="mobile-score-card overflow-hidden rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="dashboard-grade-orb flex h-20 w-20 shrink-0 items-center justify-center rounded-full ring-2 ring-white/25">
                  <span className="font-display text-2xl font-extrabold text-white">{overallGrade}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Security Score</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-white/85 transition-all duration-700" style={{ width: `${overallScore}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white/85">{overallScore}%</span>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{accounts.length}</p>
                      <p className="text-[10px] text-white/50">Accounts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{totalBreaches}</p>
                      <p className="text-[10px] text-white/50">Breaches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{recentNotifications.length}</p>
                      <p className="text-[10px] text-white/50">Alerts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions */}
      {hasAccounts && <motion.div variants={item} className="flex gap-3">
        <Link to="/link-scanner" className="flex-1">
          <Button variant="outline" className="h-12 w-full gap-2 rounded-xl">
            <LinkIcon className="h-4 w-4" /> Scan URL
          </Button>
        </Link>
        <Link to="/breach-check" className="flex-1">
          <Button variant="outline" className="h-12 w-full gap-2 rounded-xl">
            <ShieldAlert className="h-4 w-4" /> Check Breaches
          </Button>
        </Link>
      </motion.div>}

      {/* Service grid */}
      <motion.div variants={item}>
        <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Services</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {serviceCards.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.title} to={service.path}>
                <div className={`dashboard-service-card dashboard-service-card--${service.tone} mobile-service-tile flex flex-col items-center justify-center gap-2 p-3 text-center`}>
                  <div className={`dashboard-service-icon dashboard-service-icon--${service.tone} !mt-0 !h-10 !w-10 !rounded-xl`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{service.title}</p>
                    <p className="text-[10px] leading-tight text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent alerts */}
      {hasAccounts && (
        <motion.div variants={item}>
          <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Recent Alerts</h2>
          <div className="glass-card space-y-0 divide-y divide-border/50 overflow-hidden rounded-2xl">
            {recentNotifications.length === 0 && (
              <div className="p-3.5 text-sm text-muted-foreground">No recent breach alerts for monitored accounts.</div>
            )}
            {recentNotifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 p-3.5">
                {n.type === "danger" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                ) : n.type === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-score-warning" />
                ) : (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-score-safe" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Breach sources mini */}
      {hasAccounts && (
        <motion.div variants={item}>
          <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Breach Sources</h2>
          <div className="glass-card overflow-hidden rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breachSourceData} cx="50%" cy="50%" innerRadius={20} outerRadius={38} dataKey="value" strokeWidth={2} stroke="hsl(var(--card) / 0.4)">
                      {breachSourceData.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {breachSourceData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                    <span className="text-xs text-foreground/75">{d.name}</span>
                    <span className="ml-auto text-xs font-semibold text-foreground/55">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MobileDashboard;
