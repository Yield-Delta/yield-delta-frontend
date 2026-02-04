import Navigation from '@/components/Navigation';
import DemoBanner from '@/components/DemoBanner';
import VerticalRays from '@/components/VerticalRays';
import HeroSection from '@/components/sections/HeroSection';
import VaultShowcase from '@/components/sections/VaultShowcase';
import FeatureHighlight from '@/components/sections/FeatureHighlight';
import IntegrationCarousel from '@/components/sections/IntegrationCarousel';
import AIWorkflow from '@/components/AIWorkflow';
import PerformanceMetrics from '@/components/sections/PerformanceMetrics';
import CTASection from '@/components/sections/CTASection';

export default function DLPLanding() {

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden mobile-safe-padding">
            <Navigation variant="transparent" showWallet={false} showLaunchApp={true} />
            <DemoBanner />
            <VerticalRays className="top-0 left-0 right-0" style={{ pointerEvents: 'none' }} />
            <div id="hero" className="mobile-section-spacing">
                <HeroSection />
            </div>
            <div id="vaults" className="mobile-section-spacing">
                <VaultShowcase />
            </div>
            <div id="features" className="mobile-section-spacing">
                <FeatureHighlight />
            </div>
            <div id="integrations" className="mobile-section-spacing">
                <IntegrationCarousel />
            </div>
            <div id="ai-workflow" className="mobile-section-spacing">
                <AIWorkflow />
            </div>
            <div id="performance" className="mobile-section-spacing">
                <PerformanceMetrics />
            </div>
            <div id="get-started" className="mobile-section-spacing">
                <CTASection />
            </div>
        </div>
    );
}