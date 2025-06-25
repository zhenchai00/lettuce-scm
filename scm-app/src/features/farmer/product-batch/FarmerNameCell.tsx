import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFarmerNameQuery } from './query';

interface FarmerNameCellProps {
    farmerId: string | null;
}

const FarmerNameCell: React.FC<FarmerNameCellProps> = ({ farmerId }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['farmer', 'users', farmerId],
        queryFn: () => getFarmerNameQuery(farmerId),
    });

    if (isLoading) {
        return <span>Loading...</span>;
    }

    if (isError || !data) {
        return <span>N/A</span>;
    }

    return <span>{`${data.name} (${data.id})`}</span>;
}

export default FarmerNameCell;