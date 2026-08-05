
# THE WALK — ARCILLA-4 (Étale Core in Python)

import numpy as np

class Sistema:
    def __init__(self, poema):
        self.poema = poema
        self.verso = self.poema.split("\n")
        self.palabra = [p for v in self.verso for p in v.split(" ") if p]
        self.intervalo = [len(p)/10 for p in self.palabra]

def intervalo_a_cartas(intervalos):
    return [
        lambda x, y, i=i: np.sin(x*i) * np.cos(y*i)
        for i in intervalos
    ]

def transformacion_sistema(x, y, sistema):
    return (
        x + 0.2*np.sin(y + len(sistema.intervalo)),
        y + 0.2*np.cos(x + len(sistema.palabra))
    )

def morfismo_etale(f, sistema):
    def g(x, y):
        x2, y2 = transformacion_sistema(x, y, sistema)
        return f(x2, y2)
    return g

def cobertura_etale(cartas, sistema):
    return [
        {
            "base": c,
            "vecinos": [morfismo_etale(f, sistema) for f in cartas]
        }
        for c in cartas
    ]
# -----------------------------------
# HAZ (SHEAF) — COMPATIBILIDAD
# -----------------------------------

def compatibles(f, g, puntos_test, tol=0.01):
    for (x,y) in puntos_test:
        if abs(f(x,y) - g(x,y)) > tol:
            return False
    return True


def filtrar_cartas_compatibles(cartas, puntos_test):
    compatibles_cartas = []

    for f in cartas:
        es_valida = True

        for g in cartas:
            if not compatibles(f, g, puntos_test):
                es_valida = False
                break

        if es_valida:
            compatibles_cartas.append(f)

    return compatibles_cartas


# -----------------------------------
# PEGADO (GLUING)
# -----------------------------------

def pegar(cartas):

    def seccion_global(x,y):
        valores = [f(x,y) for f in cartas]

        if len(valores) == 0:
            return 0

        return sum(valores) / len(valores)

    return seccion_global

def construir_topos(sistema):

    cartas = intervalo_a_cartas(sistema.intervalo)

    cobertura = cobertura_etale(cartas, sistema)

    bases = [c["base"] for c in cobertura]

    puntos_test = [
        (0.1,0.1),
        (0.5,0.5),
        (1.0,1.0)
    ]

    cartas_compatibles = filtrar_cartas_compatibles(
        bases,
        puntos_test
    )

    espacio = pegar(cartas_compatibles)

    return espacio
