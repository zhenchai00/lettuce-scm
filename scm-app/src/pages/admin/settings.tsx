import UserLayout from "@/components/layout/UserLayout";
import UserSettingsForm from "@/features/admin/settings/UserSettingsForm";
import WithRole from "@/lib/auth/with-role";

const AdminSettings = () => {
    return (
        <WithRole allowedRoles={["ADMIN"]}>
            <UserLayout title="Admin Settings">
                <main className="p-4">
                    <UserSettingsForm />
                </main>
            </UserLayout>
        </WithRole>
    );
};
export default AdminSettings;
