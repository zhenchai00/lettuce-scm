import { Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface DeleteButtonProps {
    deleteMutation: () => void;
    isPending?: boolean;
    description?: string;
    tooltip?: string;
}

const DeleteButton = ({ deleteMutation, isPending, description, tooltip }: DeleteButtonProps) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {tooltip || "Delete Item"}
                    </TooltipContent>
                </Tooltip>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || "This action will permanently delete the item."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                        e.preventDefault();
                        deleteMutation();
                    }}
                        disabled={isPending}
                    >
                        {isPending ? "Deleting..." : "Confirm Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteButton;
