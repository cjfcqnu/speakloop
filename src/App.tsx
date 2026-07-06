import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { EmptyState } from "./components/EmptyState";
import { Dashboard } from "./pages/Dashboard";
import { FavoritesPage } from "./pages/Favorites";
import { ImportPage } from "./pages/Import";
import { MaterialsPage } from "./pages/Materials";
import { MistakesPage } from "./pages/Mistakes";
import { PracticePage } from "./pages/Practice";
import { RecapPage } from "./pages/Recap";
import { RecordDetailPage } from "./pages/RecordDetail";
import { ReviewPage } from "./pages/Review";
import { SettingsPage } from "./pages/Settings";
import { StatisticsPage } from "./pages/Statistics";
import { getBrowserCapabilities } from "./lib/capabilities";
import { useAppData } from "./hooks/useAppData";

function readHashPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash ? decodeURIComponent(hash) : "/";
}

function useHashRoute() {
  const [path, setPath] = useState(readHashPath);

  useEffect(() => {
    const onHashChange = () => setPath(readHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextPath: string) => {
    window.location.hash = nextPath;
  };

  return { path, navigate };
}

export default function App() {
  const route = useHashRoute();
  const data = useAppData();
  const capabilities = useMemo(() => getBrowserCapabilities(), []);
  const [basePath, firstParam] = useMemo(() => {
    const parts = route.path.split("/").filter(Boolean);
    return [`/${parts[0] ?? ""}`.replace(/\/$/, "") || "/", parts[1]];
  }, [route.path]);

  let page = null;

  if (data.isLoading) {
    page = <EmptyState title="正在加载 SpeakLoop" text="正在读取本地素材和练习记录。" />;
  } else if (data.error) {
    page = <EmptyState title="读取失败" text={data.error} />;
  } else if (basePath === "/") {
    page = (
      <Dashboard
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        dailyReviews={data.dailyReviews}
        navigate={route.navigate}
        toggleFavorite={data.toggleFavorite}
      />
    );
  } else if (basePath === "/materials") {
    page = (
      <MaterialsPage
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        navigate={route.navigate}
        toggleFavorite={data.toggleFavorite}
      />
    );
  } else if (basePath === "/import") {
    page = <ImportPage saveMaterials={data.saveMaterials} navigate={route.navigate} />;
  } else if (basePath === "/practice") {
    page = (
      <PracticePage
        materialId={firstParam}
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        appSettings={data.appSettings}
        navigate={route.navigate}
        savePractice={data.savePractice}
      />
    );
  } else if (basePath === "/favorites") {
    page = (
      <FavoritesPage
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        navigate={route.navigate}
        toggleFavorite={data.toggleFavorite}
      />
    );
  } else if (basePath === "/mistakes") {
    page = (
      <MistakesPage
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        navigate={route.navigate}
        dismissMistake={data.dismissMistake}
      />
    );
  } else if (basePath === "/review") {
    page = (
      <ReviewPage
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        navigate={route.navigate}
        toggleFavorite={data.toggleFavorite}
      />
    );
  } else if (basePath === "/recap") {
    page = (
      <RecapPage
        date={firstParam}
        dailyReviews={data.dailyReviews}
        materials={data.materials}
        navigate={route.navigate}
        markDailyReviewViewed={data.markDailyReviewViewed}
      />
    );
  } else if (basePath === "/records") {
    page = (
      <RecordDetailPage
        recordId={firstParam}
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        navigate={route.navigate}
        getAudioBlob={data.getAudioBlob}
        deletePracticeRecord={data.deletePracticeRecord}
      />
    );
  } else if (basePath === "/statistics") {
    page = <StatisticsPage materials={data.materials} practiceRecords={data.practiceRecords} />;
  } else if (basePath === "/settings") {
    page = (
      <SettingsPage
        capabilities={capabilities}
        materials={data.materials}
        practiceRecords={data.practiceRecords}
        reviewSchedules={data.reviewSchedules}
        dailyReviews={data.dailyReviews}
        appSettings={data.appSettings}
        updatePracticeSettings={data.updatePracticeSettings}
        importSeedMaterials={data.importSeedMaterials}
      />
    );
  } else {
    page = <EmptyState title="页面不存在" text="请从底部导航回到首页。" />;
  }

  return (
    <AppShell route={basePath} navigate={route.navigate}>
      {page}
    </AppShell>
  );
}
