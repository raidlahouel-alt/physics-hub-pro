import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { OnlinePresenceProvider } from "@/components/OnlinePresenceProvider";
import { GlobalLoader } from "@/components/common/GlobalLoader";
import { PageTransition } from "@/components/common/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Levels from "./pages/Levels";
import ContentPage from "./pages/ContentPage";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManageTeachers from "./pages/ManageTeachers";
import TeacherQuestions from "./pages/TeacherQuestions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  
  return (
    <>
      <GlobalLoader />
      <PageTransition key={location.pathname}>
        <Routes location={location}>
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
      </PageTransition>
    </>
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
