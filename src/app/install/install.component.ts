import { Component, OnInit, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';

declare let gtag: Function;

@Component({
  selector: 'app-install',
  templateUrl: './install.component.html',
  styleUrls: ['./install.component.css']
})
export class InstallComponent implements OnInit {

  public promptEvent = null;

  constructor() { }

  ngOnInit() {
  }

  public installHandler(event: Event) {
    console.log('Install clicked');
    gtag('event', 'installClicked', environment.gaEventParams);
    if (this.promptEvent) {
      this.promptEvent.prompt();
      this.promptEvent.userChoice.then((result) => {
        this.promptEvent = null;
      }).catch((err) => {
        this.promptEvent = null;
        gtag('event', 'installErrored', environment.gaEventParams);

      });
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  beforeInstallPromptHandler(event: Event) {
    console.log(event);
    this.promptEvent = event;
    this.promptEvent.preventDefault();
    gtag('event', 'installAvailable', environment.gaEventParams);
  }

  @HostListener('window:appinstalled', ['$event'])
  installedHandler(event: Event) {
    this.promptEvent = null;
    gtag('event', 'installCompleted', environment.gaEventParams);
  }

}
