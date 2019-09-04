import { Time } from '@angular/common';

export declare type ClassListing = {
    name: string;
    classes: ClassType[];
}

export declare type ClassType = {
    name: string;
    streams: ClassSession[][];
}

export declare type ClassSession = {
    day: number | Date;
    startTime: Time;
    endTime: Time;
    location: string;
}