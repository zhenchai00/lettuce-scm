import UserLayout from "@/components/layout/UserLayout";
import FarmerUserSettingsForm from "@/features/farmer/settings/FarmerUserSettingsForm";
import WithRolePage from "@/lib/auth/with-role-page";

const FarmerSettings = () => {
    return (
        <WithRolePage allowedRoles={["FARMER"]}>
            <UserLayout title="Farmer Settings">
                <main className="p-4">
                    <FarmerUserSettingsForm />
                </main>
            </UserLayout>
        </WithRolePage>
    );
};
export default FarmerSettings;
