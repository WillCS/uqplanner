import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { ModalSettings, ModalButton } from '../modal/modal';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css']
})
export class ContainerComponent implements OnInit {

  constructor(private modalService: ModalService) {

  }

  ngOnInit() {

  }

  public showFeedbackModal() {
    const settings = new ModalSettings(
      'Report a problem or submit feedback',
      'If you\'ve found a bug with the planner, try and ' +
      'be as precise as you can when describing it. Thanks!',
      [ new ModalButton('Cancel', () => this.modalService.closeModal()) ],
      [ 'form' ]
    );

    this.modalService.showModal(settings);
  }
}
