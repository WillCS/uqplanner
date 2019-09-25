from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.usertype import UserType

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
    name        = columns.Text(primary_key = True)
    year        = columns.Integer(primary_key = True)
    semester    = columns.Integer(primary_key = True)
    classes     = columns.Set(columns.UserDefinedType(Class))

class Semester(Model):
    year     = columns.Integer(primary_key = True)
    semester = columns.Integer(primary_key = True)
    active   = columns.Boolean()
    weeks    = columns.Map(columns.Integer(), columns.Date())
