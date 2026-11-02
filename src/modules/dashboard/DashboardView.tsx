import React from 'react';
import { HeroSection } from './HeroSection';
import { FeatureCards } from './FeatureCards';
import { RecentProjectsSection } from './RecentProjectsSection';
import { MeasurementHistorySection } from './MeasurementHistorySection';
import { QuickActionsSection } from './QuickActionsSection';
import { DemoModal } from './DemoModal';

export const DashboardView: React.FC = () => {
  return (
    <div className="w-full flex flex-col max-w-7xl mx-auto pb-10">
      {/* Hero Section */}
      <HeroSection />

      {/* 6 Main Feature Cards */}
      <FeatureCards />

      {/* Bottom 3 Columns: Recent Projects, Measurement History, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecentProjectsSection />
        <MeasurementHistorySection />
        <QuickActionsSection />
      </div>

      {/* Interactive Tour Modal */}
      <DemoModal />
    </div>
  );
};
