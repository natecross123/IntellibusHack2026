import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, Clock, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RiskGauge from "@/components/RiskGauge";
import UrlInput from "@/components/UrlInput";
import { useToast } from "@/hooks/use-toast";
import { MediaScanResponse, scanVideoFile, scanVideoUrl } from "@/lib/securityApi";

const MobileVideoDetection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MediaScanResponse | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); setScannedUrl(null); }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);

    try {
      const response = await scanVideoFile(file);
      setResult(response);
    } catch (error) {
      toast({
        title: "Video scan failed",
        description: error instanceof Error ? error.message : "Unable to scan video.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleUrlScan = async (url: string) => {
    setScannedUrl(url);
    setFile(null);
    setScanning(true);

    try {
      const response = await scanVideoUrl(url);
      setResult(response);
    } catch (error) {
      toast({
        title: "Video URL scan failed",
        description: error instanceof Error ? error.message : "Unable to scan video URL.",
        variant: "destructive",
      });
      setScannedUrl(null);
    } finally {
      setScanning(false);
    }
  };

  const showCentered = !file && !scanning && !result && !scannedUrl;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={showCentered ? "flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center pb-24 px-2" : "space-y-4 pb-24"}>
      {showCentered ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-light-blue/20 to-cyber-blue/20">
            <Clapperboard className="h-8 w-8 text-cyber-light-blue" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Video Detection</h1>
          <p className="text-sm text-muted-foreground mb-6">Upload a video or paste a URL to analyze for deepfakes</p>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="flex-1">Scan URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <label className="glass-card flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 transition-all hover:border-primary/50">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Upload a video</p>
                <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, WebM up to 100MB</p>
                <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
              </label>
            </TabsContent>
            <TabsContent value="url">
              <div className="glass-card rounded-2xl p-4">
                <UrlInput placeholder="Paste a video URL, YouTube link, or TikTok post…" onSubmit={handleUrlScan} loading={scanning} compact />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      ) : (
        <>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Video Detection</h1>
            <p className="text-xs text-muted-foreground">
              {scannedUrl ? <>Scanned: <span className="text-primary truncate block max-w-[250px]">{scannedUrl}</span></> : "Analyze videos for deepfake indicators"}
            </p>
          </div>

          <div className="glass-card overflow-hidden rounded-2xl p-4">
            {!file && !scannedUrl ? (
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="mb-3 w-full">
                  <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1">Scan URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Upload a video</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to 100MB</p>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
                  </label>
                </TabsContent>
                <TabsContent value="url">
                  <UrlInput placeholder="Paste a video URL, YouTube link, or TikTok post…" onSubmit={handleUrlScan} loading={scanning} compact />
                </TabsContent>
              </Tabs>
            ) : file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                  <Video className="h-6 w-6 text-cyber-light-blue" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setResult(null); setScannedUrl(null); }}>Clear</Button>
                  <Button className="flex-1" onClick={handleScan} disabled={scanning}>
                    {scanning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Video className="mr-2 h-4 w-4" /> Analyze</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                {scanning ? (
                  <>
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="font-display text-base font-semibold text-foreground">Scanning URL…</p>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => { setScannedUrl(null); setResult(null); }}>Scan Another</Button>
                )}
              </div>
            )}
          </div>

          {scanning && file && (
            <div className="glass-card flex flex-col items-center rounded-2xl py-12">
              <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="font-display text-base font-semibold text-foreground">Analyzing…</p>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="glass-card flex flex-col items-center rounded-2xl py-6">
                  <RiskGauge score={result.risk_score} size={150} label="Authenticity" />
                  <p className="mt-2 font-display text-base font-bold text-score-danger">{result.risk_label}</p>
                  <p className="mt-2 px-4 text-center text-xs text-muted-foreground">{result.verdict}</p>
                  {scannedUrl && <p className="mt-1 text-[10px] text-muted-foreground truncate max-w-[200px]">Source: {scannedUrl}</p>}
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Clock className="h-3.5 w-3.5 text-cyber-light-blue" /> Recommendation</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">{result.recommendation}</p>
                    {typeof result.deepfake_score === "number" && (
                      <p className="text-xs text-muted-foreground">Deepfake confidence: {Math.round(result.deepfake_score * 100)}%</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default MobileVideoDetection;
