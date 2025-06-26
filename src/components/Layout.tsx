'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  CreditCard, 
  Plus, 
  FileText, 
  Settings 
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Pay',
    href: '/pay',
    icon: CreditCard,
  },
  {
    name: 'Create',
    href: '/create',
    icon: Plus,
  },
  {
    name: 'My Bills',
    href: '/my-bills',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  // Don't show bottom nav on these pages
  const excludedPaths = ['/', '/login', '/setup-username'];
  const shouldShowBottomNav = useMemo(() => 
    !excludedPaths.includes(pathname), 
    [pathname]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with bottom padding when nav is shown */}
      <main className={shouldShowBottomNav ? 'pb-20' : ''}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
          <div className="max-w-md mx-auto px-2">
            <div className="flex justify-around items-center py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-150 min-w-[60px] min-h-[60px] justify-center ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    prefetch={true}
                    replace={false}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} strokeWidth={2} />
                    <span className={`text-xs mt-1 font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
