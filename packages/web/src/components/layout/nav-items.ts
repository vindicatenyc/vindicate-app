import {
  LayoutDashboard,
  Wallet,
  Activity,
  Briefcase,
  PiggyBank,
  Bell,
  BookOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: Activity, label: 'Activity', href: '/activity' },
  { icon: Briefcase, label: 'Cases', href: '/cases' },
  { icon: PiggyBank, label: 'Budget', href: '/budget' },
  { icon: Bell, label: 'Alerts', href: '/alerts' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
];

export const settingsItem: NavItem = {
  icon: Settings,
  label: 'Settings',
  href: '/settings',
};
