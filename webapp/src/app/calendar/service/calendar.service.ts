import { Injectable } from '@angular/core';
import { ClassListing } from '../calendar';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {

    constructor() { }

    public GetClasses(): ClassListing[] {
        return [
            {
                name: 'INFS3208',
                classes: [
                    {
                        name: 'L',
                        streams: [
                            {
                                classes: [
                                    {
                                        day: 4,
                                        startTime: { hours: 12, minutes: 0 },
                                        endTime: { hours: 14, minutes: 0 },
                                        location: 'Forgan Smith (01) E215'
                                    }
                                ]
                            }
                        ]
                    }, {
                        name: 'P',
                        streams: [
                            {
                                classes: [
                                    {
                                        day: 0,
                                        startTime: { hours: 12, minutes: 0 },
                                        endTime: { hours: 14, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 0,
                                        startTime: { hours: 14, minutes: 0 },
                                        endTime: { hours: 16, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 2,
                                        startTime: { hours: 12, minutes: 0 },
                                        endTime: { hours: 14, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 3,
                                        startTime: { hours: 8, minutes: 0 },
                                        endTime: { hours: 10, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 3,
                                        startTime: { hours: 10, minutes: 0 },
                                        endTime: { hours: 12, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 3,
                                        startTime: { hours: 14, minutes: 0 },
                                        endTime: { hours: 16, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }, {
                                classes: [
                                    {
                                        day: 4,
                                        startTime: { hours: 8, minutes: 0 },
                                        endTime: { hours: 10, minutes: 0 },
                                        location: 'General Purpose South(78)208'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
