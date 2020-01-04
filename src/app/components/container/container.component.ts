import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { ModalSettings, ModalButton } from '../modal/modal';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css']
})
export class ContainerComponent implements OnInit {
  @ViewChild('feedback', { read: TemplateRef, static: false })
  private feedbackTemplate: TemplateRef<any>;

  constructor(private modalService: ModalService) {

  }

  ngOnInit() {

  }

  ngAfterViewInit() {

  }

  public showFeedbackModal() {
    const settings = new ModalSettings(
      'Report a problem or submit feedback',
      'If you\'ve run into a problem with the planner, try and ' +
      'be as precise as you can when describing it. Thanks!',
      [ 
        new ModalButton('Cancel', () => this.modalService.closeModal()),
        new ModalButton('Submit', (content?: any) => {
          (content as HTMLFormElement).submit();
        })
      ],
      this.feedbackTemplate
    );

    this.modalService.showModal(settings);
  }
}
