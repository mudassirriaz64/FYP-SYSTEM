import NotificationsPage from "../../components/NotificationsPage";
import SupervisorLayout from "../../components/layouts/SupervisorLayout";

const SupervisorNotifications = () => {
  return (
    <SupervisorLayout>
      <NotificationsPage
        role="Supervisor"
        accentColor="amber"
        backPath="/supervisor/dashboard"
      />
    </SupervisorLayout>
  );
};

export default SupervisorNotifications;
