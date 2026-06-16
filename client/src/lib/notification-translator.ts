import i18n from "./i18next.config";
import type { Notification } from "@shared/schema";

interface TypeKeys {
  titleKey: string;
  messageKey: string;
}

const TYPE_KEYS: Record<string, TypeKeys> = {
  agreement_ready: {
    titleKey: "notifPrefAgreementReady",
    messageKey: "notifPrefAgreementReadyDesc",
  },
  counter_offer: {
    titleKey: "notifPrefCounterOffer",
    messageKey: "toastCounterOfferDesc",
  },
  price_revised: {
    titleKey: "notifPrefPriceRevised",
    messageKey: "toastPriceRevisedDesc",
  },
  document_request: {
    titleKey: "notifDocRequest",
    messageKey: "notifPrefDocRequestDesc",
  },
  meeting_cancelled: {
    titleKey: "toastMeetingCancelled",
    messageKey: "notifPrefMeetingUpdateDesc",
  },
  meeting_rescheduled: {
    titleKey: "toastMeetingRescheduled",
    messageKey: "notifPrefMeetingUpdateDesc",
  },
  item_approved: {
    titleKey: "toastItemApproved",
    messageKey: "notifPrefItemPricingDesc",
  },
  item_declined: {
    titleKey: "toastItemDeclined",
    messageKey: "notifPrefItemPricingDesc",
  },
};

export function translateNotifications(notifications: Notification[]): Notification[] {
  return notifications.map((notif) => {
    const keys = TYPE_KEYS[notif.type];
    if (!keys) {
      return notif;
    }
    return {
      ...notif,
      title: i18n.t(keys.titleKey),
      message: i18n.t(keys.messageKey),
    };
  });
}
