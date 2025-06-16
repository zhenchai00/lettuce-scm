import UserLayout from "@/components/layout/UserLayout";
import FarmerUserSettingsForm from "@/features/farmer/settings/FarmerUserSettingsForm";
import WithRole from "@/lib/auth/with-role";

const FarmerSettings = () => {
    return (
        <WithRole allowedRoles={["FARMER"]}>
            <UserLayout title="Farmer Settings">
                <main className="p-4">
                    <FarmerUserSettingsForm />
                </main>
            </UserLayout>
        </WithRole>
    );
};
export default FarmerSettings;
