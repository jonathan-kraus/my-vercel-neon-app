import SideNav from './components/SideNav';
import ClientShell from '@/app/components/ClientShell';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="layout">
          <SideNav />
          <main className="flex-1">{children}</main>
        </div>
        <ClientShell />
      </body>
    </html>
  );
}
