import { useState, useEffect } from "react";
import { neon } from "./lib/neon";
import type { Series, Episode } from "./types";
import Navbar, { type NavCategory } from "./components/Navbar";
import Watchlist from "./components/WatchList";
import AddShow from "./components/AddShow";
import ShowDetail from "./components/ShowDetail";
import EditShow from "./components/EditShow";
import AuthForm from "./components/AuthForm";
import ConfirmDialog from "./components/ConfirmDialog";
import { getShows, getAllEpisodes, deleteShow } from "./services";

interface AuthenticatedAppProps {
  userId: string;
}

function AuthenticatedApp({ userId }: AuthenticatedAppProps) {
  // --- STATE DATA (Phase 3A: Scoped strictly to authenticated userId) ---
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [episodeList, setEpisodeList] = useState<Episode[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- STATE VIEW & NAVIGATION ---
  const [currentView, setCurrentView] = useState<
    "watchlist" | "add" | "detail" | "edit"
  >("watchlist");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NavCategory>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  const [isDeletingShow, setIsDeletingShow] = useState(false);
  const [deleteShowError, setDeleteShowError] = useState<string | null>(null);

  // --- FETCH DATA FROM NEON ---
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [shows, episodes] = await Promise.all([
          getShows(userId),
          getAllEpisodes(),
        ]);

        if (isMounted) {
          setSeriesList(shows);
          setEpisodeList(episodes);
          setDataError(null);
          setIsLoadingData(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load data from Neon:", err);
          setDataError(
            err instanceof Error ? err.message : "Failed to load watchlist data.",
          );
          setIsLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // --- HASH ROUTING SYNC ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");

      if (hash === "add") {
        setCurrentView("add");
      } else if (hash.startsWith("detail-")) {
        setCurrentView("detail");
        const id = hash.slice("detail-".length);
        setSelectedSeriesId(id);
      } else if (hash.startsWith("edit-")) {
        setCurrentView("edit");
        const id = hash.slice("edit-".length);
        setSelectedSeriesId(id);
      } else if (hash === "movies") {
        setCurrentView("watchlist");
        setActiveCategory("movies");
        setSelectedSeriesId(null);
      } else if (hash === "series") {
        setCurrentView("watchlist");
        setActiveCategory("series");
        setSelectedSeriesId(null);
      } else if (hash === "anime") {
        setCurrentView("watchlist");
        setActiveCategory("anime");
        setSelectedSeriesId(null);
      } else if (hash === "watchlist") {
        setCurrentView("watchlist");
        setActiveCategory("watchlist");
        setSelectedSeriesId(null);
      } else {
        setCurrentView("watchlist");
        setActiveCategory("home");
        setSelectedSeriesId(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);


  const handleSignOut = async () => {
    try {
      await neon.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // --- FUNGSI NAVIGASI ---
  const goToAddShow = () => {
    window.location.hash = "add";
  };

  const goToWatchlist = () => {
    if (activeCategory === "home") {
      window.location.hash = "";
      window.history.replaceState(null, "", " ");
    } else {
      window.location.hash = activeCategory;
    }
  };

  const goToShowDetail = (id: string) => {
    window.location.hash = `detail-${id}`;
  };

  const goToEditShow = () => {
    if (selectedSeriesId) {
      window.location.hash = `edit-${selectedSeriesId}`;
    }
  };

  const goToEditShowWithId = (id: string) => {
    setSelectedSeriesId(id);
    window.location.hash = `edit-${id}`;
  };

  const handleDeleteShow = (id: string) => {
    const show = seriesList.find((s) => s.id === id) || null;
    if (!show) return;
    setDeleteShowError(null);
    setDeleteTarget(show);
  };

  const confirmDeleteShow = async () => {
    if (!deleteTarget) return;
    setIsDeletingShow(true);
    setDeleteShowError(null);
    try {
      // Safe delete via RPC (AFTER DELETE trigger automatically records orphaned files into outbox)
      await deleteShow(deleteTarget.id);

      setSeriesList(seriesList.filter((s) => s.id !== deleteTarget.id));
      setEpisodeList(episodeList.filter((ep) => ep.seriesId !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete show from Neon:", err);
      setDeleteShowError(
        err instanceof Error ? err.message : "Failed to delete this title. Please try again.",
      );
    } finally {
      setIsDeletingShow(false);
    }
  };

  const handleSelectCategory = (category: NavCategory) => {
    setActiveCategory(category);
    if (category === "home") {
      window.location.hash = "";
      window.history.replaceState(null, "", " ");
    } else {
      window.location.hash = category;
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
          <span className="text-xs text-zinc-400">Loading your watchlist...</span>
        </div>
      </div>
    );
  }

  const watchlistCount = seriesList.filter(
    (s) => s.status === "Watching" || s.status === "Plan to Watch",
  ).length;

  // --- RENDER COMPONENT ---
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sticky Global Navbar */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={goToAddShow}
        watchlistCount={watchlistCount}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {dataError && (
          <div className="mb-6 rounded-xl border border-red-500/25 bg-red-950/35 p-4 text-sm text-red-200">
            <p className="font-medium">Error loading data from database</p>
            <p className="mt-1 text-xs text-red-200/80">{dataError}</p>
          </div>
        )}

        {(currentView === "watchlist" || currentView === "add") && (
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

        {currentView === "add" && (
          <AddShow
            userId={userId}
            seriesList={seriesList}
            setSeriesList={setSeriesList}
            onCancel={goToWatchlist}
          />
        )}

        {(currentView === "detail" || currentView === "edit") &&
          selectedSeriesId && (
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

        {currentView === "edit" && selectedSeriesId && (
          <EditShow
            seriesId={selectedSeriesId}
            seriesList={seriesList}
            setSeriesList={setSeriesList}
            onCancel={() => goToShowDetail(selectedSeriesId)}
          />
        )}
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteShowError(null);
          }
        }}
        title={`Delete "${deleteTarget?.title || "this title"}"?`}
        description="This will permanently remove the title and all of its tracked episodes from your watchlist. This action cannot be undone."
        confirmLabel="Delete Title"
        isLoading={isDeletingShow}
        error={deleteShowError}
        onConfirm={confirmDeleteShow}
      />
    </div>
  );
}

export default function App() {
  const { data: session, isPending } = neon.auth.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
          <span className="text-xs text-zinc-400">Loading Watchlist...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return <AuthenticatedApp key={session.user.id} userId={session.user.id} />;
}
