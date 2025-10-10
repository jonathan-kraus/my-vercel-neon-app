import Providers from './providers';
import { StackTheme } from '@stackframe/stack';
import SideNav from './components/SideNav';
import ClientShell from '@/app/components/ClientShell';
import { MockUserProvider } from './context/MockUserContext';



import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <StackTheme>
            <div className="layout">
              <SideNav />
              <main className="flex-1">{children}</main>
            </div>
            <ClientShell />
            <MockUserProvider>
              {children}
            </MockUserProvider>
          </StackTheme>
        </Providers>
      </body>
    </html>
  );
}
