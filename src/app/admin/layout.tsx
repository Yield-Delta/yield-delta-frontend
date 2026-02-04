import { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  Home,
  Monitor,
  Settings,
  Shield
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Yield Delta',
  description: 'Machine Learning monitoring and administration',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />
    },
    {
      href: '/admin/ml-monitoring',
      label: 'ML Monitoring',
      icon: <Monitor className="h-4 w-4" />
    },
    {
      href: '/admin/ml-alerts',
      label: 'Alerts',
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      href: '/admin/performance',
      label: 'Performance',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      href: '/admin/models',
      label: 'Models',
      icon: <Brain className="h-4 w-4" />
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Admin Panel</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Yield Delta Protocol</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Activity className="h-4 w-4 text-green-500" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}