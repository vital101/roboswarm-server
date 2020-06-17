from locust import HttpLocust, TaskSet
import json

{% for route in routes %}
def route_{{route.id}}(l):
    headers = {
        "Accept-Encoding" : "gzip, deflate",
        "Accept" : "*/*",
        "Accept-Language" : "en-us",
        "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
    }
    {% if route.method == "POST" %}
    data = json.loads("""
        {{route.body | safe}}
    """)
    with l.client.post("{{route.route}}", catch_response=True, data=data, headers=headers, timeout=5.0) as response:
        if response.status_code == {{route.responseStatusCode}}:
            response.success()
        else:
            response.failure("Wrong status code. Expected {{ route.statusCode }}.")
    {% elseif route.method == "PUT" %}
    data = json.loads("""
        {{route.body | safe}}
    """)
    with l.client.put("{{route.route}}", catch_response=True, data=data, headers=headers, timeout=5.0) as response:
        if response.status_code == {{route.responseStatusCode}}:
            response.success()
        else:
            response.failure("Wrong status code. Expected {{ route.statusCode }}.")
    {% elseif route.method == "PATCH" %}
    data = json.loads("""
        {{route.body | safe}}
    """)
    with l.client.patch("{{route.route}}", catch_response=True, data=data, headers=headers, timeout=5.0) as response:
        if response.status_code == {{route.responseStatusCode}}:
            response.success()
        else:
            response.failure("Wrong status code. Expected {{ route.statusCode }}.")
    {% elseif route.method == "DELETE" %}
    with l.client.delete("{{route.route}}", catch_response=True) as response:
        if response.status_code == {{route.responseStatusCode}}:
            response.success()
        else:
            response.failure("Wrong status code. Expected {{ route.statusCode }}.")
    {% else %}
    l.client.get("{{route.route}}", headers=headers, timeout=5.0)
    {% endif %}
{% endfor %}

class UserBehavior(TaskSet):
    tasks = {
        {% for route in routes %}route_{{route.id}}: {{route.multiplier}},
        {% endfor %}
    }

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 1000
    max_wait = 1000