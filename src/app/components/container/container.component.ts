import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { ModalSettings, ModalButton } from '../modal/modal';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from 'src/app/calendar/storage.service';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css']
})
export class ContainerComponent implements OnInit {
  @ViewChild('feedback', { read: TemplateRef, static: false })
  private feedbackTemplate: TemplateRef<any>;

  public donateLink = environment.donateLink;

  public announcement = `
        <h2>Welcome, Semester 2!</h2>
        <p>For this semester, we've added...</p>

        <p><b>Multi-stream selections</b><br />
        Select multiple class streams to show in your timetable (on desktop and tablet)</p>

        <p><b>Add to home screen</b><br />
        Add your timetable to the home screen on Chrome with Android or Safari with iOS</p>

        <p><b>Timetable updates</b><br />
        Automatic checks and notifications for updates to your course times</p>

        <p><b>...among many other improvements.</b></p>

        <!-- <p><b>Offline mode</b><br />
        Open your saved timetable, even without internet</p> -->

        <hr />

        <p>Please <a href="https://facebook.com/uqplanner" target="_blank">like our Facebook page</a> for updates, and let us know if you run into any bugs!</p>

        <p>Here's to a fresh start for the new semester.</p>

        <br />
        <p> — Darren, Will</p>
        <br />
  `;

  constructor(private modalService: ModalService, private toaster: ToastrService, private storageService: StorageService) {

  }

  ngOnInit() {
    if (!this.storageService.getAnnouncementADismissed()) {
      this.toaster.success(this.announcement, '', {
        closeButton: true,
        timeOut: 0,
        disableTimeOut: true,
        enableHtml: true,
        positionClass: 'toast-bottom-right',
        toastClass: 'announcementToast ngx-toastr',
        tapToDismiss: false,
      }).onHidden.subscribe(() => {
        this.storageService.setAnnouncementADismissed(true);
      });
    }
  }
}
