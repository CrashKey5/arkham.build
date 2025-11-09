import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Redirect } from "wouter";
import { PopularDecks } from "@/components/arkhamdb-decklists/popular-decks";
import { Card } from "@/components/card/card";
import {
  SpecialistAccess,
  SpecialistInvestigators,
} from "@/components/card-modal/specialist";
import { CustomizationsEditor } from "@/components/customizations/customizations-editor";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { filterBacksides, filterPackCode } from "@/store/lib/filtering";
import { getRelatedCards } from "@/store/lib/resolve-card";
import { sortByPosition } from "@/store/lib/sorting";
import type { CardWithRelations } from "@/store/lib/types";
import type { Card as CardType } from "@/store/schemas/card.schema";
import { selectCyclesAndPacks } from "@/store/selectors/lists";
import { selectLookupTables, selectMetadata } from "@/store/selectors/shared";
import { isSpecialist } from "@/utils/card-utils";
import { formatRelationTitle } from "@/utils/formatting";
import { isEmpty } from "@/utils/is-empty";
import css from "./card-view.module.css";

type Props = {
  title: string;
  children: React.ReactNode;
  id?: string;
};

function CardViewSection(props: Props) {
  const { title, children, id } = props;

  return (
    <section className={css["view-section"]} id={id} data-testid={id}>
      <h2 className={css["view-section-title"]}>{title}</h2>
      <div className={css["view-section-cards"]}>{children}</div>
    </section>
  );
}

function ChangeIDBar(props: { currentCard: CardWithRelations }) {
  const { currentCard } = props;

  /* These are required to be able to filter a card list.*/
  const metadata = useStore(selectMetadata);
  const lookupTables = useStore(selectLookupTables);

  const allCards = Object.values(metadata.cards); /* a list of all the cards. */

  var searchCode = currentCard.card.pack_code;

  /* Confirming that the pack code is accurate to the new format. */

  const cyclesWithPacks = useStore(selectCyclesAndPacks);
  const currentPack = cyclesWithPacks.find(
    (pack) =>
      pack.code === metadata.packs[currentCard.card.pack_code].cycle_code,
  );

  if (currentPack?.reprintPacks) {
    const targetType = currentCard.card.encounter_code ? "encounter" : "player";
    const reprint = currentPack.reprintPacks.find(
      (pack) => pack.reprint?.type === targetType,
    );

    if (reprint) {
      searchCode = reprint.code;
    }
  }

  /* A filtered list of all the cards, specifically, all the cards from the same set as the current card, sorted by their "Position" (set code), b sides removed.*/
  const filteredCards = allCards
    .filter((card) =>
      filterPackCode([searchCode], metadata, lookupTables)?.(card),
    )
    .filter((card) => filterBacksides(card));
  filteredCards.sort(sortByPosition);

  /* The list index of the current card in the list. Using this, I can find the cards before and after the current card, even if there's a jump in set position. */
  const cardListIndex = filteredCards.findIndex(
    (card) => card.code === currentCard.card.code,
  );

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: "200px" }}>
        <ChangeIDButton
          shift={-1}
          cardListIndex={cardListIndex}
          filteredCards={filteredCards}
        />
      </div>
      <div style={{}}>
        <h3 style={{ textAlign: "center" }}>
          {metadata.packs[searchCode].real_name}
        </h3>
      </div>
      <div style={{ width: "200px", textAlign: "right" }}>
        <ChangeIDButton
          shift={1}
          cardListIndex={cardListIndex}
          filteredCards={filteredCards}
        />
      </div>
    </div>
  );
}

function ChangeIDButton(props: {
  shift: number;
  cardListIndex: number;
  filteredCards: CardType[];
}) {
  const { shift, cardListIndex, filteredCards } = props;

  const targetIndex = cardListIndex + shift;

  if (filteredCards[targetIndex] != null) {
    if (shift < 0) {
      return (
        <Button
          as="a"
          className={css["button"]}
          href={`/card/${filteredCards[targetIndex].code}`}
        >
          <ChevronsLeftIcon />
          {filteredCards[targetIndex].real_name}
        </Button>
      );
    }
    if (shift > 0) {
      return (
        <Button
          as="a"
          className={css["button"]}
          href={`/card/${filteredCards[targetIndex].code}`}
        >
          {filteredCards[targetIndex].real_name}
          <ChevronsRightIcon />
        </Button>
      );
    }
  }
}

export function CardViewCards({
  cardWithRelations,
}: {
  cardWithRelations: CardWithRelations;
}) {
  const canonicalCode =
    cardWithRelations.card.duplicate_of_code ??
    cardWithRelations.card.alternate_of_code;

  if (canonicalCode && !cardWithRelations.card.parallel) {
    const href = `/card/${canonicalCode}`;
    return <Redirect replace to={href} />;
  }

  const related = getRelatedCards(cardWithRelations);

  return (
    <>
      <ChangeIDBar currentCard={cardWithRelations} />
      <div data-testid="main">
        <Card resolvedCard={cardWithRelations}>
          {cardWithRelations.card.customization_options ? (
            <CustomizationsEditor card={cardWithRelations.card} />
          ) : undefined}
        </Card>
      </div>

      <PopularDecks scope={cardWithRelations.card} />

      {!isEmpty(related) &&
        related.map(([key, value]) => (
          <CardViewSection key={key} id={key} title={formatRelationTitle(key)}>
            {typeof value === "object" && !Array.isArray(value) && (
              <Card resolvedCard={value} titleLinks="card" size="compact" />
            )}
            {Array.isArray(value) &&
              value.map((c) => (
                <Card
                  canToggleBackside
                  key={c.card.code}
                  titleLinks="card"
                  resolvedCard={c}
                  size="compact"
                />
              ))}
          </CardViewSection>
        ))}

      {cardWithRelations.card.type_code === "investigator" && (
        <CardViewSection title={formatRelationTitle("specialist")}>
          <SpecialistAccess card={cardWithRelations.card} />
        </CardViewSection>
      )}
      {isSpecialist(cardWithRelations.card) && (
        <CardViewSection
          title={formatRelationTitle("specialist_investigators")}
        >
          <SpecialistInvestigators card={cardWithRelations.card} />
        </CardViewSection>
      )}
    </>
  );
}
