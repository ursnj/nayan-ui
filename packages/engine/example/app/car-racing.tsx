import { Racing } from "../games/racing/Racing";

// Playtura's optional side buttons switched on: the built-in session leaderboard and the system share
// sheet (pass functions instead to handle them yourself).
export default function CarRacingScreen() {
  return <Racing leaderboard share />;
}
