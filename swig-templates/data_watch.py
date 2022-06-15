from time import sleep
import requests

base_url = "https://roboswarm.ngrok.io" # from clargs
machine_id = 1 # from clargs

def is_shutting_down_swarm(swarm_id: int) -> bool:
    url = "{0}/api/v1/public/machine/{1}/should-send-final-data".format(
        base_url,
        machine_id
    )
    shutting_down = requests.get(url).json()
    print("Shutting down swarm? --> {0}".format(shutting_down))
    return shutting_down

def capture_final_data(machine_id: int):
    pass

def update_can_deprovision(machine_id: int):
    pass

def kill_data_watch():
    pass

#
# TODO
# - In the user data initialization, send:
#   - base_url
#   - swarm id as a command line arg

while True:
    sleep(2)
    if is_shutting_down_swarm(machine_id):
        capture_final_data(machine_id)
        update_can_deprovision(machine_id)
        kill_data_watch()
        '''
        General Notes
        # If so, do the final data capture.
        # status_stats.csv
        # Update Swarm.can_deprovision = True
        # kill this script.
        '''
    else:
        # capture regular data
        # capture failure data
        # capture route specific data.
        '''
        General Notes
        # normal data -> status_stats_history.csv
            # Tail this file.
        # failure data -> status_failures.csv
        # Also need to pull the route specific data from status_stats.csv
        '''
        pass