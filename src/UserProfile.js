import { doc } from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";

export const UserProfile = props =>
{
  const docRef = doc(props.db, "users", props.uid);
  const [user] = useDocumentData(docRef);
  const record = user && user.blackjackRecord;

  return (
    <div>
      <h1>My Profile</h1>
      <p>Blackjack record: {record && record.wins} wins, {record && record.losses} losses, {record && record.ties} ties</p>
    </div>
  );
}