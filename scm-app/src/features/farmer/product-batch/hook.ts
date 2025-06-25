import { useQuery } from "@tanstack/react-query";
import { FarmerDetails } from "./type";
import { getFarmerNameQuery } from "./query";

export const useGetFarmerName = async (farmerId: string | null) => {
    const {
        data,
        isLoading,
        isError,
    } = useQuery<FarmerDetails>({
        queryKey: ["farmer", "users", farmerId],
        queryFn: () => getFarmerNameQuery(farmerId),
    });

    let name = "N/A";
    if (data) {
        name = `${data.name} ${data.id}` || "N/A";
    }

    return {
        name,
        isLoading,
        isError,
    };
}