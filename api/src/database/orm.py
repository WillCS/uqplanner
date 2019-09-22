from cassandra.cluster import Cluster
from cassandra.cqlengine import columns

def get_cluster(ips, port) -> Cluster:
    cluster = Cluster(ips, port = port)