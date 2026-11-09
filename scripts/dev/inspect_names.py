import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
text = open('src/data/bdAdmin.ts', encoding='utf-8-sig').read()
found = {}
for line in text.splitlines():
    m = re.search(r"id:\s*'([^']+)',\s*nameEn:\s*'([^']+)'", line)
    if m:
        found[m.group(1)] = m.group(2)
ids = [l.split(',')[0] for l in open('docs/data/district_points.csv', encoding='utf-8') if l.strip()]
print('ids', len(ids), 'found', len(found))
print('missing', [i for i in ids if i not in found])
for line in text.splitlines():
    if 'nameEn' in line and not re.search(r"id:\s*'([^']+)',\s*nameEn:\s*'([^']+)'", line):
        print('ODD LINE:', line[:250])
