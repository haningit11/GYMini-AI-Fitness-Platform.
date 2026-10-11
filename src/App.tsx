import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
//import FlexCoach from "@/components/FlexCoach";

import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";

import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGyms from "./pages/AdminGyms";
import AdminSettings from "./pages/AdminSettings";
import AdminLogs from "./pages/AdminLogs";
import AdminReviews from "./pages/AdminReviews";

import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Generator from "./pages/Generator";
import WorkoutSession from "./pages/WorkoutSession";
import ProgressPage from "./pages/ProgressPage";
import Community from "./pages/Community";
import Analytics from "./pages/Analytics";
import ImportPlan from "./pages/ImportPlan";
import SavedPlans from "./pages/SavedPlans";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import GymAdminDashboard from "./pages/GymAdminDashboard";

const queryClient = new QueryClient();

/**
 * Routes must be direct children of <Routes> (React Router requirement).
 * Order: public → admin tree (separate layout, no UserLayout) → user hub → catch-all.
 * ProtectedRoute redirects platform admins away from the user tree before UserLayout mounts.
 */
const FlexCoachGate = () => {
  // We are returning null here to hide the AI assistant globally
  return null; 
};

const AppRoutes = () => (
  <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="gyms" element={<AdminGyms />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/import-plan" element={<ImportPlan />} />
        <Route path="/workout" element={<WorkoutSession />} />
        <Route path="/saved-plans" element={<SavedPlans />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/community" element={<Community />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/gym-admin" element={<GymAdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    {/* <FlexCoachGate /> */}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
