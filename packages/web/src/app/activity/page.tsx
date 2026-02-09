'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { fadeIn } from '@/lib/animations';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/activity/activity-timeline';

export default function ActivityPage() {
  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={fadeIn}>
      <PageHeader
        title="Activity Timeline"
        description="Track all interactions with creditors and collectors."
        actions={
          <Link href="/activity/log">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Log Activity
            </Button>
          </Link>
        }
      />

      <ActivityTimeline />
    </motion.div>
  );
}
