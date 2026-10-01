'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, BarChart3, Package, PlusCircle, FolderTree, BookOpen,
  List, FileText, Ticket, Palette, Star, Activity, Megaphone,
  Settings, LogOut, Menu, X, Shield, ChevronRight, Monitor, Sun, Moon, CreditCard, Users
} from 'lucide-react';

import { ToastContext, useToast } from '@/components/admin/ToastContext';

export { useToast };

export default function AuthenticatedAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Administrator');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('dark');

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('store_admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      try {
        const user = JSON.parse(localStorage.getItem('store_admin_user') || '{}');
        setUserEmail(user.email || 'Admin');
        
        if (user.permissions && Array.isArray(user.permissions)) {
          if (user.permissions.includes('super_admin')) {
            setUserRole('Super Admin');
          } else {
            const formattedRoles = user.permissions.map((p: string) => 
              p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            ).join(', ');
            setUserRole(formattedRoles || 'Admin');
          }
        }
      } catch (e) { /* ignore */ }
      setIsAuthenticated(true);
    }
  }, [router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const showToast = useCallback((message: string, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exit: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('store_admin_token');
    localStorage.removeItem('store_admin_user');
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-bg-surface-light" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-text-muted" style={{ fontWeight: 500 }}>Verifying session...</div>
      </div>
    );
  }

  const navSections = [
    {
      label: 'Overview',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      label: 'Store',
      items: [
        { href: '/admin/orders', label: 'Orders', icon: Package },
        { href: '/admin/add-order', label: 'Add Order', icon: PlusCircle },
        { href: '/admin/customers', label: 'Customers', icon: Users },
        { href: '/admin/categories', label: 'Categories', icon: FolderTree },
        { href: '/admin/products', label: 'Products', icon: List },
        { href: '/admin/products/new', label: 'Add Product', icon: PlusCircle },
      ]
    },
    {
      label: 'Content',
      items: [
        { href: '/admin/landing-pages', label: 'Landing Pages', icon: Monitor },
        { href: '/admin/pages', label: 'Pages', icon: FileText },
        { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
        { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
        { href: '/admin/reviews', label: 'Reviews', icon: Star },
      ]
    },
    {
      label: 'Configuration',
      items: [
        { href: '/admin/layout-editor', label: 'Layout Editor', icon: Palette },
        { href: '/admin/marketing', label: 'Marketing & Tracking', icon: Megaphone },
        { href: '/admin/payment', label: 'Payments', icon: CreditCard },
        { href: '/admin/usage', label: 'Usage Limits', icon: Activity },
        { href: '/admin/settings/admins', label: 'Manage Admins', icon: Shield },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ]
    },
  ];

  // Get current page title from navigation
  const currentTitle = navSections
    .flatMap(s => s.items)
    .find(i => pathname === i.href || (i.href !== '/admin/dashboard' && pathname.startsWith(i.href)))
    ?.label || 'Admin';

  const userInitial = (userEmail || 'A').charAt(0).toUpperCase();

  return (
    <ToastContext.Provider value={showToast}>
      {/* Sidebar Backdrop (Mobile) */}
      {sidebarOpen && (
        <div
          className={`admin-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <Shield size={20} />
            <span>Admin Panel</span>
          </div>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="admin-nav-section">
              <span className="admin-nav-label">{section.label}</span>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/admin/dashboard' && item.href !== '/admin/products/new' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">{userInitial}</div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">{userEmail}</div>
              <div className="admin-sidebar-user-role">{userRole}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={toggleTheme} style={{ marginBottom: '8px', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="admin-page-title">{currentTitle}</h1>
          </div>
          <div className="admin-header-right">
            <span className="admin-text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
              Admin Panel
            </span>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="admin-toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`admin-toast admin-toast-${toast.type} ${toast.exit ? 'admin-toast-exit' : ''}`}
            >
              {toast.type === 'success' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              )}
              {toast.type === 'error' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
