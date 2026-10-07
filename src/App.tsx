/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Box, useMediaQuery, useTheme } from '@mui/material';
import { theme } from './theme/theme';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { MobileDrawer } from './components/navigation/MobileDrawer';
import { NavTab, TAB_TITLES } from './components/navigation/navConfig';
import { ToastContainer } from './components/common/Toast';
import { AuthDialog } from './components/auth/AuthDialog';
import { useApp } from './context/AppContext';
import { LinearProgress } from '@mui/material';

// Pages
import { DashboardPage } from './components/pages/DashboardPage';
import { ChickenPage } from './components/pages/ChickenPage';
import { HarvestPage } from './components/pages/HarvestPage';
import { StockPage } from './components/pages/StockPage';
import { SalesPage } from './components/pages/SalesPage';
import { ExpensesPage } from './components/pages/ExpensesPage';
import { ProfitPage } from './components/pages/ProfitPage';
import { CapitalConversionPage } from './components/pages/CapitalConversionPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { SettingsPage } from './components/pages/SettingsPage';

function MainAppContent() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isAuthDialogOpen, setIsAuthDialogOpen, dbLoading } = useApp();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Modal triggers for quick shortcuts from Dashboard
  const [triggerHarvestModal, setTriggerHarvestModal] = useState(false);
  const [triggerSaleModal, setTriggerSaleModal] = useState(false);
  const [triggerExpenseModal, setTriggerExpenseModal] = useState(false);

  // State to pass profit to conversion page
  const [conversionInitialProfit, setConversionInitialProfit] = useState<number | undefined>(undefined);

  const handleNavigateToConversionWithProfit = (amount: number) => {
    setConversionInitialProfit(amount);
    setActiveTab('conversion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewHarvest = () => {
    setActiveTab('harvest');
    setTriggerHarvestModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewSale = () => {
    setActiveTab('sales');
    setTriggerSaleModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewExpense = () => {
    setActiveTab('expenses');
    setTriggerExpenseModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Desktop Sidebar (Permanent, Collapsible) */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          widthExpanded={240}
          widthCollapsed={70}
        />
      )}

      {/* Main Layout Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top App Bar */}
        <TopBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={isMobile}
        />

        {dbLoading && <LinearProgress color="primary" sx={{ height: 2.5 }} />}

        {/* Content Container */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
          }}
        >
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={handleSelectTab}
              onOpenNewHarvest={handleOpenNewHarvest}
              onOpenNewSale={handleOpenNewSale}
              onOpenNewExpense={handleOpenNewExpense}
            />
          )}

          {activeTab === 'chicken' && <ChickenPage />}

          {activeTab === 'harvest' && (
            <HarvestPage
              isAddModalOpen={triggerHarvestModal}
              setIsAddModalOpen={setTriggerHarvestModal}
            />
          )}

          {activeTab === 'stock' && <StockPage />}

          {activeTab === 'sales' && (
            <SalesPage
              isAddModalOpen={triggerSaleModal}
              setIsAddModalOpen={setTriggerSaleModal}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesPage
              isAddModalOpen={triggerExpenseModal}
              setIsAddModalOpen={setTriggerExpenseModal}
            />
          )}

          {activeTab === 'profit' && (
            <ProfitPage
              onNavigateToConversionWithProfit={handleNavigateToConversionWithProfit}
              onNavigate={handleSelectTab}
            />
          )}

          {activeTab === 'conversion' && (
            <CapitalConversionPage
              initialProfit={conversionInitialProfit}
              onNavigateToSettings={() => handleSelectTab('settings')}
              onNavigate={handleSelectTab}
            />
          )}

          {activeTab === 'reports' && <ReportsPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </Box>
      </Box>

      {/* Mobile Drawer (Temporary) */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Global MUI Toast Notifications */}
      <ToastContainer />

      {/* Supabase Auth Modal */}
      <AuthDialog open={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
