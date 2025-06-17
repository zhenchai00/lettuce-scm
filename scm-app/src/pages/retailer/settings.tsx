import UserLayout from "@/components/layout/UserLayout";
import RetailerUserSettingsForm from "@/features/retailer/settings/RetailerUserSettingsForm";
import WithRolePage from "@/lib/auth/with-role-page";

const RetailerSettings = () => {
    return (
        <WithRolePage allowedRoles={["RETAILER"]}>
            <UserLayout title="Retailer Settings">
                <main className="p-4">
                    <RetailerUserSettingsForm />
                </main>
            </UserLayout>
        </WithRolePage>
    );
};
export default RetailerSettings;
