import React from 'react';
import { useAppStore } from './stores/appStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FooterStatus } from './components/layout/FooterStatus';
import { Toast } from './components/common/Toast';
import { CalibrationModal } from './modules/calibration/CalibrationModal';
import { AuthModal } from './components/auth/AuthModal';
import { SubscriptionModal } from './modules/subscription/SubscriptionModal';

// Views
import { DashboardView } from './modules/dashboard/DashboardView';
import { QuickMeasureView } from './modules/quick-measure/QuickMeasureView';
import { PrecisionStudioView } from './modules/precision-studio/PrecisionStudioView';
import { VernierCaliperView } from './modules/vernier-caliper/VernierCaliperView';
import { ScrewGaugeView } from './modules/screw-gauge/ScrewGaugeView';
import { ScientificInstrumentsView } from './modules/scientific-instruments/ScientificInstrumentsView';
import { VernierHeightGaugeView } from './modules/scientific-instruments/VernierHeightGaugeView';
import { DialIndicatorView } from './modules/scientific-instruments/DialIndicatorView';
import { DigitalCompassView } from './modules/scientific-instruments/DigitalCompassView';
import { UnitConverterView } from './modules/unit-converter/UnitConverterView';
import { CalibrationView } from './modules/calibration/CalibrationView';
import { ProjectsView } from './modules/projects/ProjectsView';
import { HistoryView } from './modules/history/HistoryView';
import { ExportCenterView } from './modules/export/ExportCenterView';
import { ImageMeasurementView } from './modules/image-measurement/ImageMeasurementView';
import { HelpGuideView } from './modules/help/HelpGuideView';

export const App: React.FC = () => {
  const { activeTab } = useAppStore();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'quick-measure':
        return <QuickMeasureView />;
      case 'precision-studio':
        return <PrecisionStudioView />;
      case 'vernier-caliper':
        return <VernierCaliperView />;
      case 'screw-gauge':
        return <ScrewGaugeView />;
      case 'scientific-instruments':
        return <ScientificInstrumentsView />;
      case 'vernier-height-gauge':
        return <VernierHeightGaugeView />;
      case 'dial-indicator':
        return <DialIndicatorView />;
      case 'digital-compass':
        return <DigitalCompassView />;
      case 'unit-converter':
        return <UnitConverterView />;
      case 'calibration':
        return <CalibrationView />;
      case 'projects':
        return <ProjectsView />;
      case 'history':
        return <HistoryView />;
      case 'export':
        return <ExportCenterView />;
      case 'image-measurement':
        return <ImageMeasurementView />;
      case 'help':
        return <HelpGuideView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFF] text-[#1D2940] font-sans antialiased selection:bg-brand-blue/20 selection:text-brand-blue relative overflow-x-hidden">
      {/* Aurora Ambient Glow Effects in Background */}
      <div className="fixed top-0 left-64 w-[600px] h-[500px] bg-gradient-to-br from-[#4385E8]/10 via-[#8064E8]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-[#36C6DA]/10 via-[#8064E8]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Header */}
        <Header />

        {/* Dynamic Page View */}
        <main className="flex-1 p-6 md:p-8">
          {renderActiveView()}
        </main>

        {/* Persistent Footer Status Bar */}
        <FooterStatus />
      </div>

      {/* Global Modals & Notifications */}
      <CalibrationModal />
      <AuthModal />
      <SubscriptionModal />
      <Toast />
    </div>
  );
};

export default App;
