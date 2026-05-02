import random

with open('Algo-parecido-al-agua.jpg', 'rb') as f:
    datos = bytearray(f.read())

inicio_datos = datos.find(b'\xff\xda')
if inicio_datos == -1:
    inicio_datos = 500
else:
    inicio_datos += 2

num_mutaciones = len(datos[inicio_datos:]) // 100
for _ in range(num_mutaciones):
    idx = random.randint(inicio_datos, len(datos) - 1)
    datos[idx] = random.randint(0, 255)

firma = b'--breath'
pos_firma = random.randint(inicio_datos, len(datos) - len(firma))
datos[pos_firma:pos_firma+len(firma)] = firma

with open('catastrofe_final.jpg', 'wb') as f:
    f.write(datos)

print("Catástrofe completada. Archivo: catastrofe_final.jpg")
