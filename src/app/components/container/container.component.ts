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
}
