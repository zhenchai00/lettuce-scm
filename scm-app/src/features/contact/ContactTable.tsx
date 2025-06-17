import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FC } from "react";
import { format } from "date-fns";

interface ContactTableProps {
    data: any[];
}

const ContactTable: FC<ContactTableProps> = ({ data }) => {
    return (
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Created At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((contact) => (
                    <TableRow key={contact.id}>
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.message}</TableCell>
                        <TableCell>{format(new Date(contact.createdAt), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default ContactTable;
