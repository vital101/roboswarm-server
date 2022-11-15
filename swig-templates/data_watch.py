from time import sleep
from csv import reader
import json, os, requests, sys

base_url = "https://roboswarm.ngrok.io" # from clargs
machine_id = 48 # example. part of swarm id 20 # from clargs

# final_data_path = "/root/status_stats.csv"
final_data_path = "/Users/jackslingerland/Desktop/roboswarm_env/result_stats.csv"
# aggregate_data_path= "/root/status_stats_history.csv"
aggregate_data_path = "/Users/jackslingerland/Desktop/roboswarm_env/result_stats_history.csv"
# failure_data_path = "/root/status_failures.csv"
failure_data_path = "/Users/jackslingerland/Desktop/roboswarm_env/result_failures.csv"

def is_shutting_down_swarm(swarm_id: int) -> bool:
    url = "{0}/api/v1/public/machine/{1}/should-send-final-data".format(
        base_url,
        machine_id
    )
    return requests.get(url).json()

def capture_final_data(machine_id: int):
    try:
        with open(final_data_path, "r") as final_data_fp:
            file_reader = reader(final_data_fp)
            data = [r for r in file_reader][1:]
            url = "{0}/api/v1/public/machine/{1}/final-metrics".format(
                base_url,
                machine_id
            )
            headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
            requests.post(url, data=json.dumps(data), headers=headers)
    except Exception as e:
        print(e)

def update_can_deprovision(machine_id: int):
    url = "{0}/api/v1/public/machine/{1}/status".format(
        base_url,
        machine_id
    )
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    requests.post(url, data=json.dumps({ "action": "final_data_sent" }), headers=headers)

def kill_data_watch():
    sys.exit()

#
#
# TOMORROW: Test this
#
#
def capture_aggregate_data(machine_id):
    with open(aggregate_data_path, 'rb') as f:
        try:
            f.seek(-2, os.SEEK_END)
            while f.read(1) != b'\n':
                f.seek(-2, os.SEEK_CUR)
        except OSError:
            f.seek(0)
        last_line = f.readline().decode()
    data = [item.replace("\r\n", "") for item in last_line.split(",")]
    try:
        url = "{0}/api/v1/public/machine/{1}/aggregate-data".format(
            base_url,
            machine_id
        )
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        requests.post(url, data=json.dumps(data), headers=headers)
    except Exception as e:
        print(e)

def capture_failure_data(machine_id):
    try:
        with open(failure_data_path, "r") as failure_data_fp:
            file_reader = reader(failure_data_fp)
            data = [r for r in file_reader][1:]
            url = "{0}/api/v1/public/machine/{1}/failure-metrics".format(
                base_url,
                machine_id
            )
            headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
            requests.post(url, data=json.dumps(data), headers=headers)
    except Exception as e:
        print(e)

def capture_route_specific_data(machine_id):
    # Also need to pull the route specific data from status_stats.csv
    # Remove first and last lines
    pass

#
# TODO
# - In the user data initialization, send:
#   - base_url
#   - swarm id as a command line arg

while True:
    sleep(3)
    if is_shutting_down_swarm(machine_id):
        print("Swarm is shutting down.")
        capture_final_data(machine_id)
        print("Final data captured.")
        update_can_deprovision(machine_id)
        print("Updating Roboswarm 'can deprovision' == True")
        kill_data_watch()
    else:
        print("Swarm not shutting down.")
        capture_aggregate_data(machine_id)
        print("Aggregate data captured.")
        capture_failure_data(machine_id)
        print("Error data captured")
        ##
        ## TODO - Implement
        ##
        capture_route_specific_data(machine_id)
        print("Route specific data captured.")
        # capture regular data
        # capture failure data
        # capture route specific data.
        '''
        General Notes
        # normal data -> status_stats_history.csv
            # Read last line in file.
        # failure data -> status_failures.csv
            # I should look at the current implementation.
            # Not sure how all this works.
        # Also need to pull the route specific data from status_stats.csv
            # Remove first and last lines
        '''
        pass