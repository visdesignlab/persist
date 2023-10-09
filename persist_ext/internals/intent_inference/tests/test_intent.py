from unittest import TestCase

import pandas as pd
from intent_inference import compute_predictions, apply_prediction

class TestIntent(TestCase):
    def test(self):
        data = pd.read_csv('src/intent_inference/tests/data/cluster_simple_v1.csv')
        data.reset_index(inplace=True)
        data = data.rename(columns={"index": "__row_id__"})

        preds = compute_predictions(data, data.sample(40)['__row_id__'].tolist(), ['X', 'Y'], n_top_predictions=20)

        selected_prediction = preds[0]
        
        a = apply_prediction(data, selected_prediction)

        print(a)

        self.assertTrue(True)

    def test_always_passes(self):
        self.assertTrue(True)
