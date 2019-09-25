import json
from os import path

from .meta import cache

@cache
def get_config() -> dict:
    if path.isfile('config.local.json'):        
        with open('config.local.json', 'r') as local_config_file:
            config_string = local_config_file.read()
            config_dict = json.loads(config_string)

            with open('config.json', 'r') as default_config_file:
                default_string = default_config_file.read()
                default_dict = json.loads(default_string)

                for k, v in config_dict.items():
                    default_dict[k] = v

                print(default_dict)

                return default_dict

    else:
        with open('config.json', 'r') as default_config_file:
            default_string = default_config_file.read()
            return json.loads(default_string)
