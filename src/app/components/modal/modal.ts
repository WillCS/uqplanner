export class ModalSettings {
    public title: string;
    public text: string;
    public buttons: ModalButton[];

    constructor(title: string, text: string, buttons: ModalButton[]) {
        this.title = title;
        this.text = text;
        this.buttons = buttons;
    }
}

export class ModalButton {
    public text: string;
    public colour: string;
    public action: () => void;

    constructor(text: string, colour: string, action: () => void) {
        this.text = text;
        this.colour = colour;
        this.action = action;
    }
}
