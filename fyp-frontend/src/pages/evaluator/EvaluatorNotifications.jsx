import NotificationsPage from "../../components/NotificationsPage";
import EvaluatorLayout from "../../components/layouts/EvaluatorLayout";

const EvaluatorNotifications = () => {
  return (
    <EvaluatorLayout>
      <NotificationsPage
        role="Evaluator"
        accentColor="slate"
        backPath="/evaluator/dashboard"
      />
    </EvaluatorLayout>
  );
};

export default EvaluatorNotifications;
