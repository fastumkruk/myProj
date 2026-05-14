import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Lists from "@/pages/Lists";
import ListDetails from "@/pages/ListDetails";
import NotConfigured from "@/pages/NotConfigured";
import AuthGate from "@/components/AuthGate";
import ThemeBootstrap from "@/components/ThemeBootstrap";

export default function App() {
  return (
    <AuthGate>
      <ThemeBootstrap />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/not-configured" element={<NotConfigured />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/:listId" element={<ListDetails />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </AuthGate>
  );
}
