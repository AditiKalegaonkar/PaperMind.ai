import React from 'react';
import { showToast } from './toast.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast({ message: error?.message || 'An error occurred', type: 'error' });
    } else {
      // Fallback to toast bus if available
      try { showToast({ message: error?.message || 'An error occurred' }); } catch {}
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>We're working to fix it. Please try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
