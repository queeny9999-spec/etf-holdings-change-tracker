from pathlib import Path
source = Path('_work/scripts/parse-fuhwa-20261022.py').read_text(encoding='utf-8')
source = source.replace('20261022', '20261125').replace('2026/10/22', '2026/11/25')
exec(compile(source, '_work/scripts/parse-fuhwa-20261125.py', 'exec'))
