from locust import HttpUser, SequentialTaskSet, task
import re

def get_product_id(content):
    result = re.search(br"sku\"\:\s*(\d+)", content)
    return int(result.group(1))

# Note: SequentialTaskSet tasks are executed in order of declaration
class WooCommerceSequence(SequentialTaskSet):
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Accept": "*/*",
        "Accept-Language": "en-us",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:79.0) Gecko/20100101 Firefox/79.0"
    }
    redirect_path = None

    @task
    def home_page(self):
        response = self.client.get("/", headers=self.headers)

    @task
    def shop_page(self):
        response = self.client.get("{{shop_url}}", headers=self.headers)

    @task
    def product_a(self):
        response = self.client.get(
            "{{product_a_url}}", headers=self.headers)
        product_id = get_product_id(response.content)
        data = {
            "quantity": 1,
            "add-to-cart": product_id
        }
        response = self.client.post(
            "{{product_a_url}}", data, headers=self.headers)

    @task
    def product_b(self):
        response = self.client.get("{{product_b_url}}", headers=self.headers)
        product_id = get_product_id(response.content)
        data = {
            "quantity": "1",
            "add-to-cart": product_id
        }
        response = self.client.post(
            "{{product_b_url}}", data, headers=self.headers)

    @task
    def cart(self):
        response = self.client.get("{{cart_url}}", headers=self.headers)

    @task
    def checkout(self):
        # Go to the cart page.
        response = self.client.get("{{checkout_url}}", headers=self.headers)

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
        url = "{{checkout_url}}/order-received/{0}".format(self.redirect_path)
        self.client.get(url, headers=self.headers,
                        name="{{checkout_url}}/order-received/:order_id")


class WooCommerceUser(HttpUser):
    tasks = {WooCommerceSequence: 1}
    min_wait = 1000
    max_wait = 1000
