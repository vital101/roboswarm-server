from locust import HttpUser, SequentialTaskSet, task

import re

def get_product_id(content):
    result = re.search(br"name=\"add-to-cart\" value=\"(\d+)\"", content)
    return int(result.group(1))

# Note: SequentialTaskSet tasks are executed in order of declaration
class WooCommerceSequence(SequentialTaskSet):
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "DNT": "1",
        "Sec-GPC": "1",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:81.0) Gecko/20100101 Firefox/81.0"
    }
    redirect_path = None

    @task
    def home_page(self):
        self.headers['Referer'] = self.client.base_url
        response = self.client.get("/", headers=self.headers, verify=False)

    @task
    def shop_page(self):
        self.headers['Referer'] = self.client.base_url
        response = self.client.get("{{shop_url}}", headers=self.headers, verify=False)

    @task
    def product_a(self):
        self.headers['Referer'] = self.client.base_url
        response = self.client.get(
            "{{product_a_url}}", headers=self.headers, verify=False)
        product_id = get_product_id(response.content)
        data = {
            "quantity": 1,
            "add-to-cart": product_id
        }
        response = self.client.post(
            "{{product_a_url}}", data, headers=self.headers, verify=False)

    @task
    def product_b(self):
        self.headers['Referer'] = self.client.base_url
        response = self.client.get("{{product_b_url}}", headers=self.headers, verify=False)
        product_id = get_product_id(response.content)
        data = {
            "quantity": "1",
            "add-to-cart": product_id
        }
        response = self.client.post(
            "{{product_b_url}}", data, headers=self.headers, verify=False)

    @task
    def cart(self):
        self.headers['Referer'] = self.client.base_url
        response = self.client.get("{{cart_url}}", headers=self.headers, verify=False)

    @task
    def checkout(self):
        self.headers['Referer'] = self.client.base_url
        # Go to the cart page.
        response = self.client.get("{{checkout_url}}", headers=self.headers, verify=False)

        # Extract the checkout none from the form.
        page_content = response.content
        result = re.search(
            br"id=\"woocommerce-process-checkout-nonce\"\s* name=\"woocommerce-process-checkout-nonce\"\s* value=\"(\w+)\"", page_content)
        checkout_nonce = result.group(1)

        # Data for update_order_review_nonce
        checkout_data = {
            "billing_first_name": "James",
            "billing_last_name": "Doe",
            "billing_company": "Roboswarm.dev",
            "billing_country": "US",
            "billing_address_1": "1010101 First Street",
            "billing_address_2": "",
            "billing_city": "Manistee",
            "billing_state": "MI",
            "billing_postcode": "49660",
            "billing_phone": "555-555-5555",
            "billing_email": "test@example.com",
            "billing_em_ver": "test@example.com",
            "shipping_first_name": "James",
            "shipping_last_name": "Doe",
            "shipping_company": "Roboswarm.dev",
            "shipping_country": "US",
            "shipping_address_1": "1010101 First Street",
            "shipping_address_2": "",
            "shipping_city": "Manistee",
            "shipping_state": "MI",
            "shipping_postcode": "49660",
            "order_comments": "",
            "shipping_method[0]": "flat_rate:1",
            "payment_method": "cod",
            "woocommerce-process-checkout-nonce": checkout_nonce
        }
        headers = self.headers
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        response = self.client.post(
            "/?wc-ajax=checkout", checkout_data, headers=headers)
        self.redirect_path = response.json()['redirect'].split(
            "order-received/").pop()

    @task
    def order_confirmed(self):
        self.headers['Referer'] = self.client.base_url
        url = "{{checkout_url}}/order-received/{0}".format(self.redirect_path)
        self.client.get(url, headers=self.headers, verify=False,
                        name="{{checkout_url}}/order-received/:order_id")


class WooCommerceUser(HttpUser):
    tasks = {WooCommerceSequence: 1}
    wait_time = lambda x: 1