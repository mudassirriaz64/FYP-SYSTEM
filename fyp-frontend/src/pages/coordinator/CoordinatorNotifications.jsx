import NotificationsPage from "../../components/NotificationsPage";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const CoordinatorNotifications = () => {
  return (
    <CoordinatorLayout>
      <NotificationsPage
        role="Coordinator"
        accentColor="teal"
        backPath="/coordinator/dashboard"
      />
    </CoordinatorLayout>
  );
};

export default CoordinatorNotifications;
