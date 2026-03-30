import urllib.request
url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMlSM8Zk6bXrftMZ-Pj0o-Ddod1ANoWDMol2vLQRapze1aU_T0-eSWN5mfprsWKDL5aYCS1AdSnHxR/pub?output=tsv'
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        print("HEADERS:")
        print(resp.headers)
        print("DATA:")
        print(repr(data.decode('utf-8')))
except Exception as e:
    print(e)
