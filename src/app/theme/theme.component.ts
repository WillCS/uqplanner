import { Component, OnInit, Renderer2, OnDestroy, ElementRef } from '@angular/core';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.css']
})
export class ThemeComponent implements OnInit, OnDestroy {

  public themes = [
    { name: 'Classic', className: 'classic'},
    { name: 'Light', className: 'light'},
    { name: 'Dark', className: 'dark'},
    { name: 'Black & White', className: 'black-and-white'}
  ];

  public currentTheme: string;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {
    this.currentTheme = 'classic';
    this.renderer.addClass(document.body, this.currentTheme);
  }

  ngOnInit() {
  }

  ngOnDestroy() {

  }


  public setTheme(className: string) {
    const classList = this.themes.map(t => t.className);
    if (classList.indexOf(className) === -1) {
      return;
    }

    this.renderer.removeClass(document.body, this.currentTheme);
    this.elementRef.nativeElement.style.setProperty('--global-transitions', 'color 0.6s, background-color 0.6s');
    this.renderer.addClass(document.body, className);
    this.currentTheme = className;

    setTimeout(() => {
      this.elementRef.nativeElement.style.setProperty('--global-transitions', 'none');
    }, 1000);
  }

}
