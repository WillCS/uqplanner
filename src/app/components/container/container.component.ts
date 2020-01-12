import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { ModalSettings, ModalButton } from '../modal/modal';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css']
})
export class ContainerComponent implements OnInit {
  @ViewChild('feedback', { read: TemplateRef, static: false })
  private feedbackTemplate: TemplateRef<any>;

  public donateLink = environment.donateLink;

  constructor(private modalService: ModalService) {

  }

  ngOnInit() {

  }

  public showFeedbackModal() {
    const settings = new ModalSettings(
      'Report a problem or submit feedback',
      'If you\'ve run into a problem with the planner, try and ' +
      'be as precise as you can when describing it. ' +
      'Additionally, if you\'d like us to get back to you, ' +
      'enter your email as well. Thanks!',
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
