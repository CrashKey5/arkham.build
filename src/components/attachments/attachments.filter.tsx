import type { ResolvedDeck } from "@/store/lib/types";
import type { Card } from "@/store/schemas/card.schema";
import { Button } from "../ui/button";

type Props = {
  card: Card;
  resolvedDeck: ResolvedDeck;
};

export function FilterAttachmentButton(props: Props) {
  const { card, resolvedDeck } = props;

  return <AttachmentButton attachment={getAttachment(card, resolvedDeck)} />;
}

function AttachmentButton(attachment: any) {
  return <Button>{attachment.attachment.icon}</Button>;
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
