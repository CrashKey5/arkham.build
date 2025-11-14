import { createSelector } from "reselect";
import { not, or } from "@/utils/fp";
import {
  filterAlternates,
  filterEncounterCards,
  filterInvestigatorAccess,
  filterInvestigatorWeaknessAccess,
} from "../lib/filtering";
import { resolveCardWithRelations } from "../lib/resolve-card";
import { makeSortFunction } from "../lib/sorting";
import type { ResolvedDeck } from "../lib/types";
import type { Card } from "../schemas/card.schema";
import type { StoreState } from "../slices";
import { selectActiveList, selectCanonicalTabooSetId } from "./lists";
import {
  selectLocaleSortingCollator,
  selectLookupTables,
  selectMetadata,
} from "./shared";

export const selectShowFanMadeRelations = createSelector(
  selectActiveList,
  (state: StoreState) => state.settings.cardListsDefaultContentType,
  (activeList, defaultContentType) => {
    if (activeList) {
      const { filters, filterValues } = activeList;

      const idx = filters.findIndex((key) => key === "fan_made_content");
      const filterValue = idx !== -1 ? filterValues[idx] : undefined;

      if (filterValue != null) return filterValue.value !== "official";
    }

    return defaultContentType !== "official";
  },
);

export const selectCardWithRelations = createSelector(
  selectMetadata,
  selectLookupTables,
  selectLocaleSortingCollator,
  (_: StoreState, code: string) => code,
  (_: StoreState, __: string, withRelations: boolean) => withRelations,
  (_: StoreState, __: string, ___, resolvedDeck: ResolvedDeck) => resolvedDeck,
  (
    state: StoreState,
    __: string,
    ___,
    resolvedDeck: ResolvedDeck | undefined,
  ) => selectCanonicalTabooSetId(state, resolvedDeck),
  (
    metadata,
    lookupTables,
    collator,
    code,
    withRelations,
    resolvedDeck,
    canonicalTabooSetId,
  ) =>
    resolveCardWithRelations(
      { metadata, lookupTables },
      collator,
      code,
      canonicalTabooSetId,
      resolvedDeck?.customizations,
      withRelations,
    ),
);

export const selectUsableByInvestigators = createSelector(
  selectLookupTables,
  selectMetadata,
  selectLocaleSortingCollator,
  (_: StoreState, card: Card) => card,
  (lookupTables, metadata, collator, card) => {
    const investigatorCodes = Object.keys(
      lookupTables.typeCode["investigator"],
    );

    const cards = investigatorCodes
      .map((code) => metadata.cards[code])
      .filter((investigator) => {
        const isValidInvestigator =
          not(filterEncounterCards)(investigator) &&
          filterAlternates(investigator);

        if (!isValidInvestigator) return false;

        const access = filterInvestigatorAccess(investigator);
        if (!access) return false;

        const weaknessAccess = filterInvestigatorWeaknessAccess(investigator);

        return or([access, weaknessAccess])(card);
      });

    const sorting = makeSortFunction(["name", "cycle"], metadata, collator);

    return cards.sort(sorting);
  },
);
