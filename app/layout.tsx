import SideNav from './components/SideNav';
import ClientShell from '@/app/components/ClientShell';
import { RequestIdProvider } from './contexts/RequestIdContext';
import './globals.css';
import './app.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-blue-200 text-[#0C0D0D] dark:bg-black dark:text-white min-h-screen antialiased">
        <RequestIdProvider>
          <div className="flex shrink-0 min-h-screen">
            <SideNav />
            <main className="flex-1">{children}</main>
          </div>
          <ClientShell />
          <Toaster position="top-right" />
        </RequestIdProvider>
      </body>
    </html>
  );
}
