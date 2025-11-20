import { FilterIcon } from "lucide-react";
import { useStore } from "@/store";
import type { ResolvedDeck } from "@/store/lib/types";
import type { Card } from "@/store/schemas/card.schema";
import { Button } from "../ui/button";

type Props = {
  card: Card;
  resolvedDeck: ResolvedDeck;
};

export function FilterAttachmentButton(props: Props) {
  const { card, resolvedDeck } = props;
  const changeList = useStore((state) => state.changeList);

  function AttachmentButton(attachment: any) {
    /* this button should toggle between bare and no style, and enable or disable the filter, respectively. */

    const onClick = () => {
      changeList("player", window.location.href);
    };

    return (
      <Button iconOnly variant="bare" size="sm" onClick={onClick}>
        <FilterIcon />
      </Button>
    );
  }

  return <AttachmentButton attachment={getAttachment(card, resolvedDeck)} />;
}

function getAttachment(card: Card, resolvedDeck: ResolvedDeck) {
  for (var attachment of resolvedDeck.availableAttachments) {
    if (attachment.code === card.code) {
      return attachment;
    }
  }
}

export function isAttachable(card: Card, resolvedDeck: ResolvedDeck) {
  for (var attachment of resolvedDeck.availableAttachments) {
    if (attachment.code === card.code) {
      return true;
    }
  }
  return false;
}
