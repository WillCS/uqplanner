import { Injectable } from '@angular/core';
import { ClassListing } from '../calendar';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {

    constructor() { }

    public getClasses(): ClassListing[] {
        return [
            {
                name: 'INFS3208',
                classes: [
                    {
                        name: 'lec',
                        streams: [
                            [
                                {
                                    day: 5,
                                    startTime: { hours: 12, minutes: 0 },
                                    endTime: { hours: 14, minutes: 0 },
                                    location: 'Forgan Smith (01) E215'
                                }
                            ]
                        ]
                    }, {
                        name: 'prac',
                        streams: [
                            [
                                {
                                    day: 4,
                                    startTime: { hours: 10, minutes: 0 },
                                    endTime: { hours: 12, minutes: 0 },
                                    location: 'General Purpose South(78)208'
                                }
                            ]
                        ]
                    }
                ]
            }
        ]
    }
}
