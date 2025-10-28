import { useAdminDashboardData } from "@/lib/hooks/useAdminDashboardData";
import { KpiCard } from "@/components/admin/KpiCard";
import { PopularClassesChart } from "@/components/admin/PopularClassesChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminDashboardView() {
  const { data, isLoading, error } = useAdminDashboardData();

  // Loading state - show skeleton loaders
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
          <p className="text-muted-foreground">Przegląd kluczowych wskaźników wydajności klubu</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* KPI Cards Skeletons */}
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[120px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[80px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - show error message
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
          <p className="text-muted-foreground">Przegląd kluczowych wskaźników wydajności klubu</p>
        </div>

        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Wystąpił błąd</h3>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state - should not happen but handle it gracefully
  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
          <p className="text-muted-foreground">Przegląd kluczowych wskaźników wydajności klubu</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Brak danych do wyświetlenia</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - show dashboard with data
  // Format the data for display
  const occupancyRate = `${Math.round(data.today_occupancy_rate * 100)}%`;
  const waitingListCount = data.total_waiting_list_count.toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
        <p className="text-muted-foreground">Przegląd kluczowych wskaźników wydajności klubu</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          title="Zapełnienie dzisiaj"
          value={occupancyRate}
          description="Procent zapełnienia zajęć na dziś"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <KpiCard
          title="Lista oczekujących"
          value={waitingListCount}
          description="Łączna liczba osób na listach oczekujących"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          }
        />
      </div>

      {/* Popular Classes Chart */}
      <PopularClassesChart data={data.most_popular_classes} />
    </div>
  );
}
