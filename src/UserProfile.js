import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";

export const UserProfile = props =>
{
  const [profile] = useObjectVal(ref(props.db, `users/${props.uid}`));
  const [record] = useObjectVal(ref(props.db, `stats/blackjackSolo/${props.uid}`));

  return (
    <div>
      <h1>My Profile</h1>
      <p>Display name: {profile && profile.displayName}</p>
      <p>Blackjack record: {record && record.wins} wins, {record && record.losses} losses, {record && record.ties} ties</p>
    </div>
  );
}