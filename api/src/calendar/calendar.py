from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.usertype import UserType

class ClassSession(UserType):
    start_time  = columns.Time()
    end_time    = columns.Time()
    location    = columns.Ascii()

class ClassSessionRecurring(ClassSession):
    day         = columns.Integer()

class ClassSessionOneOff(ClassSession):
    day         = columns.Date()

class ClassStream(UserType):
    classes     = columns.List(columns.UserDefinedType(ClassSession))

class Class(UserType):
    name        = columns.Ascii()
    streams     = columns.Map(columns.Integer(), columns.UserDefinedType(ClassStream))

class SubjectOffering(Model):
    name        = columns.Ascii(primary_key = True)
    year        = columns.Integer(primary_key = True)
    semester    = columns.Integer(primary_key = True)
    classes     = columns.List(columns.UserDefinedType(Class))

def get_infs():
    return {
        'name': 'INFS3208',
        'classes': [
            {
                'name': 'L',
                'streams': [
                    {
                        'classes': [
                            {
                                'day': 4,
                                'startTime': { 'hours': 12, 'minutes': 0 },
                                'endTime': { 'hours': 14, 'minutes': 0 },
                                'location': 'Forgan Smith (01) E215'
                            }
                        ]
                    }
                ]
            }, {
                'name': 'P',
                'streams': [
                    {
                        'classes': [
                            {
                                'day': 0,
                                'startTime': { 'hours': 12, 'minutes': 0 },
                                'endTime': { 'hours': 14, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 0,
                                'startTime': { 'hours': 14, 'minutes': 0 },
                                'endTime': { 'hours': 16, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 2,
                                'startTime': { 'hours': 12, 'minutes': 0 },
                                'endTime': { 'hours': 14, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 3,
                                'startTime': { 'hours': 8, 'minutes': 0 },
                                'endTime': { 'hours': 10, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 3,
                                'startTime': { 'hours': 10, 'minutes': 0 },
                                'endTime': { 'hours': 12, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 3,
                                'startTime': { 'hours': 14, 'minutes': 0 },
                                'endTime': { 'hours': 16, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }, {
                        'classes': [
                            {
                                'day': 4,
                                'startTime': { 'hours': 8, 'minutes': 0 },
                                'endTime': { 'hours': 10, 'minutes': 0 },
                                'location': 'General Purpose South(78)208'
                            }
                        ]
                    }
                ]
            }
        ]
    }
