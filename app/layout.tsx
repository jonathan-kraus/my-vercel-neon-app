import SideNav from './components/SideNav';
import ClientShell from '@/app/components/ClientShell';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-blue-200 text-[#0C0D0D] dark:bg-black dark:text-white min-h-screen antialiased">
        <div className="flex h-screen">
          <SideNav />
          <main className="flex-1">{children}</main>
        </div>
        <ClientShell />
      </body>
    </html>
  );
}
