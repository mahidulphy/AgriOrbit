import csv
import collections
import sys

sys.stdout.reconfigure(encoding='utf-8')
rows = list(csv.DictReader(open(
    'data/raw/appeears/ecostress/agriorbit-ecostress-bd-districts-ECO-L2T-LSTE-002-results.csv',
    encoding='utf-8')))
print('rows', len(rows))
with_lst = [r for r in rows if r['ECO_L2T_LSTE_002_LST']]
print('with LST', len(with_lst))
for col in [
    'ECO_L2T_LSTE_002_QC_Mandatory_QA_flags_Description',
    'ECO_L2T_LSTE_002_QC_Data_quality_flag_Description',
    'ECO_L2T_LSTE_002_QC_LST_accuracy_Description',
    'ECO_L2T_LSTE_002_QC_Atmospheric_Opacity_Description',
    'ECO_L2T_LSTE_002_cloud_Cloud_Mask_Description',
]:
    print('\n', col)
    for k, v in collections.Counter(r.get(col) for r in with_lst).most_common(10):
        print(' ', v, '|', k)
