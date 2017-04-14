openssl req -x509 -days 365 -newkey rsa:4096 -keyout key.pem -out cert.pem
openssl pkcs12 -export -in cert.pem -inkey key.pem -out cert.pfx