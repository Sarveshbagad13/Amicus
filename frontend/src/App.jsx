import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { LegalDisclaimerBanner } from './components/layout/LegalDisclaimerBanner';
import { UploadZone } from './components/upload/UploadZone';
import { ErrorModal } from './components/upload/ErrorModal';
import { AuthModal } from './components/auth/AuthModal';
import { DocumentWorkspace } from './components/analysis/DocumentWorkspace';
import { DocumentHistory } from './components/dashboard/DocumentHistory';
import { LandingPage } from './components/landing/LandingPage';

function MainApp() {
  // Default to the new Amicus Landing Page
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'upload' | 'workspace' | 'history'
  const [activeAnalysisData, setActiveAnalysisData] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [errorModalData, setErrorModalData] = useState(null);

  const { isAuthenticated } = useAuth();

  const handleAnalysisComplete = (data) => {
    setActiveAnalysisData(data);
    setCurrentView('workspace');
  };

  const handleSelectFromHistory = (data) => {
    setActiveAnalysisData(data);
    setCurrentView('workspace');
  };

  const handleDeleteSuccess = () => {
    setActiveAnalysisData(null);
    setCurrentView('history');
  };

  // If in landing page view, render the dedicated production landing page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-canvas text-body selection:bg-accent-soft selection:text-accent font-sans antialiased">
        <LandingPage onLaunchApp={() => setCurrentView('upload')} />
        
        {/* Modals available from landing */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col font-sans antialiased">
      {/* Persistent Legal Disclaimer Banner */}
      <LegalDisclaimerBanner />

      {/* App Header with Back to Landing & Navigation */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => setCurrentView(view)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main Body Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'upload' && (
          <UploadZone
            onAnalysisComplete={handleAnalysisComplete}
            onError={(err) => setErrorModalData(err)}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentView === 'workspace' && activeAnalysisData && (
          <DocumentWorkspace
            data={activeAnalysisData}
            onBack={() => setCurrentView('upload')}
            onDeleteSuccess={handleDeleteSuccess}
          />
        )}

        {currentView === 'history' && (
          <DocumentHistory
            onSelectDocument={handleSelectFromHistory}
            onNewUpload={() => setCurrentView('upload')}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ErrorModal
        isOpen={!!errorModalData}
        onClose={() => setErrorModalData(null)}
        errorData={errorModalData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
