from time import sleep


from time import sleep

while True:
    sleep(2)
    # Check if we are shutting down the swarm.
    # If so, do the final data capture.
        # status_stats.csv
        # Update Swarm.can_deprovision = True
        # kill this script.
    # else
        # normal data -> status_stats_history.csv
            # Tail this file.
        # failure data -> status_failures.csv
        # Also need to pull the route specific data from status_stats.csv