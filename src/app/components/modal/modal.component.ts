import { Component, OnInit } from '@angular/core';
import { ModalService } from './modal.service';
import { Observer } from 'rxjs';
import { ModalSettings } from './modal';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
  public isActive = false;
  public modalSettings: ModalSettings;

  public modalDisplayObserver: Observer<ModalSettings> = {
    closed: false,
    next: (modal: ModalSettings) => this.displayModal(modal),
    error: (error: any) => console.log(error),
    complete: () => this.modalDisplayObserver.closed = true
  };

  public modalCloseObserver: Observer<boolean> = {
    closed: false,
    next: () => this.closeModal(),
    error: (error: any) => console.log(error),
    complete: () => this.modalCloseObserver.closed = true
  };

  constructor(public modalService: ModalService) {
    this.modalService.modalDisplayEvent.subscribe(this.modalDisplayObserver);
    this.modalService.modalCloseEvent.subscribe(this.modalCloseObserver);
  }

  ngOnInit() {

  }

  private displayModal(modal: ModalSettings): void {
    console.log('c');
    this.isActive = true;
    this.modalSettings = modal;
    console.log(this.isActive);
  }

  private closeModal(): void {
    this.isActive = false;
    this.modalSettings = null;
  }
}
