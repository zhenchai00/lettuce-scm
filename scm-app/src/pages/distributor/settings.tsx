import UserLayout from "@/components/layout/UserLayout";
import DistributorUserSettingsForm from "@/features/distributor/settings/DistributorUserSettingsForm";
import WithRolePage from "@/lib/auth/with-role-page";

const DistributorSettings = () => {
    return (
        <WithRolePage allowedRoles={["DISTRIBUTOR"]}>
            <UserLayout title="Distributor Settings">
                <main className="p-4">
                    <DistributorUserSettingsForm />
                </main>
            </UserLayout>
        </WithRolePage>
    );
};
export default DistributorSettings;
