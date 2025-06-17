import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FC, useState } from "react";
import { UserRow } from "./type";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { deleteUser } from "./query";
import EditUserForm from "./EditUserForm";
import { queryClient } from "@/lib/react-query";
import { PenSquareIcon } from "lucide-react";
import DeleteButton from "@/components/common/DeleteButton";
import { format } from "date-fns";
import { toast } from "sonner";

interface UserTableProps {
    data: UserRow[];
    onUpdate: () => void;
}

const UserTable: FC<UserTableProps> = ({ data, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success("User deleted successfully.");
            onUpdate();
        },
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Updated On</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                                {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                                {format(new Date(user.updatedAt), "yyyy-MM-dd HH:mm:ss")}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    onClick={() => setEditingId(user.id)}
                                >
                                    <PenSquareIcon className="h-4 w-4" />
                                </Button>
                                <DeleteButton
                                    deleteMutation={() =>
                                        deleteMutation.mutate(user.id)
                                    }
                                    isPending={
                                        deleteMutation.status === "pending"
                                    }
                                    description="This action cannot be undone. This will permanently delete the user and all associated data."
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {editingId && (
                <EditUserForm
                    userId={editingId}
                    onSuccess={() => {
                        setEditingId(null);
                        queryClient.invalidateQueries({ queryKey: ["users"] });
                    }}
                    onCancel={() => setEditingId(null)}
                />
            )}
        </div>
    );
};

export default UserTable;
