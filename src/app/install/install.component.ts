import { Component, OnInit, HostListener } from '@angular/core';

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
    gtag('event', 'install', 'clicked');
    if (this.promptEvent) {
      this.promptEvent.prompt();
      console.log(this.promptEvent);
      this.promptEvent.userChoice.then((result) => {
        this.promptEvent = null;
        gtag('event', 'install', result);
      }).catch((err) => {
        this.promptEvent = null;
        gtag('event', 'install', 'errored');

      });
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  beforeInstallPromptHandler(event: Event) {
    console.log(event);
    this.promptEvent = event;
    this.promptEvent.preventDefault();
    gtag('event', 'install', 'available');
  }

  @HostListener('window:appinstalled', ['$event'])
  installedHandler(event: Event) {
    this.promptEvent = null;
    gtag('event', 'install', 'installed');
  }

}
