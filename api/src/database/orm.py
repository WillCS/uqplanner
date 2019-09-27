from cassandra.cluster import Cluster
from cassandra.cqlengine import columns, connection
from cassandra.auth import PlainTextAuthProvider

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
    port = int(config['db_port'])
    keyspace = config['db_keyspace']
    username = config['db_username']
    password = config['db_password']

    auth: PlainTextAuthProvider = PlainTextAuthProvider(username, password)

    cluster: Cluster = Cluster(ips,
            port             = port,
            auth_provider    = auth
    )

    cluster.register_user_type(keyspace, 'class_session', ClassSession)
    cluster.register_user_type(keyspace, 'class_stream', ClassStream)
    cluster.register_user_type(keyspace, 'class', Class)

    return cluster

def setup_connection() -> None:
    """
    Setup the connection that the mapper should use. This should be called when
    the api starts.
    """

    cluster_session = get_cluster().connect()

    connection.register_connection('cluster', 
            session = cluster_session,
            default = True
    )

