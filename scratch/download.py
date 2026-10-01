import urllib.request
import os

urls = {
    'bkash.svg': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bkash_Logo.svg',
    'nagad.png': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Nagad-Logo.png',
    'rocket.png': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/DBBL_Mobile_Banking_Logo.png',
    'upay.svg': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/UCB_Upay_logo.svg',
    'sslcommerz.png': 'https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-03.png',
    'aamarpay.png': 'https://aamarpay.com/images/logo/aamarpay_logo.png',
    'surjopay.png': 'https://surjopay.com.bd/assets/images/logo-1.png'
}

os.makedirs('public/gateways', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
for filename, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(f'public/gateways/{filename}', 'wb') as out_file:
            data = response.read()
            out_file.write(data)
            print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed {filename}: {e}")
