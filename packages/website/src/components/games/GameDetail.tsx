import { ArrowRight, Award, Check, Lightbulb } from "lucide-react";
import Link from "next/link";
import { ACCENT_SOFT, ACCENT_TEXT, BODY, CARD, H2_DOC, PILL, WELL } from "@/design/system";
import { gamesData } from "@/services/GamesData";

interface Props {
  slug: string;
}

/**
 * A game's guide — description, how to play, tips and related games — sized for the
 * side panel beside the live game. Server-rendered, so crawlers read it with the page.
 */
const GameDetail = ({ slug }: Props) => {
  const game = gamesData[slug];
  if (!game) return <p className="text-muted">The requested game could not be found.</p>;

  return (
    <article className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-4">
        <img
          src={`/games/${game.id}.png`}
          alt={`${game.name} - ${game.category} Game`}
          width={80}
          height={80}
          loading="lazy"
          className="size-20 shrink-0 rounded-2xl border border-default object-cover shadow-md"
        />
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACCENT_SOFT}`}
            >
              {game.category}
            </span>
            <span className={PILL}>{game.difficulty}</span>
            <span className={PILL}>{game.ageRating}</span>
          </div>
          <p className={BODY}>{game.description}</p>
        </div>
      </div>

      <section>
        <h3 className={H2_DOC}>About {game.name}</h3>
        <p className={BODY}>{game.longDescription}</p>
      </section>

      <section>
        <h3 className={H2_DOC}>How to play</h3>
        <ol className={`${CARD} space-y-3 p-4`}>
          {game.howToPlay.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${ACCENT_SOFT}`}
              >
                {index + 1}
              </span>
              <span className={`pt-0.5 ${BODY}`}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className={H2_DOC}>Tips & strategies</h3>
        <ul className="space-y-2">
          {game.tips.map((tip, index) => (
            <li key={index} className={`${WELL} flex items-start gap-3 p-3`}>
              <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <span className={BODY}>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className={H2_DOC}>Features</h3>
        <ul className="space-y-2">
          {game.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span className={BODY}>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {game.benefits.length > 0 && (
        <section>
          <h3 className={H2_DOC}>Why play {game.name}?</h3>
          <ul className="space-y-2">
            {game.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <Award aria-hidden className={`mt-0.5 size-4 shrink-0 ${ACCENT_TEXT}`} />
                <span className={BODY}>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {game.tags.map((tag) => (
          <span key={tag} className={PILL}>
            #{tag}
          </span>
        ))}
      </div>

      {game.relatedGames.length > 0 && (
        <section>
          <h3 className={H2_DOC}>You might also like</h3>
          <div className="grid grid-cols-2 gap-3">
            {game.relatedGames.slice(0, 4).map((relatedId) => {
              const related = gamesData[relatedId];
              if (!related) return null;
              return (
                <Link
                  key={relatedId}
                  href={`/games/${relatedId}`}
                  className={`${CARD} group flex items-center gap-2.5 p-2 transition-colors hover:border-indigo-500/40`}
                >
                  <img
                    src={`/games/${relatedId}.png`}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {related.name}
                    </span>
                    <span className="block text-xs text-muted">{related.category}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Link
        href="/games/installation"
        className={`${CARD} group mt-8 flex items-center justify-between gap-3 p-4 transition-colors hover:border-indigo-500/40`}
      >
        <span>
          <span className="block text-sm font-semibold text-foreground">
            Add {game.name} to your app
          </span>
          <span className="block text-xs text-muted">
            Install @nayan-ui/games for React and React Native
          </span>
        </span>
        <ArrowRight aria-hidden className={`size-4 shrink-0 ${ACCENT_TEXT}`} />
      </Link>
    </article>
  );
};

export default GameDetail;
