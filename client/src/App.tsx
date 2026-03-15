import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MonitoredAccountsProvider } from "@/contexts/MonitoredAccountsContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import LinkScanner from "@/pages/LinkScanner";
import ImageDetection from "@/pages/ImageDetection";
import VideoDetection from "@/pages/VideoDetection";
import EmailAnalysis from "@/pages/EmailAnalysis";
import BreachCheck from "@/pages/BreachCheck";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <MonitoredAccountsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Removed /login route - no auth needed */}
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/link-scanner" element={<Layout><LinkScanner /></Layout>} />
                <Route path="/image-detection" element={<Layout><ImageDetection /></Layout>} />
                <Route path="/video-detection" element={<Layout><VideoDetection /></Layout>} />
                <Route path="/email-analysis" element={<Layout><EmailAnalysis /></Layout>} />
                <Route path="/breach-check" element={<Layout><BreachCheck /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MonitoredAccountsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;