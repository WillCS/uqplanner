export class ModalSettings {
    public title: string;
    public text: string;
    public buttons: ModalButton[];
    public userdata!: any[];

    constructor(title: string, text: string, buttons: ModalButton[], userdata: any[] = null) {
        this.title = title;
        this.text = text;
        this.buttons = buttons;
        this.userdata = userdata;
    }
}

export class ModalButton {
    public text: string;
    public colour: string;
    public action: () => void;

    constructor(text: string, action: () => void, colour?: string) {
        this.text = text;
        this.colour = colour ? colour : 'transparent';
        this.action = action;
    }
}
