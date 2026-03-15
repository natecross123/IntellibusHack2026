import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, AlertTriangle, CheckCircle, XCircle, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RiskGauge from "@/components/RiskGauge";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileEmailAnalysis from "@/pages/mobile/MobileEmailAnalysis";
import { useToast } from "@/hooks/use-toast";
import { EmailAnalysisResponse, analyzeEmail } from "@/lib/securityApi";

const EmailAnalysis: React.FC = () => {
  const isMobile = useIsMobile();
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<EmailAnalysisResponse | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!body) return;
    setScanning(true);

    try {
      const response = await analyzeEmail(body.trim(), sender.trim(), subject.trim());
      setResult(response);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unable to analyze email.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  if (isMobile) return <MobileEmailAnalysis />;

  const showCentered = !result && !scanning;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={showCentered ? "flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center" : "space-y-6"}
    >
      {showCentered ? (
        <div className="w-full max-w-xl space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-yellow/20 to-cyber-light-blue/20 text-cyber-yellow">
              <Mail className="h-10 w-10" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Email Analysis</h1>
            <p className="text-sm text-muted-foreground max-w-sm">Paste an email to scan for phishing attempts and malicious links</p>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4 text-left">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Sender Email</Label><Input placeholder="sender@example.com" value={sender} onChange={(e) => setSender(e.target.value)} /></div>
              <div className="space-y-2"><Label>Subject</Label><Input placeholder="Email subject line" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Email Body</Label><Textarea placeholder="Paste the full email body here…" rows={6} value={body} onChange={(e) => setBody(e.target.value)} /></div>
              <Button onClick={() => void handleScan()} disabled={scanning || !body} className="w-full">
              {scanning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Send className="mr-2 h-4 w-4" /> Analyze Email</>}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {scanning && (
            <div className="glass-card flex flex-col items-center rounded-2xl py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="font-display text-lg font-semibold text-foreground">Analyzing email content…</p>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Re-scan form */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Mail className="h-5 w-5 text-cyber-yellow" /> Scan Another Email</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Sender Email</Label><Input placeholder="sender@example.com" value={sender} onChange={(e) => setSender(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Subject</Label><Input placeholder="Email subject line" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>Email Body</Label><Textarea placeholder="Paste the full email body here…" rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
                  <Button onClick={() => void handleScan()} disabled={!body}>
                    <Send className="mr-2 h-4 w-4" /> Re-Analyze
                  </Button>
                </div>

                {/* Results */}
                <div className="glass-card flex flex-col items-center rounded-2xl py-8">
                  <RiskGauge score={result.risk_score} size={200} label="Safety" />
                  <p className="mt-2 font-display text-lg font-bold text-score-danger">{result.risk_label}</p>
                  <p className="mt-2 max-w-2xl text-center text-sm text-muted-foreground">{result.verdict}</p>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><LinkIcon className="h-4 w-4 text-cyber-blue" /> Extracted URLs</h3>
                  <div className="space-y-2">
                    {(result.links_found.length > 0 ? result.links_found : ["No URLs detected in this email."]).map((u, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                        <span className="truncate text-sm text-foreground">{u}</span>
                        <div className="flex items-center gap-2">
                          {result.links_found.length > 0 ? <CheckCircle className="h-4 w-4 text-cyber-blue" /> : <CheckCircle className="h-4 w-4 text-score-safe" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><AlertTriangle className="h-4 w-4 text-score-danger" /> Suspicious Patterns</h3>
                  <ul className="space-y-2">
                    {(result.red_flags.length > 0 ? result.red_flags : [{ flag: result.scam_type || "No scam pattern detected", explanation: result.recommendation }]).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-score-danger" /><span className="text-foreground"><span className="font-medium">{p.flag}:</span> {p.explanation}</span></li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default EmailAnalysis;
