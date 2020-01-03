import { Time } from '@angular/common';

export const WEEKDAY_INDICES: number[] = [
    0, 1, 2, 3, 4
];

export const WEEKDAYS: string[] = [
    'MON', 'TUE', 'WED', 'THU', 'FRI'
];

export const DAY_START_TIME: Time = { hours: 8, minutes: 0 };

export const DAY_END_TIME: Time = { hours: 20, minutes: 0 };

export const DAY_LENGTH_HOURS = 12;
export const DAY_LENGTH_MINUTES = DAY_LENGTH_HOURS * 60;

export const TIMETABLE_HOURS: number[] = [
    8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
];

export interface Plan {
    id: string;
    name: string;
    classes: ClassListing[];
    selections: Map<string, Map<string, number>>;
    lastEdited: number;
    isDirty: boolean;
}

export interface PlanSummary {
    id: string;
    name: string;
}

export interface Plans {
    [key: string]: Plan;
}

export const NULL_SESSION: TimetableSession = {
    className: '',
    classType: '',
    classStream: 0,
    classSessionIndex: 0,
    classSession: null
};

export interface ClassListing {
    name: string;
    classes: ClassType[];
}

export interface ClassType {
    name: string;
    streams: ClassStream[];
}

export interface ClassStream {
    classes: ClassSession[];
}

export interface ClassSession {
    day: number;
    startTime: Time;
    endTime: Time;
    location: string;
    weekPattern?: Array<boolean>;
    startDate?: Date
}

export interface TimetableSession {
    className: string;
    classType: string;
    classStream: number;
    classSessionIndex: number;
    classSession: ClassSession;
}

export interface Semester {
    year: number;
    semester: number;
    active: boolean;
    weeks: Date[];
}

export function startTimeToMinutes(session: TimetableSession): number {
    return session.classSession.startTime.hours * 60 + session.classSession.startTime.minutes;
}

export function endTimeToMinutes(session: TimetableSession): number {
    return session.classSession.endTime.hours * 60 + session.classSession.endTime.minutes;
}

export function lengthToMinutes(session: TimetableSession): number {
    return endTimeToMinutes(session) - startTimeToMinutes(session);
}

export function doSessionsClash(s1: TimetableSession, s2: TimetableSession): boolean {
    const s1Start = startTimeToMinutes(s1);
    const s2Start = startTimeToMinutes(s2);
    const s1End = endTimeToMinutes(s1);
    const s2End = endTimeToMinutes(s2);

    return (s1Start <= s2Start && s1End > s2Start && s1End <= s2End)
        || (s2Start <= s1Start && s2End > s1Start && s2End <= s1End)
        || (s1Start <= s2Start && s1End >= s2End)
        || (s2Start <= s1Start && s2End >= s1End);
}

export function getEarlierSession(s1: TimetableSession, s2: TimetableSession): TimetableSession {
    return startTimeToMinutes(s1) <= startTimeToMinutes(s2) ? s1 : s2;
}
