import json

from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from cassandra.cluster import Cluster
from cassandra.cqlengine import connection

from calendar import gen_random_subject, Semester
from util import get_config
from database import setup_connection

config = get_config()

app: Flask = Flask(__name__)
CORS(app, origins = config['CORS_host'])
api: Api = Api(app)

class Test(Resource):
    def get(self):
        return json.dumps(gen_random_subject())

class CurrentSemesters(Resource):
    def get(self):
        semesters = Semester.objects(Semester.active == True)
        return json.dumps([semester.serialise() for semester in semesters])

api.add_resource(Test, '/test')
api.add_resource(CurrentSemesters, '/currentSemesters')

if __name__ == '__main__':
    setup_connection()
    app.run(host = config['host'], port = config['port'])
