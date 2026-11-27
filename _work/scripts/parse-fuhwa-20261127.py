from pathlib import Path

source = Path('_work/scripts/parse-fuhwa-20261022.py').read_text(encoding='utf-8')
source = source.replace('20261022', '20261127').replace('2026/10/22', '2026/11/27')
exec(compile(source, '_work/scripts/parse-fuhwa-20261127.py', 'exec'))
