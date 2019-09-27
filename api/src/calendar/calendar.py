from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.usertype import UserType
from cassandra.util import Date

import json

class ClassSession(UserType):
    start_time  = columns.Time()
    end_time    = columns.Time()
    location    = columns.Text()
    day         = columns.Integer()

class ClassStream(UserType):
    weeks       = columns.Set(columns.Integer())
    classes     = columns.Set(columns.UserDefinedType(ClassSession))

class Class(UserType):
    name        = columns.Text()
    streams     = columns.List(columns.UserDefinedType(ClassStream))

class SubjectOffering(Model):
    __keyspace__ = 'infs3208'

    name        = columns.Text(primary_key = True)
    year        = columns.Integer(primary_key = True)
    semester    = columns.Integer(primary_key = True)
    classes     = columns.Set(columns.UserDefinedType(Class))

class Semester(Model):
    __keyspace__ = 'infs3208'

    year     = columns.Integer(primary_key = True)
    semester = columns.Integer(primary_key = True)
    active   = columns.Boolean(custom_index = True)
    weeks    = columns.Map(columns.Integer(), columns.Date())

    def serialise(self) -> {}:
        return {
            'year': self.year,
            'semester': self.semester,
            'active': self.active,
            'weeks': { week: str(date)
                for (week, date) in self.weeks.items()
            }
        }
