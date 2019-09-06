import { Time } from '@angular/common';

export const WEEKDAY_INDICES: number[] = [
    0, 1, 2, 3, 4
];

export const WEEKDAYS: string[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export const DAY_START_TIME: Time = { hours: 8, minutes: 0 };

export const DAY_END_TIME: Time = { hours: 20, minutes: 0 };

export const DAY_LENGTH: number = 12;

export const TIMETABLE_HOURS: number[] = [
    8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
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
    classSessionIndex: number;
    classSession: ClassSession;
}