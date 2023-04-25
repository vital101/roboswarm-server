from time import sleep
from csv import reader
import json, os, requests, sys

if len(sys.argv) != 4:
    raise ValueError('Usage: python data_watch.py <ROBOSWARM__BASE_URL> <machine_id> <ROBOSWARM__BASE_PATH>')

ROBOSWARM__BASE_URL = sys.argv[1] # "https://roboswarm.ngrok.io" for dev
machine_id = sys.argv[2] # 48 for dev
ROBOSWARM__BASE_PATH = sys.argv[3] # /Users/jackslingerland/Desktop/roboswarm_env/ for dev

# if "ngrok" in ROBOSWARM__BASE_URL:
#     print("Using development configuration")
#     final_data_path = "{0}_stats.csv".format(ROBOSWARM__BASE_PATH)
#     aggregate_data_path = "{0}_stats_history.csv".format(ROBOSWARM__BASE_PATH)
#     failure_data_path = "{0}_failures.csv".format(ROBOSWARM__BASE_PATH)
#     route_specific_data_path = "{0}_stats.csv".format(ROBOSWARM__BASE_PATH)
# else:
print("Using production configuration")
final_data_path = "{0}status_stats.csv".format(ROBOSWARM__BASE_PATH)
aggregate_data_path= "{0}status_stats_history.csv".format(ROBOSWARM__BASE_PATH)
failure_data_path = "{0}status_failures.csv".format(ROBOSWARM__BASE_PATH)
route_specific_data_path = "{0}status_stats.csv".format(ROBOSWARM__BASE_PATH)

def roboswarm_http_request(method, route, data = None):
    try:
        url = "{0}/api/v1/public/machine/{1}/{2}".format(
            ROBOSWARM__BASE_URL,
            machine_id,
            route
        )
        if method == "GET":
            return requests.get(url).json()
        elif method == "POST":
            headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
            requests.post(url, data=json.dumps(data), headers=headers)
    except Exception as e:
        print("Error in 'roboswarm_http_request': ")
        print(e)

# options = { "trim_start": True|False, "trim_end": True|False }
def get_file_data(path, options):
    with open(path, "r") as final_data_fp:
        file_reader = reader(final_data_fp)
        data = [r for r in file_reader]
        if options["trim_start"] and options["trim_end"]:
            return data[1:-1]
        elif options["trim_start"] and not options["trim_end"]:
            return data[1:]
        elif not options["trim_start"] and options["trim_end"]:
            return data[:-1]
        else:
            return data

def get_last_line(path):
     with open(path, 'rb') as f:
        try:
            f.seek(-2, os.SEEK_END)
            while f.read(1) != b'\n':
                f.seek(-2, os.SEEK_CUR)
        except OSError:
            f.seek(0)
        last_line = f.readline().decode()
        return [item.replace("\r\n", "") for item in last_line.split(",")]

def is_shutting_down_swarm():
    result = roboswarm_http_request("GET", "should-send-final-data")
    return result["should_send_final_data"]

def is_swarm_ready():
    result = roboswarm_http_request("GET", "is-swarm-ready")
    return result["is_swarm_ready"]

def capture_final_data():
    try:
        data = get_file_data(final_data_path, {
            "trim_start": True,
            "trim_end": False
        })
        roboswarm_http_request("POST", "final-metrics", data)
    except Exception as e:
        print(e)

def update_can_deprovision():
    data = { "action": "final_data_sent" }
    roboswarm_http_request("POST", "status", data)

def kill_data_watch():
    sys.exit()

def capture_aggregate_data():
    data = get_last_line(aggregate_data_path)
    roboswarm_http_request("POST", "aggregate-data", data)

def capture_failure_data():
    data = get_file_data(failure_data_path, {
        "trim_start": True,
        "trim_end": False
    })
    roboswarm_http_request("POST", "failure-metrics", data)

def capture_route_specific_data():
    data = get_file_data(route_specific_data_path, {
        "trim_start": True,
        "trim_end": True
    })
    roboswarm_http_request("POST", "route-specific-metrics", data)

while True:
    try:
        if is_shutting_down_swarm():
            print("Swarm is shutting down.")
            capture_final_data()
            print("Final data captured.")
            update_can_deprovision()
            print("Updating Roboswarm 'can deprovision' == True")
            kill_data_watch()
        else:
            # I think is_swarm_ready isn't working?
            # Or maybe the path to the data files is wrong.
            # Need to run this manually on master and see
            # whats up.
            if is_swarm_ready():
                print("Swarm not shutting down.")
                capture_aggregate_data()
                print("Aggregate data captured.")
                capture_failure_data()
                print("Error data captured")
                capture_route_specific_data()
                print("Route specific data captured.")
            else:
                print("Swarm is not ready yet. Waiting 3 seconds")
    except Exception as e:
        print(e)
    sleep(3)