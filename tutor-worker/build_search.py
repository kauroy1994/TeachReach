"""Precompute term postings over the public course passages for the Worker."""
from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import re

GEN = Path(__file__).resolve().parent / "generated"
STOP = set("a an the is are was were will be being been of by from in into on at to for and or if as it its with that this what which why how where when i me my we our you your can could should would please do did does tell explain give about slide slides course module material materials teachreach".split())


def tokens(text):
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in STOP]


def main():
    docs = json.loads((GEN / "sources.json").read_text())
    postings = defaultdict(list)
    for i, doc in enumerate(docs):
        counts = Counter(tokens(doc["text"]))
        title = set(tokens(doc["title"] + " " + doc.get("question", "")))
        length = 0.6 + sum(counts.values()) / 160
        for term in counts.keys() | title:
            tf = counts[term] + 3 * (term in title)
            postings[term].append((i, tf / (tf + length)))
    output = {}
    for term, values in sorted(postings.items()):
        weight = math.log(1 + (len(docs) - len(values) + .5) / (len(values) + .5))
        # Keep frequently used terms searchable in every course and module.
        values.sort(key=lambda pair: (-pair[1], pair[0]))
        if len(values) > 320:
            per_module = Counter()
            retained = []
            for idx, score in values:
                module = docs[idx]["module"]
                if per_module[module] < 8:
                    retained.append((idx, score))
                    per_module[module] += 1
            values = retained
        output[term] = [v for idx, score in values for v in (idx, max(1, round(100 * weight * score)))]
    (GEN / "search.json").write_text(json.dumps(output, separators=(",", ":")))


if __name__ == "__main__":
    main()
