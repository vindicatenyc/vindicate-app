'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations';
import { PageHeader } from '@/components/ui/page-header';
import { CaseList } from '@/components/cases/case-list';

export default function CasesPage() {
  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={fadeIn}>
      <PageHeader
        title="Cases"
        description="Manage disputes, complaints, and legal proceedings."
      />

      <CaseList />
    </motion.div>
  );
}
