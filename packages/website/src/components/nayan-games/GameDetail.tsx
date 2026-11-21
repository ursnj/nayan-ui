import { NImage, NText, NView } from 'nayan-ui/components';
import { ArrowRight, Award, Check, Lightbulb } from "@/design/Icons";
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
  if (!game) return <NText tag="p" className="text-muted">The requested game could not be found.</NText>;

  return (
    <NView tag="article" className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <NView tag="div" className="flex items-start gap-4">
        <NImage
          src={`/games/${game.id}.png`}
          alt={`${game.name} - ${game.category} Game`}
          width={80}
          height={80}
          loading="lazy"
          className="size-20 shrink-0 rounded-2xl border border-default object-cover shadow-md"
        />
        <NView tag="div" className="min-w-0">
          <NView tag="div" className="mb-2 flex flex-wrap gap-1.5">
            <NText tag="span"
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACCENT_SOFT}`}
            >
              {game.category}
            </NText>
            <NText tag="span" className={PILL}>{game.difficulty}</NText>
            <NText tag="span" className={PILL}>{game.ageRating}</NText>
          </NView>
          <NText tag="p" className={BODY}>{game.description}</NText>
        </NView>
      </NView>

      <NView tag="section">
        <NText tag="h3" className={H2_DOC}>About {game.name}</NText>
        <NText tag="p" className={BODY}>{game.longDescription}</NText>
      </NView>

      <NView tag="section">
        <NText tag="h3" className={H2_DOC}>How to play</NText>
        <NView tag="ol" className={`${CARD} space-y-3 p-4`}>
          {game.howToPlay.map((step, index) => (
            <NView tag="li" key={index} className="flex gap-3">
              <NText tag="span"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${ACCENT_SOFT}`}
              >
                {index + 1}
              </NText>
              <NText tag="span" className={`pt-0.5 ${BODY}`}>{step}</NText>
            </NView>
          ))}
        </NView>
      </NView>

      <NView tag="section">
        <NText tag="h3" className={H2_DOC}>Tips & strategies</NText>
        <NView tag="ul" className="space-y-2">
          {game.tips.map((tip, index) => (
            <NView tag="li" key={index} className={`${WELL} flex items-start gap-3 p-3`}>
              <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <NText tag="span" className={BODY}>{tip}</NText>
            </NView>
          ))}
        </NView>
      </NView>

      <NView tag="section">
        <NText tag="h3" className={H2_DOC}>Features</NText>
        <NView tag="ul" className="space-y-2">
          {game.features.map((feature, index) => (
            <NView tag="li" key={index} className="flex items-start gap-3">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <NText tag="span" className={BODY}>{feature}</NText>
            </NView>
          ))}
        </NView>
      </NView>

      {game.benefits.length > 0 && (
        <NView tag="section">
          <NText tag="h3" className={H2_DOC}>Why play {game.name}?</NText>
          <NView tag="ul" className="space-y-2">
            {game.benefits.map((benefit, index) => (
              <NView tag="li" key={index} className="flex items-start gap-3">
                <Award aria-hidden className={`mt-0.5 size-4 shrink-0 ${ACCENT_TEXT}`} />
                <NText tag="span" className={BODY}>{benefit}</NText>
              </NView>
            ))}
          </NView>
        </NView>
      )}

      <NView tag="div" className="mt-6 flex flex-wrap gap-1.5">
        {game.tags.map((tag) => (
          <NText tag="span" key={tag} className={PILL}>
            #{tag}
          </NText>
        ))}
      </NView>

      {game.relatedGames.length > 0 && (
        <NView tag="section">
          <NText tag="h3" className={H2_DOC}>You might also like</NText>
          <NView tag="div" className="grid grid-cols-2 gap-3">
            {game.relatedGames.slice(0, 4).map((relatedId) => {
              const related = gamesData[relatedId];
              if (!related) return null;
              return (
                <Link
                  key={relatedId}
                  href={`/games/${relatedId}`}
                  className={`${CARD} group flex items-center gap-2.5 p-2 transition-colors hover:border-indigo-500/40`}
                >
                  <NImage
                    src={`/games/${relatedId}.png`}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                  <NText tag="span" className="min-w-0">
                    <NText tag="span" className="block truncate text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {related.name}
                    </NText>
                    <NText tag="span" className="block text-xs text-muted">{related.category}</NText>
                  </NText>
                </Link>
              );
            })}
          </NView>
        </NView>
      )}

      <Link
        href="/games/installation"
        className={`${CARD} group mt-8 flex items-center justify-between gap-3 p-4 transition-colors hover:border-indigo-500/40`}
      >
        <NText tag="span">
          <NText tag="span" className="block text-sm font-semibold text-foreground">
            Add {game.name} to your app
          </NText>
          <NText tag="span" className="block text-xs text-muted">
            Install @nayan-ui/games for React and React Native
          </NText>
        </NText>
        <ArrowRight aria-hidden className={`size-4 shrink-0 ${ACCENT_TEXT}`} />
      </Link>
    </NView>
  );
};

export default GameDetail;
