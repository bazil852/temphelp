import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import TutorialsPage from './pages/TutorialsPage';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import SettingsPage from './pages/SettingsPage';
import ContentPlannerPage from './pages/ContentPlannerPage';
import VideoEditorPage from './pages/VideoEditorPage';
import AppearancesPage from './pages/AppearancesPage';
import Chatbot from './components/Chatbot';
import VideoDubbingPage from './pages/VideoDubbingPage';
import TutorialPage from './pages/TutorialPage';
import ApiSetupModal from './components/ApiSetupModal';
import { useAuthStore } from './store/authStore';
import UpdatePlan from './pages/UpdatePlan';
import AdminPanel from './pages/AdminPanel';
import CreateAiAvatarPage from './pages/CreateAiAvatarPage';
import CreateAiClonePage from './pages/CreateAiClonePage';
import CreatePhotoAvatarPage from './pages/CreatePhotoAvatarPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import InfluencersPage from './pages/InfluencersPage';
import VideosPage from './pages/VideosPage';
import WorkflowPage from './pages/WorkflowPage';
import PodcastStudioPage from './pages/PodcastStudioPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.currentUser);
  const [showApiSetup, setShowApiSetup] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !user.hasPlan) {
      navigate('/update-plan');
      return;
    }

    if (user && (!user.openaiApiKey || !user.heygenApiKey)) {
      setShowApiSetup(true);
    }
  }, [user, navigate]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {children}
      {showApiSetup && <ApiSetupModal onClose={() => setShowApiSetup(false)} />}
    </>
  );
}

function App() {
  const user = useAuthStore((state) => state.currentUser);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={
          <div className="min-h-screen bg-gray-100">
            <ResetPasswordPage />
          </div>
        } />
        
        <Route path="/" element={<Layout hasPlan={user?.hasPlan} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="influencers"
            element={
              <ProtectedRoute>
                <InfluencersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="videos"
            element={
              <ProtectedRoute>
                <VideosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="content/:id"
            element={
              <ProtectedRoute>
                <ContentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="clone-content/:id"
            element={
              <ProtectedRoute>
                <ContentPage isClone />
              </ProtectedRoute>
            }
          />
          <Route
            path="planner"
            element={
              <ProtectedRoute>
                <ContentPlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="appearances/:id"
            element={
              <ProtectedRoute>
                <AppearancesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tutorials"
            element={<TutorialsPage />}
          />
          <Route
            path="tutorials/:id"
            element={<TutorialPage />}
          />
          <Route
            path="admin-panel"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-ai-avatar"
            element={
              <ProtectedRoute>
                <CreateAiAvatarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-ai-clone"
            element={
              <ProtectedRoute>
                <CreateAiClonePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-photo-avatar"
            element={
              <ProtectedRoute>
                <CreatePhotoAvatarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="video-dubbing"
            element={
              <ProtectedRoute>
                <VideoDubbingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="video-editor"
            element={
              <ProtectedRoute>
                <VideoEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="workflow"
            element={
              <ProtectedRoute>
                <WorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route path="/update-plan" element={<UpdatePlan />} />
          <Route
            path="create-ai-clone"
            element={
              <ProtectedRoute>
                <CreateAiClonePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="podcast-studio"
            element={
              <ProtectedRoute>
                <PodcastStudioPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      {user && <Chatbot />}
    </BrowserRouter>
  );
}

export default App;