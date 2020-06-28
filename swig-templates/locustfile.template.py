from locust import HttpLocust, TaskSet
import json

#
# WIP -> See changes that we need to make in templateGeneration.ts
#        Will make this a lot easier going forward.
#

{% for route in routes %}
    { % if route.routeType == = 'UNAUTHENTICATED_FRONTEND_NAVIGATE' %}
    {% endif }
def route_{{route.id}}(l):
    headers = {
        "Accept-Encoding" : "gzip, deflate",
        "Accept" : "*/*",
        "Accept-Language" : "en-us",
        "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
    }
    l.client.get("{{route.path}}", headers=headers, timeout=7.0)
{% endfor %}

class UserBehavior(TaskSet):
    tasks = {
        {% for route in routes %}route_{{route.id}}: 1,
        {% endfor %}
    }

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 1000
    max_wait = 1000
