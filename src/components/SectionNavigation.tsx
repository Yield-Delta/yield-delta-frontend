'use client';

import { useState, useEffect } from 'react';

const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'features', label: 'Features' },
  { id: 'ai-workflow', label: 'AI Workflow' },
  { id: 'performance', label: 'Performance' },
  { id: 'get-started', label: 'Get Started' }
];

export default function SectionNavigation() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        setIsVisible(window.scrollY > heroBottom - 100);
      }

      // Update active section based on scroll position
      const currentSection = sections.find(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <nav className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-lg">
      <div className="flex space-x-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}