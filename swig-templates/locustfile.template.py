from locust import TaskSet, SequentialTaskSet, task
from locust.contrib.fasthttp import FastHttpUser

###
## Unauthenticated frontend scenario
###
{% if unauthenticated_frontend %}
    {% for route in unauthenticated_frontend %}
def route_{{route.id}}(l):
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Accept": "*/*",
        "Accept-Language": "en-us",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
    }
    l.client.get("{{route.path}}", headers=headers, timeout=7.0)
    {% endfor %}

class UnauthenticatedFrontend(TaskSet):
    tasks = {
        {% for route in unauthenticated_frontend %}route_{{route.id}}: 1,
        {% endfor %}
    }

class UnauthenticatedUser(FastHttpUser):
    tasks = {UnauthenticatedFrontend:1}
    min_wait = 1000
    max_wait = 1000
{% endif %}

###
## Authenticated frontend scenario
###
{% if authenticated_frontend %}
class AuthenticatedFrontendSequence(SequentialTaskSet):
    headers = {
        "Accept-Encoding" : "gzip, deflate",
        "Accept" : "*/*",
        "Accept-Language" : "en-us",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
    }
    username = '{{username}}'
    password = '{{password}}'

    @task
    def login(self):
        headers = {
            "Accept-Encoding" : "gzip, deflate",
            "Accept" : "*/*",
            "Accept-Language" : "en-us",
            "Content-Type" : "application/x-www-form-urlencoded",
            "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"
        }
        data = {
            "log" : self.username,
            "pwd" : self.password
        }
        self.client.post("/wp-login.php", data, headers=headers)

    {% for route in authenticated_frontend %}
    @task
    def page_{{route.id}}(self):
        self.client.get("{{route.path}}", headers=self.headers)
    {% endfor %}

class AuthenticatedUser(FastHttpUser):
    tasks = {AuthenticatedFrontendSequence:1}
    min_wait = 1000
    max_wait = 1000
{% endif %}

###
## Authenticated admin scenario
##
{% if authenticated_backend %}
class AuthenticatedAdminSequence(SequentialTaskSet):
    headers = {
        "Accept-Encoding" : "gzip, deflate",
        "Accept" : "*/*",
        "Accept-Language" : "en-us",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
    }
    username = '{{username}}'
    password = '{{password}}'

    @task
    def login(self):
        headers = {
            "Accept-Encoding" : "gzip, deflate",
            "Accept" : "*/*",
            "Accept-Language" : "en-us",
            "Content-Type" : "application/x-www-form-urlencoded",
            "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"
        }
        data = {
            "log" : self.username,
            "pwd" : self.password
        }
        self.client.post("/wp-login.php", data, headers=headers)

    {% for route in authenticated_backend %}
    @task
    def page_{{route.id}}(self):
        self.client.get("{{route.path}}", headers=self.headers)
        {% if route.path === "/wp-admin/upload.php" %}
        '''
        media_body = {
            "action": "query-attachments",
            "post_id": "0",
            "query[orderby]": "date",
            "query[order]": "DESC",
            "query[posts_per_page]": "40",
            "query[paged]": "1"
        }
        headers = {
            "Accept-Encoding": "gzip, deflate",
            "Accept": "*/*",
            "Accept-Language": "en-us",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
        }
        self.client.post("/wp-admin/admin-ajax.php", media_body, headers=headers)
        '''
        {% endif %}
    {% endfor %}

class AuthenticatedAdmin(FastHttpUser):
    tasks = {AuthenticatedAdminSequence:1}
    min_wait = 1000
    max_wait = 1000
{% endif %}
