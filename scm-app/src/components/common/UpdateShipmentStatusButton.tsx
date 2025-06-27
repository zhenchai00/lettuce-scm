import { ClipboardCopy, Trash2 } from "lucide-react";
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

interface UpdateShipmentStatusButtonProps {
    updateMutation: () => void;
    isPending?: boolean;
    description?: string;
    tooltip?: string;
    status?: string;
}

const UpdateShipmentStatusButton = ({
    updateMutation,
    isPending,
    description,
    tooltip,
    status,
}: UpdateShipmentStatusButtonProps) => {
    return (
        <AlertDialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="icon"
                            variant="secondary"
                            className=" bg-green-500 hover:bg-green-600 text-white"
                            title={
                                tooltip ||
                                `Update Shipment Status to ${(
                                    <strong>${status}</strong>
                                )}`
                            }
                        >
                            <ClipboardCopy className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    Update Shipment Status to{" "}
                    {status ? <strong>{status}</strong> : "New Status"}
                </TooltipContent>
            </Tooltip>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ? (
                            <>
                                {description} Update to <strong>{status}</strong>
                            </>
                        ) : (
                            <>This action will update the item.</>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            updateMutation();
                        }}
                        disabled={isPending}
                    >
                        {isPending ? "Updating..." : "Confirm Update"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default UpdateShipmentStatusButton;
