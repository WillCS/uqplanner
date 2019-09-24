from functools import wraps

def cache(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        key = args + tuple(kwargs.items())

        if key not in wrapper.cache:
            wrapper.cache[key] = func(*args, **kwargs)
        
        return wrapper.cache[key]
        
    wrapper.cache = dict()
    return wrapper
