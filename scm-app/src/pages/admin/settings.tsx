import UserLayout from "@/components/layout/UserLayout";
import UserSettingsForm from "@/features/admin/settings/UserSettingsForm";
import WithRolePage from "@/lib/auth/with-role-page";

const AdminSettings = () => {
    return (
        <WithRolePage allowedRoles={["ADMIN"]}>
            <UserLayout title="Admin Settings">
                <main className="p-4">
                    <UserSettingsForm />
                </main>
            </UserLayout>
        </WithRolePage>
    );
};
export default AdminSettings;
