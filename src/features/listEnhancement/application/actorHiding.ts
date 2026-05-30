import type { ActorRecord } from '../../../types';

export type ActorHidingReason = 'ACTOR_BLACKLIST' | 'ACTOR_NOT_FAVORITED';

export interface ActorHidingDecisionInput {
  hideByBlacklist: boolean;
  hideByNonFavorited: boolean;
  hideUnrecognized: boolean;
  treatSubscribedAsFavorited: boolean;
  domActorIds: Set<string>;
  actors: ActorRecord[];
  subscribedActorIds: Set<string>;
}

export interface ActorHidingDecision {
  reason: ActorHidingReason | null;
  matchedBlack: boolean;
  matchedNonFavorited: boolean;
  hasAnyFavoritedActor: boolean | null;
}

export function decideActorHiding(input: ActorHidingDecisionInput): ActorHidingDecision {
  const matchedBlack = input.hideByBlacklist && input.actors.some(actor => !!actor.blacklisted);
  const matchedNonFavorited = input.hideByNonFavorited
    ? isNonFavoritedMatch(input)
    : false;

  return {
    reason: matchedBlack
      ? 'ACTOR_BLACKLIST'
      : matchedNonFavorited
        ? 'ACTOR_NOT_FAVORITED'
        : null,
    matchedBlack,
    matchedNonFavorited,
    hasAnyFavoritedActor: input.hideByNonFavorited && input.actors.length > 0
      ? hasAnyFavoritedActor(input.actors, input.treatSubscribedAsFavorited, input.subscribedActorIds)
      : null,
  };
}

function isNonFavoritedMatch(input: ActorHidingDecisionInput): boolean {
  if (input.domActorIds.size > 0 && input.actors.length === 0) {
    return true;
  }

  if (input.actors.length > 0) {
    return !hasAnyFavoritedActor(input.actors, input.treatSubscribedAsFavorited, input.subscribedActorIds);
  }

  return input.hideUnrecognized;
}

function hasAnyFavoritedActor(
  actors: ActorRecord[],
  treatSubscribedAsFavorited: boolean,
  subscribedActorIds: Set<string>,
): boolean {
  return actors.some(actor => {
    if (actor.blacklisted) {
      return false;
    }

    const isFavorited = true;
    const isSubscribed = treatSubscribedAsFavorited && subscribedActorIds.has(actor.id);
    return isFavorited || isSubscribed;
  });
}
