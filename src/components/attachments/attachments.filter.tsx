import { FilterIcon } from "lucide-react";
import type { ResolvedDeck } from "@/store/lib/types";
import type { Attachments, Card } from "@/store/schemas/card.schema";
import { Button } from "../ui/button";

type Props = {
  card: Card;
  resolvedDeck: ResolvedDeck;
};

export function FilterAttachmentButton(props: Props) {
  const { card, resolvedDeck } = props;

  function AttachmentButton(props: { attachment: Attachments }) {
    const { attachment } = props;
    /* this button should toggle between bare and no style, and enable or disable the filter, respectively. */

    const onClick = () => {
      console.log(getAttachmentExpression({ attachment }));
    };

    return (
      <Button iconOnly variant="bare" size="sm" onClick={onClick}>
        <FilterIcon />
      </Button>
    );
  }
  const myAttachment: Attachments = getAttachment(card, resolvedDeck);
  return <AttachmentButton attachment={myAttachment} />;
}

function getAttachment(card: Card, resolvedDeck: ResolvedDeck) {
  var returnValue: Attachments;
  for (var attachment of resolvedDeck.availableAttachments) {
    if (attachment.code === card.code) {
      returnValue = attachment;
    }
  }
  return returnValue;
}

function getAttachmentExpression(props: { attachment: Attachments }) {
  const { attachment } = props;

  var filterString = "";
  var traitString = "";
  var cleanedValueType = null;

  /* TODO - make it so that if the same attribute appears twice, it connects them with a ||. */
  if (attachment.filters) {
    for (var localFilter of attachment.filters) {
      if (typeof localFilter.value === "string") {
        cleanedValueType = `"${localFilter.value}"`;
      } else {
        cleanedValueType = localFilter.value;
      }

      if (filterString !== "") {
        filterString = `${filterString} &&`;
      }
      filterString = `${filterString} ${localFilter.attribute} ${localFilter.operator ?? "=="} ${cleanedValueType}`;
    }
  }

  if (attachment.traits) {
    for (var localTrait of attachment.traits) {
      const cleanTrait = localTrait.toLowerCase().slice(0, -1);

      if (traitString !== "") {
        traitString = `${traitString} ||`;
      }
      traitString = `${traitString} trait == "${cleanTrait}"`;
    }
  }

  if (filterString === "") {
    return `(${traitString} )`;
  }
  if (traitString === "") {
    return `(${filterString} )`;
  }
  return `(${filterString} ) && (${traitString} )`;
}

export function isAttachable(card: Card, resolvedDeck: ResolvedDeck) {
  for (var attachment of resolvedDeck.availableAttachments) {
    if (attachment.code === card.code) {
      return true;
    }
  }
  return false;
}
