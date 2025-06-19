
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { GameConfigProvider } from "@/contexts/GameConfigContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <ConfigProvider>
          <GameConfigProvider>
            <SimulationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/configuration" element={<Configuration />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </SimulationProvider>
          </GameConfigProvider>
        </ConfigProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
