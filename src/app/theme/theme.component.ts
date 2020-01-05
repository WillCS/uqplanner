import { Component, OnInit, Renderer2, OnDestroy, ElementRef } from '@angular/core';
import { StorageService } from '../calendar/storage.service';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.css']
})
export class ThemeComponent implements OnInit, OnDestroy {

  private TRANSITION_CLASSNAME = 'transition';
  private DEFAULT_THEME = 'classic';

  public themes = [
    { name: 'Black & White', className: 'black-and-white'},
    { name: 'Classic', className: 'classic'},
    { name: 'Dark', className: 'dark'},
    { name: 'Light', className: 'light'}
  ];

  public currentTheme: string;

  constructor(
    private renderer: Renderer2,
    private storageService: StorageService,
    private metaService: Meta,
    private elRef: ElementRef
  ) {
    let initThemeClass = storageService.getTheme();
    if (!initThemeClass) {
      initThemeClass = this.DEFAULT_THEME;
    }

    const initTheme = this.themes.find(t => t.className === initThemeClass);
    this.currentTheme = initTheme.className;
    this.renderer.addClass(document.body, initTheme.className);

    const color = getComputedStyle(this.elRef.nativeElement).getPropertyValue('--bg-dark');
    this.metaService.updateTag({ content: color }, 'name=theme-color');
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

    this.storageService.saveTheme(className);

    this.renderer.removeClass(document.body, this.currentTheme);
    this.renderer.addClass(document.body, this.TRANSITION_CLASSNAME);
    this.renderer.addClass(document.body, className);
    this.currentTheme = className;

    const color = getComputedStyle(this.elRef.nativeElement).getPropertyValue('--bg-dark');
    this.metaService.updateTag({ content: color }, 'name=theme-color');

    setTimeout(() => {
      this.renderer.removeClass(document.body, this.TRANSITION_CLASSNAME);
    }, 1000);
  }

}
