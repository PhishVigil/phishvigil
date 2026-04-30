# PhishVigil ML Training

Based on dataset from Kaggle: [Phishing URL Detection (111K URLs, 22 Features)](https://www.kaggle.com/datasets/sahandnamvar/phishing-url-detection-111k-urls-22-features)

## Results:
Model - sklearn.tree.DecisionTreeClassifier

Accuracy: 0.962 ± 0.007 (`cross_val_score(cv=4)`)\
False Positive Rate (safe → phishing): 1.6%\
False Negative Rate (phishing → safe): 10.0%

## Quick Start
```bash
cd .\ml\
uv sync
```
Notebook `cwd` should be `ml/notebooks/`