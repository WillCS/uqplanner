import json
from os import path

from .meta import cache

@cache
def get_config() -> dict:
    with open(path('config.json'), 'r') as config_file:
        config_string = config_file.read()
        config_dict = json.loads(config_string)
        return config_dict