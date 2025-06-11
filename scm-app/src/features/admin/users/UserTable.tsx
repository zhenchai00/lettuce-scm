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
import { PenSquareIcon, Trash2 } from "lucide-react";

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
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
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
                                {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                {new Date(user.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    onClick={() => setEditingId(user.id)}
                                >
                                    <PenSquareIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() =>
                                        deleteMutation.mutate(user.id)
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
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
