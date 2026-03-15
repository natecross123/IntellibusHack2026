import React from "react";
import { motion } from "framer-motion";
import { User, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const MobileSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
      <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>

      <div className="glass-card overflow-hidden rounded-2xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <User className="h-3.5 w-3.5" /> Profile
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input value={user?.fullName ?? ""} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email ?? ""} readOnly />
          </div>
          <p className="text-xs text-muted-foreground">Profile details are loaded from your authenticated account.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle theme</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Notifications
        </h2>
        <p className="text-sm text-muted-foreground">Notification preferences are not yet persisted, so no saved settings are shown here.</p>
      </div>
    </motion.div>
  );
};

export default MobileSettings;