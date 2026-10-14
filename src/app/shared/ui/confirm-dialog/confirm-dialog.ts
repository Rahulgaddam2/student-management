import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  output,
  viewChild
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss'
})
export class ConfirmDialog {
  // I receive the text and current operation state from the parent.
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly busy = input(false);
  readonly errorMessage = input('');

  // I send the decision back. The parent handles the actual operation.
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // I wait until the dialog element is rendered before opening it.
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
    });
  }

  protected confirm(): void {
    if (!this.busy()) {
      this.confirmed.emit();
    }
  }

  protected cancel(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }

  protected handleCancel(event: Event): void {
    // I handle Escape through the parent too, keeping both states in sync.
    event.preventDefault();
    this.cancel();
  }
}