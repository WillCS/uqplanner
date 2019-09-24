import json

from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS

from calendar import gen_random_subject

app: Flask = Flask(__name__)
CORS(app, origins = 'http://localhost:4200')
api: Api = Api(app)

class Test(Resource):
    def get(self):
        return json.dumps(gen_random_subject())

api.add_resource(Test, '/test')

if __name__ == '__main__':
    app.run(host = '0.0.0.0', port = '2727')
