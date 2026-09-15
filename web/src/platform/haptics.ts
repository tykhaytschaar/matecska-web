import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();

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
