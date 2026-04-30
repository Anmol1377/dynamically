import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, FileText, Image as ImageIcon, Settings, LogOut } from 'lucide-react';
import { ensureSettingsRow, isSetupComplete } from '@/lib/auth/setup-state';
import { getCurrentUser } from '@/lib/auth/session';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureSettingsRow();
  if (!(await isSetupComplete())) redirect('/setup');

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r bg-muted/30 flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link href="/dashboard" className="font-semibold tracking-tight text-lg">
            Dynamically
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 text-sm">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </NavItem>
          <NavItem href="/pages" icon={<FileText className="h-4 w-4" />}>
            Pages
          </NavItem>
          <NavItem href="/media" icon={<ImageIcon className="h-4 w-4" />}>
            Media
          </NavItem>
          <NavItem href="/settings" icon={<Settings className="h-4 w-4" />}>
            Settings
          </NavItem>
        </nav>

        <div className="p-3 border-t space-y-2">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Signed in as
            <div className="text-foreground font-medium truncate">{user.email}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
