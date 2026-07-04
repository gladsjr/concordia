import type { InformationFragment, Message, Participant, VisibilityScope } from "../../../../packages/domain/src/index.js";

const publicScopes: VisibilityScope[] = ["public_full", "public_summary", "cryptographic_commitment_only"];

export class VisibilityService {
  canReadMessage(input: {
    userId: string;
    message: Message;
    participants: Participant[];
  }): boolean {
    if (publicScopes.includes(input.message.visibilityScope)) {
      return true;
    }

    const isSender = input.message.senderType === "user" && input.message.senderId === input.userId;
    const isRecipient = input.message.recipientType === "user" && input.message.recipientId === input.userId;
    const isParticipant = input.participants.some((participant) => participant.userId === input.userId);

    if (input.message.visibilityScope === "private_user_agent") {
      return isSender || isRecipient;
    }

    if (input.message.visibilityScope === "anonymous_aggregate") {
      return isParticipant;
    }

    return isParticipant;
  }

  redactFragmentForScope(fragment: InformationFragment, targetScope: VisibilityScope): InformationFragment {
    if (fragment.visibilityScope === targetScope || publicScopes.includes(fragment.visibilityScope)) {
      return fragment;
    }

    return {
      ...fragment,
      content: "[redacted]"
    };
  }
}
