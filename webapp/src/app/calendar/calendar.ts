import { Time } from '@angular/common';

export const WEEKDAY_INDICES: number[] = [
    0, 1, 2, 3, 4
]

export const WEEKDAYS: string[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export declare type ClassListing = {
    name: string;
    classes: ClassType[];
}

export declare type ClassType = {
    name: string;
    streams: ClassStream[];
}

export declare type ClassStream = {
    classes: ClassSession[];
}

export declare type ClassSession = {
    day: number | Date;
    startTime: Time;
    endTime: Time;
    location: string;
}

export declare type TimetableSession = {
    className: string;
    classType: string;
    classStream: number;
    classSession: number;
}