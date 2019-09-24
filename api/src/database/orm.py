from cassandra.cluster import Cluster
from cassandra.cqlengine import columns

from util import get_config, cache
from calendar import Class, ClassSession, ClassStream

@cache
def get_cluster() -> Cluster:
    """
    Get the cluster to connect to. Because we only ever want to connect to a
    single cassandra cluster, the output of this function is cached.

    Effectively, the cluster is a singleton.
    """
    config = get_config()

    ips = config['db_addresses']
    port = config['db_port']
    keyspace = config['db_keyspace']

    cluster: Cluster = Cluster(ips, port = port)

    cluster.register_user_type(keyspace, 'class_session', ClassSession)
    cluster.register_user_type(keyspace, 'class_stream', ClassStream)
    cluster.register_user_type(keyspace, 'class', Class)

    return cluster
