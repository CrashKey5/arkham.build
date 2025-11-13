import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Redirect } from "wouter";
import { PopularDecks } from "@/components/arkhamdb-decklists/popular-decks";
import { Card } from "@/components/card/card";
import {
  SpecialistAccess,
  SpecialistInvestigators,
} from "@/components/card-modal/specialist";
import { CustomizationsEditor } from "@/components/customizations/customizations-editor";
import PackIcon from "@/components/icons/pack-icon";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { filterBacksides, filterPackCode } from "@/store/lib/filtering";
import { getRelatedCards } from "@/store/lib/resolve-card";
import { sortByPosition } from "@/store/lib/sorting";
import type { CardWithRelations } from "@/store/lib/types";
import type { Card as CardType } from "@/store/schemas/card.schema";
import { selectCyclesAndPacks } from "@/store/selectors/lists";
import { selectLookupTables, selectMetadata } from "@/store/selectors/shared";
import { displayAttribute, isSpecialist } from "@/utils/card-utils";
import { displayPackName, formatRelationTitle } from "@/utils/formatting";
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

function CardSetNav(props: { currentCard: CardWithRelations }) {
  const { currentCard } = props;

  const metadata = useStore(selectMetadata);
  const lookupTables = useStore(selectLookupTables);

  const allCards = Object.values(metadata.cards);

  let searchCode = currentCard.card.pack_code;

  const cyclesWithPacks = useStore(selectCyclesAndPacks);
  const currentCycle = cyclesWithPacks.find(
    (pack) =>
      pack.code === metadata.packs[currentCard.card.pack_code].cycle_code,
  );

  if (currentCycle?.reprintPacks) {
    const targetType = currentCard.card.encounter_code ? "encounter" : "player";
    const reprint = currentCycle.reprintPacks.find(
      (pack) => pack.reprint?.type === targetType,
    );

    if (reprint) {
      searchCode = reprint.code;
    }
  }

  const filteredCards = allCards.filter(
    (card) =>
      filterPackCode([searchCode], metadata, lookupTables)?.(card) &&
      filterBacksides(card),
  );
  filteredCards.sort(sortByPosition);

  const cardListIndex = filteredCards.findIndex(
    (card) => card.code === currentCard.card.code,
  );

  return (
    <div>
      <div className={css["card-set-nav-title"]}>
        <h3>
          {<PackIcon code={metadata.packs[searchCode].code} />}
          {displayPackName(metadata.packs[searchCode])}
          {<PackIcon code={metadata.packs[searchCode].code} />}
        </h3>
      </div>
      <div className={css["card-set-nav-container"]}>
        <div>
          <CardSetLink
            shift={-1}
            cardListIndex={cardListIndex}
            filteredCards={filteredCards}
          />
        </div>
        <div>
          <CardSetLink
            shift={1}
            cardListIndex={cardListIndex}
            filteredCards={filteredCards}
          />
        </div>
      </div>
    </div>
  );
}

function CardSetLink(props: {
  shift: number;
  cardListIndex: number;
  filteredCards: CardType[];
}) {
  const { shift, cardListIndex, filteredCards } = props;

  const targetIndex = cardListIndex + shift;

  if (filteredCards[targetIndex] != null) {
    return (
      <Button
        as="a"
        className={css["button"]}
        href={`/card/${filteredCards[targetIndex].code}`}
      >
        {shift < 0 && <ChevronsLeftIcon />}
        {displayAttribute(filteredCards[targetIndex], "name")}
        {shift > 0 && <ChevronsRightIcon />}
      </Button>
    );
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
      <CardSetNav currentCard={cardWithRelations} />
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
