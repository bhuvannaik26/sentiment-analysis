import sys
import json
import joblib
import numpy as np

# Load the model and vectorizer with correct filenames
model = joblib.load('sentiment_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')

# Get input text from command line argument
input_text = sys.argv[1]

# Vectorize and predict
vectorized_text = vectorizer.transform([input_text])
prediction = model.predict(vectorized_text)[0]

# Convert NumPy int to native Python int
prediction = int(prediction)

# Convert prediction to human-readable label
label = "Positive" if prediction == 1 else "Negative"

# Output result
print(json.dumps({"prediction": label}), flush=True)
