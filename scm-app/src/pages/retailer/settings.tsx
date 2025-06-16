import UserLayout from "@/components/layout/UserLayout";
import RetailerUserSettingsForm from "@/features/retailer/settings/RetailerUserSettingsForm";
import WithRole from "@/lib/auth/with-role";

const RetailerSettings = () => {
    return (
        <WithRole allowedRoles={["RETAILER"]}>
            <UserLayout title="Retailer Settings">
                <main className="p-4">
                    <RetailerUserSettingsForm />
                </main>
            </UserLayout>
        </WithRole>
    );
};
export default RetailerSettings;
