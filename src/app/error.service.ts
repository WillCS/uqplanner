import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { ModalService } from './components/modal/modal.service';
import { ModalButton, ModalSettings } from './components/modal/modal';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  public modalService: ModalService;

  constructor(
    private injector: Injector
  ) { }

  handleError(error: Error) {
    console.log(error);
    const title = 'Whoops!';
    const text = 'It looks like we\'ve run into a problem. This ' +
      'might be solved by refreshing the page, or by resetting the app. ' +
      'Resetting the app will delete all your saved timetables.';

    const reloadButton: ModalButton = new ModalButton('Reload', () => {
      window.location.reload();
    });

    const resetButton: ModalButton = new ModalButton('Reset', () => {
      window.localStorage.clear();
      window.location.reload();
    });

    this.modalService = this.injector.get(ModalService);
    this.modalService.showModal(
      new ModalSettings(title, text, [reloadButton, resetButton])
    );
  }
}
