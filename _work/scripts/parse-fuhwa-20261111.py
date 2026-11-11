import sys
source = open('_work/scripts/parse-fuhwa-20261022.py', encoding='utf-8').read()
source = source.replace('20261022', '20261111').replace('2026/10/22', '2026/11/11')
exec(compile(source, '_work/scripts/parse-fuhwa-20261111.py', 'exec'), {'__name__': '__main__', 'sys': sys, 'open': open})
