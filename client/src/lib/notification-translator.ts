import i18n from './i18next.config';
import type { Notification as DbNotification } from '@shared/schema';

// DatabaseNotification might have null values, but we'll normalize them
export interface TranslatedNotification extends DbNotification {
  title: string;
  message: string;
}

/**
 * Translates notification title and message based on type and content
 * This ensures notifications sent from the server (which are in English)
 * are translated to the user's current language preference
 */
export function translateNotification(notif: DbNotification): DbNotification {
  const { t } = i18n;

  if (notif.type === 'agreement_signed') {
    // Match "Agreement Fully Signed" or "Agreement Partially Signed"
    if (notif.title.includes('Fully')) {
      notif.title = t('agreementFullySigned');
      // Extract requestId from message using regex
      const requestIdMatch = notif.message.match(/#(\d+)/);
      if (requestIdMatch) {
        notif.message = t('agreementFullySignedDesc', { requestId: requestIdMatch[1] });
      }
    } else if (notif.title.includes('Partially')) {
      notif.title = t('agreementPartiallySigned');
      const requestIdMatch = notif.message.match(/#(\d+)/);
      const party = notif.message.includes('seller') ? t('feeRoleSeller') : t('feeRoleMarchand');
      if (requestIdMatch) {
        notif.message = t('agreementPartiallySignedDesc', { party, requestId: requestIdMatch[1] });
      }
    }
  }

  return notif;
}

/**
 * Translates an array of notifications
 */
export function translateNotifications(notifs: DbNotification[]): DbNotification[] {
  return notifs.map(translateNotification);
}
