import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { OnlinePresenceProvider } from "@/components/OnlinePresenceProvider";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Levels = lazy(() => import("./pages/Levels"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const Profile = lazy(() => import("./pages/Profile"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const ManageTeachers = lazy(() => import("./pages/ManageTeachers"));
const TeacherQuestions = lazy(() => import("./pages/TeacherQuestions"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized query client with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Simple loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="/content/:level" element={<ContentPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/teacher-questions" element={<TeacherQuestions />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <OnlinePresenceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </OnlinePresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
