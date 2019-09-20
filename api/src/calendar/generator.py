import random
import string

CLASS_TYPES = [
    [
        {
            'name': 'L',
            'streams': 1,
            'hours': { 'min': 1, 'max': 3 }
        }, {
            'name':  'T',
            'streams': { 'min': 4, 'max': 8 },
            'length': 1
        }, {
            'name': 'P',
            'streams': { 'min': 4, 'max': 8 },
            'length': 1
        }
    ], [
        {
            'name': 'U',
            'streams': { 'min': 2, 'max': 5 },
            'length': { 'min': 2, 'max': 4 }
        }, {
            'name': 'L',
            'streams': 1,
            'length': 2
        }
    ], [
        {
            'name': 'L',
            'streams': { 'min': 1, 'max': 2 },
            'hours': 2
        }, {
            'name': 'P',
            'streams': { 'min': 3, 'max': 6 },
            'length': 1
        }
    ]
]

def gen_random_subject() -> {}:
    subject_type = random.choice(CLASS_TYPES)

    name = random.choices(string.ascii_uppercase, k = 4) + random.choices(string.digits, k = 4)
    name = ''.join(name)
    
    num_classes = len(subject_type)

    classes = [gen_random_class(subject_type[n]) for n in range(num_classes)]

    # if random.randint(0, 9) == 9:
    #     classes.append(gen_random_one_off_class(random.choice(string.ascii_uppercase)))

    return {
        'name': name,
        'classes': classes
    }

# def gen_random_one_off_class(name: str) -> {}:
#     date = 

def gen_random_class(class_type: {}) -> {}:
    num_streams = 0
    stream_data = class_type.get('streams')

    try:
        num_streams = int(stream_data)
    except:
        num_streams = random.randint(stream_data.get('min'), stream_data.get('max'))

    streams = [gen_random_stream(class_type) for s in range(num_streams)]

    return {
        'name': class_type.get('name'),
        'streams': streams
    }

def gen_random_stream(class_type: {}) -> {}:
    sessions = []

    try:
        class_length = class_type.get('length')
        sessions = [gen_random_session(class_length)]

    except:
        hour_data = class_type.get('hours')
        hours_of_class = 0

        try:
            hours_of_class = int(hour_data)
        except:
            hours_of_class = random.randint(hour_data.get('min'), hour_data.get('max'))

        first_class_length = random.randint(1, hours_of_class)
        second_class_length = hours_of_class - first_class_length

        sessions = [gen_random_session(first_class_length), gen_random_session(second_class_length)]

    return {
        'classes': sessions
    }

def gen_random_session(length_hours: int) -> {}:
    day = random.randint(0, 4)
    start_time = random.randint(8, 18)
    location = ''.join(random.choices(string.ascii_letters + ' ', k = 20))

    end_time_hours = start_time + length_hours

    return {
        'day': day,
        'startTime': {
            'hours': start_time,
            'minutes': 0
        },
        'endTime': {
            'hours': end_time_hours,
            'minutes': 0
        },
        'location': location
    }
