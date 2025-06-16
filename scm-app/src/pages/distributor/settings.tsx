import UserLayout from "@/components/layout/UserLayout";
import DistributorUserSettingsForm from "@/features/distributor/settings/DistributorUserSettingsForm";
import WithRole from "@/lib/auth/with-role";

const DistributorSettings = () => {
    return (
        <WithRole allowedRoles={["DISTRIBUTOR"]}>
            <UserLayout title="Distributor Settings">
                <main className="p-4">
                    <DistributorUserSettingsForm />
                </main>
            </UserLayout>
        </WithRole>
    );
};
export default DistributorSettings;
