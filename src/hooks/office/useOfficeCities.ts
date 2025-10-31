import { useQuery } from "@tanstack/react-query";
import { getCities, getCityById } from "@/services/office/officeService";

export function useOfficeCities() {
  return useQuery({
    queryKey: ["office_cities"],
    queryFn: getCities
  });
}

export function useOfficeCity(id: string) {
  return useQuery({
    queryKey: ["office_city", id],
    queryFn: () => getCityById(id),
    enabled: !!id
  });
}
