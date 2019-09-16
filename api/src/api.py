import json

from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS

from calendar import get_infs

app: Flask = Flask(__name__)
CORS(app, origins = 'http://localhost:4200')
api: Api = Api(app)

class Test(Resource):
    def get(self):
        return json.dumps(get_infs())

api.add_resource(Test, '/test')

if __name__ == '__main__':
    app.run(port = '2727')