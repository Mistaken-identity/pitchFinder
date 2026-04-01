
import React from 'react';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <footer className="glass border-t border-white/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} PitchFinder KE. Built for the Kenyan football community.
          </p>
        </div>
      </footer>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </div>
  );
};

export default Layout;
