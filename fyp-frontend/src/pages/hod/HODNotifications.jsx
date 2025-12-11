import NotificationsPage from "../../components/NotificationsPage";
import HODLayout from "../../components/layouts/HODLayout";

const HODNotifications = () => {
  return (
    <HODLayout>
      <NotificationsPage
        role="HOD"
        accentColor="rose"
        backPath="/hod/dashboard"
      />
    </HODLayout>
  );
};

export default HODNotifications;
