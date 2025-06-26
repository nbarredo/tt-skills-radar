import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { KnowledgeAreas } from "@/pages/knowledge-areas";
import { SkillCategories } from "@/pages/skill-categories";
import { Skills } from "@/pages/skills";
import { Scales } from "@/pages/scales";
import { Members } from "@/pages/members";
import { MemberProfilePage } from "@/pages/member-profile";
import { ChatbotPage } from "@/pages/chatbot";
import { ImportsPage } from "@/pages/imports";
import ClientsPage from "@/pages/clients";
import { ClientDetailPage } from "@/pages/client-detail";
import MemberAssignmentsPage from "@/pages/member-assignments";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/knowledge-areas" element={<KnowledgeAreas />} />
            <Route path="/skill-categories" element={<SkillCategories />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/scales" element={<Scales />} />
            <Route path="/members" element={<Members />} />
            <Route path="/member-profile/:id" element={<MemberProfilePage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/imports" element={<ImportsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/client-detail/:id" element={<ClientDetailPage />} />
            <Route
              path="/member-assignments"
              element={<MemberAssignmentsPage />}
            />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
