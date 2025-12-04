import {
  FilterAttachmentButton,
  isAttachable,
} from "@/components/attachments/attachments.filter";
import { DeckInvestigator } from "@/components/deck-investigator/deck-investigator";
import { DeckInvestigatorModal } from "@/components/deck-investigator/deck-investigator-modal";
import { ListCard } from "@/components/list-card/list-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ResolvedDeck } from "@/store/lib/types";
import { useMedia } from "@/utils/use-media";
import css from "./investigator-listcard.module.css";

type Props = {
  deck: ResolvedDeck;
};

export function InvestigatorListcard(props: Props) {
  return (
    <Dialog>
      <InvestigatorListcardInner {...props} />
    </Dialog>
  );
}

function InvestigatorListcardInner({ deck }: Props) {
  const card = {
    ...deck.investigatorFront.card,
    parallel:
      deck.investigatorFront.card.parallel ||
      deck.investigatorBack.card.parallel,
  };

  const isAnAttachable = isAttachable(card, deck);
  const isMobile = useMedia("(max-width: 480px)");

  return (
    <div
      className={css["investigator-container"]}
      data-testid="investigator-container"
    >
      <ListCard
        card={card}
        omitBorders
        omitDetails={false}
        omitThumbnail={false}
        omitIcon={isAnAttachable && isMobile}
        showInvestigatorIcons
        size="investigator"
        titleOpens="dialog"
        tooltip={
          <DeckInvestigator
            canToggleBack={false}
            deck={deck}
            readonly
            size="tooltip"
          />
        }
      />
      <div>
        {isAnAttachable && (
          <FilterAttachmentButton card={card} resolvedDeck={deck} />
        )}
      </div>
      <DialogContent>
        <DeckInvestigatorModal deck={deck} />
      </DialogContent>
    </div>
  );
}
