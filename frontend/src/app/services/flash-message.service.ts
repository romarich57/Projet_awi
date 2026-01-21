import { Injectable, signal } from '@angular/core';

export type FlashMessageType = 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private readonly _message = signal<string | null>(null);
  private readonly _type = signal<FlashMessageType | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly message = this._message.asReadonly();
  readonly type = this._type.asReadonly();

  showSuccess(message: string, timeoutMs = 3000): void {
    this.show('success', message, timeoutMs);
  }

  showError(message: string, timeoutMs = 4000): void {
    this.show('error', message, timeoutMs);
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this._message.set(null);
    this._type.set(null);
  }

  private show(type: FlashMessageType, message: string, timeoutMs: number): void {
    this.clear();
    this._type.set(type);
    this._message.set(message);
    this.timeoutId = setTimeout(() => this.clear(), timeoutMs);
  }
}
