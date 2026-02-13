import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ReadingPage from "./pages/ReadingPage";
import ReadPage from "./pages/ReadPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import GrammarPage from "./pages/GrammarPage";
import QuizPage from "./pages/QuizPage";
import PracticePage from "./pages/PracticePage";
import ChatPage from "./pages/ChatPage";
import ProgressDashboard from "./pages/ProgressDashboard";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reading" element={<ReadingPage />} />
            <Route path="/read/:id" element={<ReadPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/grammar" element={<GrammarPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
