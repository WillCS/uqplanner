import { TemplateRef, ElementRef } from '@angular/core';

export class ModalSettings {
    public title: string;
    public text: string;
    public buttons: ModalButton[];
    public content!: TemplateRef<any>;

    constructor(title: string, text: string, buttons: ModalButton[], content: TemplateRef<any> = null) {
        this.title = title;
        this.text = text;
        this.buttons = buttons;
        this.content = content;
    }
}

export class ModalButton {
    public text: string;
    public colour: string;
    public action: (content?: any) => void;

    constructor(text: string, action: () => void, colour?: string) {
        this.text = text;
        this.colour = colour ? colour : 'transparent';
        this.action = action;
    }
}
