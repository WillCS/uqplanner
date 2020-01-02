import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.css']
})
export class ThemeComponent implements OnInit, OnDestroy {

  private TRANSITION_CLASSNAME = 'transition';
  private DEFAULT_THEME = 'Classic';

  public themes = [
    { name: 'Classic', className: 'classic'},
    { name: 'Light', className: 'light'},
    { name: 'Dark', className: 'dark'},
    { name: 'Black & White', className: 'black-and-white'}
  ];

  public currentTheme: string;

  constructor(
    private renderer: Renderer2,
  ) {
    const defaultTheme = this.themes.find(t => t.name === this.DEFAULT_THEME);
    this.currentTheme = defaultTheme.className;
    this.renderer.addClass(document.body, defaultTheme.className);
  }

  ngOnInit() {
  }

  ngOnDestroy() {

  }


  public setTheme(event: Event) {
    const target = event.target as HTMLInputElement;
    target.blur();

    const className = target.value;
    const classList = this.themes.map(t => t.className);
    if (classList.indexOf(className) === -1) {
      return;
    }

    this.renderer.removeClass(document.body, this.currentTheme);
    this.renderer.addClass(document.body, this.TRANSITION_CLASSNAME);
    this.renderer.addClass(document.body, className);
    this.currentTheme = className;

    setTimeout(() => {
      this.renderer.removeClass(document.body, this.TRANSITION_CLASSNAME);
    }, 1000);
  }

}
