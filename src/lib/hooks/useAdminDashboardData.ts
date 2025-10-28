import { useState, useEffect } from "react";
import type { AdminDashboardDto } from "@/types";

const POLLING_INTERVAL = 30000; // 30 seconds

interface UseAdminDashboardDataReturn {
  data: AdminDashboardDto | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAdminDashboardData(): UseAdminDashboardDataReturn {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          throw new Error("Nie jesteś zalogowany. Zaloguj się ponownie.");
        }
        if (response.status === 403) {
          throw new Error("Nie masz uprawnień do przeglądania tej strony. Skontaktuj się z administratorem.");
        }
        if (response.status === 500) {
          throw new Error("Wystąpił błąd serwera. Spróbuj odświeżyć stronę później.");
        }
        throw new Error("Nie udało się pobrać danych dashboardu.");
      }

      const dashboardData: AdminDashboardDto = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error("Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up polling for automatic data refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, POLLING_INTERVAL);

    // Cleanup function to clear interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { data, isLoading, error };
}
