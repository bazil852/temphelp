import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastCenter() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#fff',
          color: '#363636',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        
        // Success
        success: {
          style: {
            background: '#f0f9ff',
            color: '#0c4a6e',
            border: '1px solid #7dd3fc',
          },
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#f0f9ff',
          },
        },
        
        // Error
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
        
        // Loading
        loading: {
          style: {
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1',
          },
          iconTheme: {
            primary: '#64748b',
            secondary: '#f8fafc',
          },
        },
      }}
    />
  );
} 