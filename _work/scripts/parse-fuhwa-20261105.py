import sys

source = open('_work/scripts/parse-fuhwa-20261022.py', encoding='utf-8').read()
source = source.replace('20261022', '20261105').replace('2026/10/22', '2026/11/05')
exec(compile(source, '_work/scripts/parse-fuhwa-20261105.py', 'exec'), {'__name__': '__main__', 'sys': sys, 'open': open})
