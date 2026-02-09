'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={fadeIn}>
      <PageHeader
        title="Settings"
        description="Manage your preferences, theme, and account settings."
      />

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Theme, notification preferences, state selection, and profile settings will appear here.
        </p>
      </div>
    </motion.div>
  );
}
