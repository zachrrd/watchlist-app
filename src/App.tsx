import { useState, useEffect } from 'react';
import type { Series, Episode } from './types';
import Navbar, { type NavCategory } from './components/Navbar';
import Watchlist from './components/WatchList';
import AddShow from './components/AddShow';
import ShowDetail from './components/ShowDetail';
import EditShow from './components/EditShow';
import { initialDummySeries, initialDummyEpisodes } from './data/initialData';

export default function App() {
  // --- STATE DATA ---
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const saved = localStorage.getItem('series');
    return saved ? JSON.parse(saved) : initialDummySeries;
  });

  const [episodeList, setEpisodeList] = useState<Episode[]>(() => {
    const saved = localStorage.getItem('episodes');
    return saved ? JSON.parse(saved) : initialDummyEpisodes;
  });

  // --- STATE VIEW & NAVIGATION ---
  const [currentView, setCurrentView] = useState<'watchlist' | 'add' | 'detail' | 'edit'>('watchlist');
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<NavCategory>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // --- LOCAL STORAGE SYNC ---
  useEffect(() => {
    localStorage.setItem('series', JSON.stringify(seriesList));
  }, [seriesList]);

  useEffect(() => {
    localStorage.setItem('episodes', JSON.stringify(episodeList));
  }, [episodeList]);

  // --- HASH ROUTING SYNC ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'add') {
        setCurrentView('add');
      } else if (hash.startsWith('detail-')) {
        setCurrentView('detail');
        setSelectedSeriesId(Number(hash.split('-')[1]));
      } else if (hash.startsWith('edit-')) {
        setCurrentView('edit');
        setSelectedSeriesId(Number(hash.split('-')[1]));
      } else if (hash === 'movies') {
        setCurrentView('watchlist');
        setActiveCategory('movies');
        setSelectedSeriesId(null);
      } else if (hash === 'series') {
        setCurrentView('watchlist');
        setActiveCategory('series');
        setSelectedSeriesId(null);
      } else if (hash === 'anime') {
        setCurrentView('watchlist');
        setActiveCategory('anime');
        setSelectedSeriesId(null);
      } else if (hash === 'watchlist') {
        setCurrentView('watchlist');
        setActiveCategory('watchlist');
        setSelectedSeriesId(null);
      } else {
        setCurrentView('watchlist');
        setActiveCategory('home');
        setSelectedSeriesId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- FUNGSI NAVIGASI ---
  const goToAddShow = () => {
    window.location.hash = 'add';
  };
  
  const goToWatchlist = () => { 
    if (activeCategory === 'home') {
      window.location.hash = ''; 
      window.history.replaceState(null, '', ' ');
    } else {
      window.location.hash = activeCategory;
    }
  };
  
  const goToShowDetail = (id: number) => {
    window.location.hash = `detail-${id}`;
  };

  const goToEditShow = () => {
    if (selectedSeriesId) {
      window.location.hash = `edit-${selectedSeriesId}`;
    }
  };

  const goToEditShowWithId = (id: number) => {
    setSelectedSeriesId(id);
    window.location.hash = `edit-${id}`;
  };

  const handleDeleteShow = (id: number) => {
    const show = seriesList.find((s) => s.id === id);
    if (window.confirm(`Are you sure you want to delete "${show?.title || 'this title'}" and all its episodes?`)) {
      setSeriesList(seriesList.filter((s) => s.id !== id));
      setEpisodeList(episodeList.filter((ep) => ep.seriesId !== id));
    }
  };

  const handleSelectCategory = (category: NavCategory) => {
    setActiveCategory(category);
    if (category === 'home') {
      window.location.hash = '';
      window.history.replaceState(null, '', ' ');
    } else {
      window.location.hash = category;
    }
  };

  const watchlistCount = seriesList.filter(
    (s) => s.status === 'Watching' || s.status === 'Plan to Watch'
  ).length;

  // --- RENDER COMPONENT ---
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Sticky Global Navbar */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={goToAddShow}
        watchlistCount={watchlistCount}
      />

      {/* Main Content Area */}
      <main className="flex-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {(currentView === 'watchlist' || currentView === 'add') && (
          <Watchlist
            seriesList={seriesList}
            episodeList={episodeList}
            onAddClick={goToAddShow}
            onSeriesClick={goToShowDetail}
            onEditShow={goToEditShowWithId}
            onDeleteShow={handleDeleteShow}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        
        {currentView === 'add' && (
          <AddShow
            seriesList={seriesList}
            setSeriesList={setSeriesList}
            onCancel={goToWatchlist}
          />
        )}
        
        {(currentView === 'detail' || currentView === 'edit') && selectedSeriesId && (
          <ShowDetail
            seriesId={selectedSeriesId} 
            seriesList={seriesList}
            setSeriesList={setSeriesList}
            episodeList={episodeList} 
            setEpisodeList={setEpisodeList} 
            onBack={goToWatchlist}
            onEdit={goToEditShow}
          />
        )}
        
        {currentView === 'edit' && selectedSeriesId && (
          <EditShow
            seriesId={selectedSeriesId} 
            seriesList={seriesList}
            setSeriesList={setSeriesList} 
            onCancel={() => goToShowDetail(selectedSeriesId)}
          />
        )}

      </main>
    </div>
  );
}
