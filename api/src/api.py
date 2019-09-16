from flask import Flask, request
from flask_restful import Resource, Api
import json

app: Flask = Flask(__name__)
api: Api = Api(app)

class Test(Resource):
    def get(self):
        return json.dumps({ 'name': 'hehehe' })

api.add_resource(Test, '/test')


if __name__ == '__main__':
    app.run(port = '2727')