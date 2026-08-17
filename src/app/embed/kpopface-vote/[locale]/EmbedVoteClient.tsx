/**
 * Legacy import compatibility. Existing callers keep their URL while the
 * canonical VoteBoard receives the Kpopface surface adapter by default.
 */
import VoteBoardEmbedClient from '../../vote-board/[locale]/VoteBoardEmbedClient';

export default function EmbedVoteClient({ locale }: { locale: string }) {
  return <VoteBoardEmbedClient locale={locale} surfaceOverride="kpopface" />;
}
