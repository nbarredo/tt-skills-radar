import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { KnowledgeAreas } from "@/pages/knowledge-areas";
import { SkillCategories } from "@/pages/skill-categories";
import { Skills } from "@/pages/skills";
import { Scales } from "@/pages/scales";
import { Members } from "@/pages/members";
import { MemberProfile } from "@/pages/member-profile";

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
            <Route path="/members/:id" element={<MemberProfile />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
