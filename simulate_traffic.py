import requests
import random
import string
import time

API_URL = 'http://localhost:3000'
TOKENS = ['tokenA', 'tokenB', 'tokenC', 'evilToken', 'botToken', 'superEvil', 'adminToken', 'nullToken', '']
USER_AGENTS = [
    'Mozilla/5.0', 'curl/7.68.0', 'python-requests/2.32.4', 'Scrapy/2.8.0', 'Wget/1.21', 'spider-bot', 'legit-user'
]

ATTACKS = [
    'normal', 'burst_login', 'unknown_endpoint', 'brute_force', 'malformed', 'rapid_switch', 'botnet'
]

print('Continuous traffic simulation started. Press Ctrl+C to stop.')
while True:
    attack = random.choice(ATTACKS)
    if attack == 'normal':
        for _ in range(random.randint(10, 30)):
            requests.get(f'{API_URL}/api/user', headers={
                'x-api-token': random.choice(TOKENS),
                'User-Agent': random.choice(USER_AGENTS)
            })
            requests.get(f'{API_URL}/api/product', headers={
                'x-api-token': random.choice(TOKENS),
                'User-Agent': random.choice(USER_AGENTS)
            })
            time.sleep(0.01)
    elif attack == 'burst_login':
        for _ in range(random.randint(50, 150)):
            requests.post(f'{API_URL}/api/login', headers={
                'x-api-token': random.choice(TOKENS),
                'User-Agent': random.choice(USER_AGENTS)
            }, json={'username': 'admin', 'password': 'wrong'})
            time.sleep(0.005)
    elif attack == 'unknown_endpoint':
        for _ in range(random.randint(50, 200)):
            endpoint = random.choice(['/api/admin', '/api/hidden', '/api/debug', '/api/unknown', '/api/404', '/api/forbidden'])
            requests.get(f'{API_URL}{endpoint}', headers={
                'x-api-token': random.choice(TOKENS),
                'User-Agent': random.choice(USER_AGENTS)
            })
            time.sleep(0.002)
    elif attack == 'brute_force':
        for _ in range(random.randint(50, 200)):
            rand_token = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            requests.post(f'{API_URL}/api/login', headers={
                'x-api-token': rand_token,
                'User-Agent': random.choice(USER_AGENTS)
            }, json={'username': 'admin', 'password': 'wrong'})
            time.sleep(0.002)
    elif attack == 'malformed':
        for _ in range(random.randint(20, 100)):
            requests.get(f'{API_URL}/api/user', headers={'User-Agent': random.choice(USER_AGENTS)})
            requests.post(f'{API_URL}/api/login', data={'username': 'admin', 'password': 'wrong'})
            time.sleep(0.002)
    elif attack == 'rapid_switch':
        for _ in range(random.randint(50, 200)):
            ep = random.choice(['/api/user', '/api/product', '/api/login', '/api/admin', '/api/hidden'])
            method = random.choice(['get', 'post'])
            headers = {
                'x-api-token': random.choice(TOKENS),
                'User-Agent': random.choice(USER_AGENTS)
            }
            if method == 'get':
                requests.get(f'{API_URL}{ep}', headers=headers)
            else:
                requests.post(f'{API_URL}{ep}', headers=headers, json={'username': 'admin', 'password': 'wrong'})
            time.sleep(0.001)
    elif attack == 'botnet':
        for _ in range(random.randint(20, 100)):
            bot_ip = f'192.168.1.{random.randint(100,200)}'
            requests.get(f'{API_URL}/api/user', headers={
                'x-api-token': 'botToken',
                'User-Agent': 'spider-bot',
                'X-Forwarded-For': bot_ip
            })
            requests.post(f'{API_URL}/api/login', headers={
                'x-api-token': 'botToken',
                'User-Agent': 'spider-bot',
                'X-Forwarded-For': bot_ip
            }, json={'username': 'admin', 'password': 'bot'})
            time.sleep(0.001)
    # Short random pause between attack types
    time.sleep(random.uniform(0.5, 2.0))
