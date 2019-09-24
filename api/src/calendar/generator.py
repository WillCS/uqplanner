import random
import string

CLASS_TYPES = [
    [
        {
            'name': 'L',
            'streams': { 'min': 1, 'max': 3 },
            'length': { 'hours': 0, 'minutes': 50 },
            'sessions': 3
        }, {
            'name':  'T',
            'streams': { 'min': 4, 'max': 8 },
            'length': { 'hours': 0, 'minutes': 50 },
            'sessions': 1
        }, {
            'name': 'P',
            'streams': { 'min': 4, 'max': 8 },
            'length': { 'hours': 1, 'minutes': 20 },
            'sessions': 1
        }
    ], [
        {
            'name': 'U',
            'streams': { 'min': 2, 'max': 5 },
            'length': { 'hours': 2, 'minutes': 50 },
            'sessions': 1
        }, {
            'name': 'L',
            'streams': 1,
            'length': { 'hours': 0, 'minutes': 50 },
            'sessions': 1
        }
    ], [
        {
            'name': 'L',
            'streams': { 'min': 1, 'max': 2 },
            'length': { 'hours': 1, 'minutes': 50 },
            'sessions': 1
        }, {
            'name': 'P',
            'streams': { 'min': 3, 'max': 6 },
            'length': { 'hours': 1, 'minutes': 50 },
            'sessions': 1
        }
    ]
]

def gen_random_subject() -> {}:
    subject_type = random.choice(CLASS_TYPES)

    name = random.choices(string.ascii_uppercase, k = 4) + random.choices(string.digits, k = 4)
    name = ''.join(name)
    
    num_classes = len(subject_type)

    classes = [gen_random_class(subject_type[n]) for n in range(num_classes)]

    return {
        'name': name,
        'classes': classes
    }

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
    class_length = class_type.get('length')
    num_sessions = class_type.get('sessions')
    sessions = [gen_random_session(class_length) for s in range(num_sessions)]

    return {
        'classes': sessions
    }

def gen_random_session(length) -> {}:
    day = random.randint(0, 4)
    start_time = { 'hours': random.randint(8, 18), 'minutes': 30 if random.randint(0, 9) == 9 else 0 }
    location = ''.join(random.choices(string.ascii_letters + ' ', k = 20))

    end_time = sum_times(start_time, length)

    return {
        'day': day,
        'startTime': start_time,
        'endTime': end_time,
        'location': location
    }

def sum_times(t1, t2):
    m1 = t1.get('hours') * 60 + t1.get('minutes')
    m2 = t2.get('hours') * 60 + t2.get('minutes')

    m_s = (m1 + m2) % 60
    h_s = (m1 + m2 - m_s) / 60
    t_s = { 'hours': h_s, 'minutes': m_s }

    return t_s
