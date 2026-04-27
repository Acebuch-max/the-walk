
import json
import unicodedata
from collections import Counter

LEXICON = {
    "threshold": ["umbral","puerta","borde","paso","cruce","entrar","salir"],
    "negation": ["nada","nadie","nunca","jamas","vacio","no"],
    "cold": ["frio","hielo","nieve","sombra","gris","oscuro"],
    "affection": ["amor","calor","abrazo","ternura","cuidado"],
    "invocation": ["llaman","buscan","rezan","todos","ella"],
    "motion": ["andar","cruzar","llegar","ir","venir","seguir","transitar"]
}

def normalize(text):
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text

def score(text):
    words = text.split()
    counts = Counter(words)
    scores = {}
    total = len(words) if words else 1

    for field, vocab in LEXICON.items():
        s = sum(counts[w] for w in vocab if w in counts)
        scores[field] = round(s / total, 3)

    return scores

def derive_umbral(scores):
    return {
        "apertura": round(scores["threshold"]*0.9 + scores["invocation"]*0.4,3),
        "dispersion": round(scores["motion"]*0.7,3),
        "atraccion_central": round(scores["affection"]*0.8,3),
        "inestabilidad": round(scores["negation"]*0.6,3),
        "retorno": round(scores["threshold"]*0.3 + scores["affection"]*0.3,3)
    }

def main():
    poema = """
    Todos la llaman buscando su calor
    y en el borde del frio
    nadie sabe si entrar
    o quedarse ante el umbral
    """

    text = normalize(poema)
    scores = score(text)
    umbral = derive_umbral(scores)

    result = {
        "id":"ella-b",
        "scores": scores,
        "umbral": umbral
    }

    out = "../data/ella-b.umbral.json"
    with open(out,"w",encoding="utf8") as f:
        json.dump(result,f,indent=2,ensure_ascii=False)

    print("Arcilla generó:", out)

if __name__ == "__main__":
    main()
