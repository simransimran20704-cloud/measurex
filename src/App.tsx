import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FooterStatus } from './components/layout/FooterStatus';
import { Toast } from './components/common/Toast';
import { CalibrationModal } from './modules/calibration/CalibrationModal';
import { AuthModal } from './components/auth/AuthModal';

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
import { DigitalProtractorView } from './modules/scientific-instruments/DigitalProtractorView';
import { DigitalScaleView } from './modules/scientific-instruments/DigitalScaleView';
import { ThreadPitchGaugeView } from './modules/scientific-instruments/ThreadPitchGaugeView';
import { FeelerGaugeView } from './modules/scientific-instruments/FeelerGaugeView';
import { SpiritLevelView } from './modules/scientific-instruments/SpiritLevelView';
import { PcdGeneratorView } from './modules/scientific-instruments/PcdGeneratorView';
import { LimitsFitsView } from './modules/scientific-instruments/LimitsFitsView';
import { MaterialEstimatorView } from './modules/scientific-instruments/MaterialEstimatorView';
import { SpherometerView } from './modules/scientific-instruments/SpherometerView';
import { MetrologyQuizView } from './modules/scientific-instruments/MetrologyQuizView';
import { UnitConverterView } from './modules/unit-converter/UnitConverterView';
import { CalibrationView } from './modules/calibration/CalibrationView';
import { ProjectsView } from './modules/projects/ProjectsView';
import { HistoryView } from './modules/history/HistoryView';
import { ExportCenterView } from './modules/export/ExportCenterView';
import { ImageMeasurementView } from './modules/image-measurement/ImageMeasurementView';
import { HelpGuideView } from './modules/help/HelpGuideView';

export const App: React.FC = () => {
  const { activeTab } = useAppStore();
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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
      case 'digital-protractor':
        return <DigitalProtractorView />;
      case 'digital-scale':
        return <DigitalScaleView />;
      case 'thread-pitch-gauge':
        return <ThreadPitchGaugeView />;
      case 'feeler-gauge':
        return <FeelerGaugeView />;
      case 'spirit-level':
        return <SpiritLevelView />;
      case 'pcd-generator':
        return <PcdGeneratorView />;
      case 'limits-fits':
        return <LimitsFitsView />;
      case 'material-estimator':
        return <MaterialEstimatorView />;
      case 'spherometer':
        return <SpherometerView />;
      case 'metrology-quiz':
        return <MetrologyQuizView />;
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
      <div className="fixed top-0 left-0 lg:left-64 w-[600px] max-w-full h-[500px] bg-gradient-to-br from-[#4385E8]/10 via-[#8064E8]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] max-w-full h-[400px] bg-gradient-to-tl from-[#36C6DA]/10 via-[#8064E8]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Sticky Header */}
        <Header />

        {/* Dynamic Page View */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>

        {/* Persistent Footer Status Bar */}
        <FooterStatus />
      </div>

      {/* Global Modals & Notifications */}
      <CalibrationModal />
      <AuthModal />
      <Toast />
    </div>
  );
};

export default App;
