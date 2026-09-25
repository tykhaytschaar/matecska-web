import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { IS_NATIVE as native } from './native';

/** Finom rezgés számjegy beírásakor; weben nem csinál semmit. */
export function tapFeedback(): void {
  if (!native) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Visszajelzés beküldés után. */
export function resultFeedback(correct: boolean): void {
  if (!native) return;
  void Haptics.notification({ type: correct ? NotificationType.Success : NotificationType.Error }).catch(() => {});
}
