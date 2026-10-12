import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { translations } from './i18n/translations';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { AnatomyViewer } from './components/AnatomyViewer';
import { PhysicsLab } from './components/PhysicsLab';
import { ChemistryLab } from './components/ChemistryLab';
import { BiologyLab } from './components/BiologyLab';
import { GeologyLab } from './components/GeologyLab';
import { CarbonLab } from './components/CarbonLab';
import { ClassroomMode } from './components/ClassroomMode';
import { EgyptLocationModal } from './components/EgyptLocationModal';
import { Footer } from './components/Footer';

const CARBON_LABEL: Record<string, string> = {
  en: 'Carbon footprint', ar: 'البصمة الكربونية', fr: 'Empreinte carbone', de: 'CO₂-Fußabdruck',
};

/** Slim module switcher under the navbar. Remove it once "carbon" is added inside Navbar itself. */
const ModuleBar: React.FC<{ current: string; onSelect: (t: string) => void }> = ({ current, onSelect }) => {
  const ctx: any = useLanguage();
  const lang = (ctx?.language ?? ctx?.lang ?? 'en') as 'en' | 'ar' | 'fr' | 'de';
  const nav = translations[lang].nav;
  const items: [string, string][] = [
    ['home', nav.home], ['anatomy', nav.anatomy], ['biology', nav.biology], ['physics', nav.physics],
    ['chemistry', nav.chemistry], ['geology', nav.geology], ['carbon', CARBON_LABEL[lang] ?? CARBON_LABEL.en],
  ];
  return (
    <nav className="border-b border-[var(--line)] bg-[var(--surface)]" aria-label="Modules">
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 sm:px-6">
        {items.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-current={current === id ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
              current === id ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  if (currentTab === 'classroom') {
    return <ClassroomMode onExit={() => setCurrentTab('home')} />;
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[var(--bg)] text-[var(--text)]">
      <div>
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
        />
        <ModuleBar current={currentTab} onSelect={setCurrentTab} />

        <main className="pt-8">
          {currentTab === 'home' && <Home onNavigate={setCurrentTab} />}
          {currentTab === 'anatomy' && <AnatomyViewer />}
          {currentTab === 'physics' && <PhysicsLab />}
          {currentTab === 'chemistry' && <ChemistryLab />}
          {currentTab === 'biology' && <BiologyLab />}
          {currentTab === 'geology' && <GeologyLab />}
          {currentTab === 'carbon' && <CarbonLab />}
        </main>
      </div>

      <Footer />

      <EgyptLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
